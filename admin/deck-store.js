const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "viewer", "data");
const DECK_DIR = path.join(DATA_DIR, "decks");
const DECK_INDEX_PATH = path.join(DATA_DIR, "deck-index.json");

const REQUIRED_CARD_FIELDS = ["id", "blueprint", "domain", "topic", "subtopic", "type", "difficulty"];
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_CARD_TYPES = new Set([
  "cli-output",
  "command",
  "compare",
  "concept",
  "config-interpretation",
  "definition",
  "diagram",
  "exam-tip",
  "misconception",
  "scenario",
  "sequence",
  "troubleshooting"
]);

async function listDecks() {
  const index = await readDeckIndex();
  return Promise.all((index.decks || []).map(async (entry) => {
    try {
      const target = await readExistingDeck(index, entry.deckId);
      return {
        ...entry,
        version: target.deckData.deck.version || "",
        cardCount: target.deckData.cards.length
      };
    } catch {
      return {
        ...entry,
        version: "",
        cardCount: null
      };
    }
  }));
}

async function getDeckIndex() {
  const index = await readDeckIndex();
  return {
    index,
    formatted: `${JSON.stringify(index, null, 2)}\n`,
    sync: await checkDeckIndexSync(index)
  };
}

async function getDeck(deckId) {
  const index = await readDeckIndex();
  const target = await readExistingDeck(index, deckId);
  return {
    indexEntry: (index.decks || []).find((deck) => deck.deckId === deckId),
    deck: target.deckData.deck,
    cards: target.deckData.cards,
    summary: summarizeDeck(target.deckData)
  };
}

async function createEmptyDeck(payload) {
  const index = await readDeckIndex();
  const target = await createDeck(index, {
    newDeckTitle: payload.title,
    newDeckId: payload.deckId,
    newDeckSubject: payload.subject,
    newDeckVersion: payload.version,
    newDeckSource: payload.source,
    newDeckTags: payload.tags,
    newDeckDescription: payload.description
  });

  await writeJsonFile(target.filePath, target.deckData);
  index.decks.push(target.indexEntry);
  await writeDeckIndex(index);

  return {
    deck: target.deckData.deck,
    indexEntry: target.indexEntry,
    summary: summarizeDeck(target.deckData)
  };
}

async function updateDeckDetails(payload) {
  const index = await readDeckIndex();
  const target = await readExistingDeck(index, payload.originalDeckId);
  const entry = (index.decks || []).find((deck) => deck.deckId === payload.originalDeckId);
  const nextDeckId = slugify(payload.deckId || target.deckData.deck.id);
  const existingIds = new Set((index.decks || [])
    .map((deck) => deck.deckId)
    .filter((deckId) => deckId !== payload.originalDeckId));

  if (existingIds.has(nextDeckId)) {
    const error = new Error("Deck ID already exists.");
    error.statusCode = 400;
    throw error;
  }

  const title = cleanString(payload.title);
  if (!title) {
    const error = new Error("Deck title is required.");
    error.statusCode = 400;
    throw error;
  }

  target.deckData.deck = {
    ...target.deckData.deck,
    id: nextDeckId,
    title,
    version: cleanString(payload.version) || "0.1",
    source: cleanString(payload.source),
    description: cleanString(payload.description)
  };

  if (entry) {
    entry.deckId = nextDeckId;
    entry.title = title;
    entry.subject = cleanString(payload.subject) || entry.subject || "Flashcards";
    entry.description = cleanString(payload.description);
    entry.tags = normalizeTags(payload.tags);
  }

  if (nextDeckId !== payload.originalDeckId) {
    const nextFilePath = path.join(DECK_DIR, `${nextDeckId}.json`);
    await writeJsonFile(nextFilePath, target.deckData);
    await fs.unlink(target.filePath);
    if (entry) entry.path = `data/decks/${nextDeckId}.json`;
  } else {
    await writeJsonFile(target.filePath, target.deckData);
  }

  await writeDeckIndex(index);
  return {
    deck: target.deckData.deck,
    indexEntry: entry,
    summary: summarizeDeck(target.deckData)
  };
}

async function deleteDeck(deckId) {
  const index = await readDeckIndex();
  const entry = (index.decks || []).find((deck) => deck.deckId === deckId);
  if (!entry) {
    const error = new Error("Select an existing deck.");
    error.statusCode = 404;
    throw error;
  }

  index.decks = (index.decks || []).filter((deck) => deck.deckId !== deckId);
  await writeDeckIndex(index);
  return { deckId, removedPath: entry.path, decks: index.decks };
}

async function cloneDeck(payload) {
  const index = await readDeckIndex();
  const target = await readExistingDeck(index, payload.sourceDeckId);
  const existingIds = new Set((index.decks || []).map((deck) => deck.deckId));
  const title = cleanString(payload.title) || `${target.deckData.deck.title} Copy`;
  const deckId = uniqueSlug(payload.deckId || title, existingIds);
  const cloned = JSON.parse(JSON.stringify(target.deckData));

  cloned.deck = {
    ...cloned.deck,
    id: deckId,
    title,
    version: cleanString(payload.version) || cloned.deck.version || "0.1",
    source: cleanString(payload.source) || cloned.deck.source || "Cloned deck",
    description: cleanString(payload.description) || cloned.deck.description || ""
  };

  if (Array.isArray(cloned.deck.history)) {
    cloned.deck.history = [
      ...cloned.deck.history,
      {
        version: cloned.deck.version,
        date: new Date().toISOString().slice(0, 10),
        notes: `Cloned from ${target.deckData.deck.id}.`
      }
    ];
  }

  const indexEntry = {
    deckId,
    title,
    subject: cleanString(payload.subject) || target.indexEntry?.subject || "Flashcards",
    description: cloned.deck.description,
    path: `data/decks/${deckId}.json`,
    tags: normalizeTags(payload.tags || target.indexEntry?.tags || [])
  };

  await writeJsonFile(path.join(DECK_DIR, `${deckId}.json`), cloned);
  index.decks.push(indexEntry);
  await writeDeckIndex(index);

  return {
    deck: cloned.deck,
    indexEntry,
    summary: summarizeDeck(cloned)
  };
}

async function importDeck(payload) {
  const deckData = parseDeckJson(payload.deckJson);
  const errors = validateDeckData(deckData);
  if (errors.length) {
    const error = new Error("Deck validation failed.");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const index = await readDeckIndex();
  const replaceExisting = Boolean(payload.replaceExisting);
  const existingEntry = (index.decks || []).find((deck) => deck.deckId === deckData.deck.id);
  if (existingEntry && !replaceExisting) {
    const error = new Error("A deck with this ID already exists. Enable replace to import it.");
    error.statusCode = 400;
    throw error;
  }

  const indexEntry = {
    deckId: deckData.deck.id,
    title: deckData.deck.title,
    subject: cleanString(payload.subject) || existingEntry?.subject || "Flashcards",
    description: deckData.deck.description || "",
    path: `data/decks/${deckData.deck.id}.json`,
    tags: normalizeTags(payload.tags || existingEntry?.tags || [])
  };

  await writeJsonFile(path.join(DECK_DIR, `${deckData.deck.id}.json`), deckData);
  if (existingEntry) {
    Object.assign(existingEntry, indexEntry);
  } else {
    index.decks.push(indexEntry);
  }
  await writeDeckIndex(index);

  return {
    deck: deckData.deck,
    indexEntry,
    summary: summarizeDeck(deckData),
    replaced: Boolean(existingEntry)
  };
}

async function importCards(payload) {
  const parsedPayload = parseCardPayload(payload.cardsJson);
  const parsedCards = parsedPayload.cards;
  const cardErrors = validateCards(parsedCards);
  if (cardErrors.length) {
    const error = new Error("Card validation failed.");
    error.statusCode = 400;
    error.details = cardErrors;
    error.summary = buildCardSummary(parsedCards);
    error.payloadType = parsedPayload.payloadType;
    throw error;
  }

  const index = await readDeckIndex();
  const target = await readExistingDeck(index, payload.deckId);
  const result = mergeCards(target.deckData.cards, parsedCards, Boolean(payload.replaceDuplicates));
  target.deckData.cards = result.cards;

  await writeJsonFile(target.filePath, target.deckData);
  await writeDeckIndex(index);

  return {
    deck: target.deckData.deck,
    deckPath: target.indexEntry?.path || target.indexPath,
    added: result.added,
    replaced: result.replaced,
    skipped: result.skipped,
    skippedCards: result.skippedCards,
    importSummary: buildImportSummary(parsedPayload, result),
    cardSummary: buildCardSummary(parsedCards),
    totalCards: target.deckData.cards.length
  };
}

async function validateCardImport(payload) {
  const parsedPayload = parseCardPayload(payload.cardsJson);
  const parsedCards = parsedPayload.cards;
  const index = await readDeckIndex();
  const target = payload.deckId ? await readExistingDeck(index, payload.deckId) : null;
  const existingIds = new Set((target?.deckData.cards || []).map((card) => card.id).filter(Boolean));
  const replaceDuplicates = Boolean(payload.replaceDuplicates);
  const results = buildCardValidationResults(parsedCards, existingIds, replaceDuplicates);
  const invalidCards = results.filter((card) => !card.valid);
  const duplicateCards = results.filter((card) => card.wouldSkip);
  const summary = buildCardSummary(parsedCards);

  return {
    parseStatus: "Parsed",
    payloadType: parsedPayload.payloadType,
    totalCards: parsedCards.length,
    validCards: results.length - invalidCards.length,
    invalidCards,
    duplicateCards,
    summary,
    results
  };
}

async function updateCard(payload) {
  const index = await readDeckIndex();
  const target = await readExistingDeck(index, payload.deckId);
  const cardIndex = target.deckData.cards.findIndex((card) => card.id === payload.cardId);
  if (cardIndex === -1) {
    const error = new Error("Select an existing card.");
    error.statusCode = 404;
    throw error;
  }

  const existingCard = target.deckData.cards[cardIndex];
  const updatedCard = {
    ...existingCard,
    blueprint: cleanString(payload.blueprint) || existingCard.blueprint,
    domain: cleanString(payload.domain) || existingCard.domain,
    type: cleanString(payload.type) || existingCard.type,
    difficulty: cleanString(payload.difficulty) || existingCard.difficulty,
    topic: cleanString(payload.topic) || existingCard.topic,
    subtopic: cleanString(payload.subtopic) || existingCard.subtopic,
    tags: Object.prototype.hasOwnProperty.call(payload, "tags") ? normalizeTags(payload.tags) : existingCard.tags,
    front: Array.isArray(payload.front) ? payload.front : existingCard.front,
    back: Array.isArray(payload.back) ? payload.back : existingCard.back
  };

  target.deckData.cards[cardIndex] = updatedCard;
  const cardErrors = validateCards(target.deckData.cards);
  if (cardErrors.length) {
    const error = new Error("Card validation failed.");
    error.statusCode = 400;
    error.details = cardErrors;
    throw error;
  }

  await writeJsonFile(target.filePath, target.deckData);
  await writeDeckIndex(index);

  return {
    deck: target.deckData.deck,
    card: updatedCard,
    summary: summarizeDeck(target.deckData)
  };
}

async function readDeckIndex() {
  const raw = await fs.readFile(DECK_INDEX_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeDeckIndex(index) {
  index.updated = new Date().toISOString().slice(0, 10);
  await writeJsonFile(DECK_INDEX_PATH, index);
}

async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseDeckJson(rawJson) {
  if (!rawJson || !rawJson.trim()) {
    const error = new Error("Paste deck JSON before importing.");
    error.statusCode = 400;
    throw error;
  }

  try {
    return JSON.parse(rawJson);
  } catch (parseError) {
    const error = new Error(`Invalid JSON: ${parseError.message}`);
    error.statusCode = 400;
    throw error;
  }
}

function validateDeckData(deckData) {
  const errors = [];
  if (!deckData || typeof deckData !== "object" || Array.isArray(deckData)) {
    return ["Deck JSON must be an object."];
  }
  if (!deckData.deck || typeof deckData.deck !== "object" || Array.isArray(deckData.deck)) {
    errors.push("deck object exists.");
  }
  if (!Array.isArray(deckData.cards)) errors.push("cards array exists.");
  if (!deckData.deck?.id) errors.push("deck.id exists.");
  if (!deckData.deck?.title) errors.push("deck.title exists.");
  if (Array.isArray(deckData.cards)) errors.push(...validateCards(deckData.cards));
  return errors;
}

function extractCards(rawJson) {
  return parseCardPayload(rawJson).cards;
}

function parseCardPayload(rawJson) {
  if (!rawJson || !rawJson.trim()) {
    const error = new Error("Paste JSON before importing.");
    error.statusCode = 400;
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawJson);
  } catch (parseError) {
    const error = new Error(`Invalid JSON: ${parseError.message}`);
    error.statusCode = 400;
    throw error;
  }

  let payloadType = "Invalid/unknown";
  let cards;
  if (Array.isArray(parsed)) {
    payloadType = "Cards array";
    cards = parsed;
  } else if (Array.isArray(parsed?.cards) && parsed?.deck && typeof parsed.deck === "object") {
    payloadType = "Full deck object";
    cards = parsed.cards;
  } else if (Array.isArray(parsed?.cards)) {
    payloadType = "Cards-only object";
    cards = parsed.cards;
  } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.id) {
    payloadType = "Single card object";
    cards = [parsed];
  }

  if (!Array.isArray(cards)) {
    const error = new Error("JSON must contain a cards array, or be an array of card objects.");
    error.statusCode = 400;
    throw error;
  }

  return { parsed, payloadType, cards };
}

function validateCards(cards) {
  const errors = [];
  const seenIds = new Set();

  cards.forEach((card, index) => {
    const label = card?.id || `card ${index + 1}`;
    if (!card || typeof card !== "object" || Array.isArray(card)) {
      errors.push(`${label} must be an object.`);
      return;
    }

    REQUIRED_CARD_FIELDS.forEach((field) => {
      if (!card[field]) errors.push(`${label} missing ${field}.`);
    });

    if (seenIds.has(card.id)) errors.push(`Duplicate pasted card id: ${card.id}.`);
    seenIds.add(card.id);

    if (!Array.isArray(card.tags)) errors.push(`${label} tags must be an array.`);
    if (!Array.isArray(card.front)) errors.push(`${label} front must be an array.`);
    if (!Array.isArray(card.back)) errors.push(`${label} back must be an array.`);
    [...(card.front || []), ...(card.back || [])].forEach((block, blockIndex) => {
      validateBlock(block, `${label} block ${blockIndex + 1}`, errors);
    });
  });

  return errors;
}

function validateBlock(block, label, errors) {
  if (!block?.type) {
    errors.push(`${label} missing type.`);
    return;
  }

  if (["text", "heading", "code", "callout", "diagram", "cli-output"].includes(block.type) && !block.text) {
    errors.push(`${label} ${block.type} block missing text.`);
  }

  if (block.type === "table") {
    if (!Array.isArray(block.headers)) errors.push(`${label} table block missing headers array.`);
    if (!Array.isArray(block.rows)) errors.push(`${label} table block missing rows array.`);
  }

  if ((block.type === "ordered-list" || block.type === "unordered-list") && !Array.isArray(block.items)) {
    errors.push(`${label} list block missing items array.`);
  }
}

async function createDeck(index, payload) {
  const title = payload.newDeckTitle?.trim();
  if (!title) {
    const error = new Error("New deck title is required.");
    error.statusCode = 400;
    throw error;
  }

  const existingIds = new Set((index.decks || []).map((deck) => deck.deckId));
  const deckId = uniqueSlug(payload.newDeckId || title, existingIds);
  const indexPath = `data/decks/${deckId}.json`;
  const nowVersion = payload.newDeckVersion?.trim() || "0.1";

  return {
    filePath: path.join(DECK_DIR, `${deckId}.json`),
    indexPath,
    indexEntry: {
      deckId,
      title,
      subject: payload.newDeckSubject?.trim() || "Flashcards",
      description: payload.newDeckDescription?.trim() || "",
      path: indexPath,
      tags: normalizeTags(payload.newDeckTags)
    },
    deckData: {
      deck: {
        id: deckId,
        title,
        version: nowVersion,
        source: payload.newDeckSource?.trim() || "Admin import",
        description: payload.newDeckDescription?.trim() || ""
      },
      cards: []
    }
  };
}

async function readExistingDeck(index, deckId) {
  const entry = (index.decks || []).find((deck) => deck.deckId === deckId);
  if (!entry) {
    const error = new Error("Select an existing deck.");
    error.statusCode = 404;
    throw error;
  }

  const indexPath = entry.path;
  const filePath = path.join(DATA_DIR, path.relative("data", indexPath));
  const deckData = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (!deckData.deck || !Array.isArray(deckData.cards)) {
    const error = new Error(`${entry.title} is not a valid deck file.`);
    error.statusCode = 400;
    throw error;
  }

  return { filePath, indexPath, indexEntry: entry, deckData };
}

function mergeCards(existingCards, incomingCards, replaceDuplicates) {
  const cards = [...existingCards];
  const idToIndex = new Map(cards.map((card, index) => [card.id, index]));
  const skipped = [];
  const skippedCards = [];
  const replaced = [];
  let added = 0;

  incomingCards.forEach((card) => {
    if (idToIndex.has(card.id)) {
      if (replaceDuplicates) {
        cards[idToIndex.get(card.id)] = card;
        replaced.push(card.id);
      } else {
        skipped.push(card.id);
        skippedCards.push({
          id: card.id,
          reason: "Card ID already exists in the selected deck and replacement is off.",
          card
        });
      }
      return;
    }

    idToIndex.set(card.id, cards.length);
    cards.push(card);
    added += 1;
  });

  return { cards, added, replaced, skipped, skippedCards };
}

function buildCardValidationResults(cards, existingIds = new Set(), replaceDuplicates = false) {
  const seenIds = new Set();

  return cards.map((card, index) => {
    const errors = [];
    const id = card?.id || "";
    const label = id || `card ${index + 1}`;

    if (!card || typeof card !== "object" || Array.isArray(card)) {
      errors.push(`${label} must be an object.`);
    } else {
      REQUIRED_CARD_FIELDS.forEach((field) => {
        if (!card[field]) errors.push(`${label} missing ${field}.`);
      });

      if (!Array.isArray(card.tags)) errors.push(`${label} tags must be an array.`);
      if (!Array.isArray(card.front)) errors.push(`${label} front must be an array.`);
      if (!Array.isArray(card.back)) errors.push(`${label} back must be an array.`);
      [...(card.front || []), ...(card.back || [])].forEach((block, blockIndex) => {
        validateBlock(block, `${label} block ${blockIndex + 1}`, errors);
      });
    }

    if (id) {
      if (seenIds.has(id)) errors.push(`Duplicate pasted card id: ${id}.`);
      seenIds.add(id);
    }

    const wouldSkip = Boolean(id && existingIds.has(id) && !replaceDuplicates);
    return {
      index: index + 1,
      id: id || `card ${index + 1}`,
      valid: errors.length === 0,
      errors,
      wouldSkip,
      skipReason: wouldSkip ? "Card ID already exists in the selected deck and replacement is off." : "",
      card
    };
  });
}

function buildImportSummary(parsedPayload, mergeResult) {
  const failedCount = (mergeResult.skipped?.length || 0);
  const importedCount = (mergeResult.added || 0) + (mergeResult.replaced?.length || 0);
  return {
    status: failedCount ? "Partial success" : "Success",
    payloadType: parsedPayload.payloadType,
    totalFound: parsedPayload.cards.length,
    imported: importedCount,
    added: mergeResult.added || 0,
    updated: mergeResult.replaced?.length || 0,
    skipped: mergeResult.skipped?.length || 0,
    duplicateIds: findDuplicates(parsedPayload.cards.map((card) => card?.id).filter(Boolean)),
    validationErrors: 0
  };
}

function buildCardSummary(cards) {
  const safeCards = Array.isArray(cards) ? cards : [];
  const missingRequiredFields = [];
  const invalidTagsFormat = [];
  const invalidFrontBackFormat = [];
  const invalidRenderBlocks = [];
  const renderBlockTypeCounts = {};
  const tags = new Map();

  safeCards.forEach((card, index) => {
    const label = card?.id || `card ${index + 1}`;
    if (!card || typeof card !== "object" || Array.isArray(card)) {
      missingRequiredFields.push(`${label} must be an object`);
      return;
    }

    REQUIRED_CARD_FIELDS.forEach((field) => {
      if (!card[field]) missingRequiredFields.push(`${label} missing ${field}`);
    });

    if (!Array.isArray(card.tags)) {
      invalidTagsFormat.push(`${label} tags must be an array`);
    } else {
      card.tags.forEach((tag) => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    }

    ["front", "back"].forEach((field) => {
      if (!Array.isArray(card[field])) {
        invalidFrontBackFormat.push(`${label} ${field} must be an array`);
        return;
      }
      card[field].forEach((block, blockIndex) => {
        if (block?.type) {
          renderBlockTypeCounts[block.type] = (renderBlockTypeCounts[block.type] || 0) + 1;
        }
        const blockErrors = [];
        validateBlock(block, `${label} ${field} block ${blockIndex + 1}`, blockErrors);
        invalidRenderBlocks.push(...blockErrors);
      });
    });
  });

  return {
    totalCards: safeCards.length,
    blueprints: countBy(safeCards, "blueprint"),
    domains: countBy(safeCards, "domain"),
    topics: countBy(safeCards, "topic"),
    subtopics: countBy(safeCards, "subtopic"),
    typeCounts: countBy(safeCards, "type"),
    difficultyCounts: countBy(safeCards, "difficulty"),
    renderBlockTypeCounts,
    tags: Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count })),
    duplicateIds: findDuplicates(safeCards.map((card) => card?.id).filter(Boolean)),
    missingRequiredFields,
    invalidTagsFormat,
    invalidFrontBackFormat,
    invalidRenderBlocks,
    firstCardId: safeCards[0]?.id || "",
    lastCardId: safeCards[safeCards.length - 1]?.id || ""
  };
}

function summarizeDeck(deckData) {
  const cards = deckData.cards || [];
  const duplicateIds = findDuplicates(cards.map((card) => card.id).filter(Boolean));
  const missingFields = [];
  const invalidBlocks = [];
  const emptyFaces = [];
  const unknownDifficulties = [];
  const unknownTypes = [];
  const missingTags = [];
  const cardTypes = countBy(cards, "type");
  const difficulties = countBy(cards, "difficulty");
  const blueprints = countBy(cards, "blueprint");
  const domains = countBy(cards, "domain");
  const topics = countBy(cards, "topic");
  const subtopics = countBy(cards, "subtopic");
  const tags = new Map();

  cards.forEach((card) => {
    REQUIRED_CARD_FIELDS.forEach((field) => {
      if (!card[field]) missingFields.push(`${card.id || "Unknown card"} missing ${field}`);
    });

    if (!VALID_DIFFICULTIES.has(card.difficulty)) unknownDifficulties.push(`${card.id || "Unknown card"} uses ${card.difficulty || "missing"}.`);
    if (!VALID_CARD_TYPES.has(card.type)) unknownTypes.push(`${card.id || "Unknown card"} uses ${card.type || "missing"}.`);

    if (!Array.isArray(card.tags)) {
      missingFields.push(`${card.id || "Unknown card"} missing tags array`);
      missingTags.push(`${card.id || "Unknown card"} missing tags.`);
    } else {
      if (!card.tags.length) missingTags.push(`${card.id || "Unknown card"} has no tags.`);
      card.tags.forEach((tag) => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    }

    if (!Array.isArray(card.front) || !card.front.length) emptyFaces.push(`${card.id || "Unknown card"} has empty front blocks.`);
    if (!Array.isArray(card.back) || !card.back.length) emptyFaces.push(`${card.id || "Unknown card"} has empty back blocks.`);
    [...(card.front || []), ...(card.back || [])].forEach((block, blockIndex) => {
      const blockErrors = [];
      validateBlock(block, `${card.id || "Unknown card"} block ${blockIndex + 1}`, blockErrors);
      invalidBlocks.push(...blockErrors);
    });
  });

  const health = {
    valid: missingFields.length === 0
      && duplicateIds.length === 0
      && invalidBlocks.length === 0
      && emptyFaces.length === 0
      && unknownDifficulties.length === 0
      && unknownTypes.length === 0,
    missingRequiredFields: missingFields,
    duplicateCardIds: duplicateIds,
    invalidRenderBlocks: invalidBlocks,
    emptyFrontBackBlocks: emptyFaces,
    unknownDifficultyValues: unknownDifficulties,
    unknownCardTypeValues: unknownTypes,
    missingTags
  };

  return {
    totalCards: cards.length,
    cardTypes,
    difficulties,
    blueprints,
    domains,
    topics,
    subtopics,
    tags: Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count })),
    missingFields,
    duplicateIds,
    health,
    coverageWarnings: buildCoverageWarnings(cards, { cardTypes, difficulties, domains, topics }),
    versionHistory: Array.isArray(deckData.deck?.history) ? deckData.deck.history : [],
    exportReady: health.valid
  };
}

function buildCoverageWarnings(cards, stats) {
  const warnings = [];
  if (!cards.length) return ["Deck has no cards yet."];
  if (!stats.difficulties.hard) warnings.push("No hard cards.");
  if (!stats.cardTypes.troubleshooting) warnings.push("No troubleshooting cards.");
  if (!stats.cardTypes["cli-output"]) warnings.push("No CLI-output cards.");

  Object.entries(stats.topics || {}).forEach(([topic, count]) => {
    if (topic !== "missing" && count < 3) warnings.push(`${topic} has very few cards (${count}).`);
  });

  if ((stats.difficulties.easy || 0) / cards.length > 0.65) warnings.push("Difficulty is skewed too easy.");

  const domainCounts = Object.values(stats.domains || {}).filter((count) => count > 0);
  if (domainCounts.length > 1 && Math.max(...domainCounts) > Math.min(...domainCounts) * 3) {
    warnings.push("Domain coverage is uneven.");
  }

  if ((stats.cardTypes.definition || 0) / cards.length > 0.45) warnings.push("Too many definition-only cards.");
  return warnings;
}

async function checkDeckIndexSync(index) {
  const issues = [];
  const deckIds = (index.decks || []).map((deck) => deck.deckId).filter(Boolean);
  findDuplicates(deckIds).forEach((deckId) => issues.push(`Duplicate deck ID in index: ${deckId}.`));

  for (const entry of index.decks || []) {
    if (!entry.path) {
      issues.push(`${entry.deckId || entry.title || "Deck"} is missing a path.`);
      continue;
    }

    try {
      const filePath = path.join(DATA_DIR, path.relative("data", entry.path));
      const deckData = JSON.parse(await fs.readFile(filePath, "utf8"));
      if (!deckData.deck || !Array.isArray(deckData.cards)) {
        issues.push(`${entry.deckId} path does not contain a valid deck file.`);
      } else if (deckData.deck.id !== entry.deckId) {
        issues.push(`${entry.deckId} index ID does not match loaded deck ID ${deckData.deck.id}.`);
      }
    } catch {
      issues.push(`${entry.deckId || entry.path} could not load from ${entry.path}.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function countBy(cards, field) {
  return cards.reduce((counts, card) => {
    const key = card && typeof card === "object" && !Array.isArray(card) && card[field] ? card[field] : "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function uniqueSlug(value, existingIds) {
  const base = slugify(value);
  let candidate = base;
  let suffix = 2;
  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function slugify(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `deck-${Date.now()}`;
}

function normalizeTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return Array.from(duplicates).sort();
}

module.exports = {
  cloneDeck,
  createEmptyDeck,
  deleteDeck,
  getDeck,
  getDeckIndex,
  importCards,
  importDeck,
  listDecks,
  updateCard,
  updateDeckDetails,
  validateCardImport,
  validateCards,
  validateDeckData
};
