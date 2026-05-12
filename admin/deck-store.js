const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "viewer", "data");
const DECK_DIR = path.join(DATA_DIR, "decks");
const DECK_INDEX_PATH = path.join(DATA_DIR, "deck-index.json");

const REQUIRED_CARD_FIELDS = ["id", "blueprint", "domain", "topic", "subtopic", "type", "difficulty"];

async function listDecks() {
  const index = await readDeckIndex();
  return index.decks || [];
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

async function importCards(payload) {
  const parsedCards = extractCards(payload.cardsJson);
  const cardErrors = validateCards(parsedCards);
  if (cardErrors.length) {
    const error = new Error("Card validation failed.");
    error.statusCode = 400;
    error.details = cardErrors;
    throw error;
  }

  const index = await readDeckIndex();
  const mode = payload.mode === "new" ? "new" : "existing";
  const replaceDuplicates = Boolean(payload.replaceDuplicates);
  const target = mode === "new"
    ? await createDeck(index, payload)
    : await readExistingDeck(index, payload.deckId);

  const result = mergeCards(target.deckData.cards, parsedCards, replaceDuplicates);
  target.deckData.cards = result.cards;

  await fs.writeFile(target.filePath, `${JSON.stringify(target.deckData, null, 2)}\n`);

  if (mode === "new") {
    index.decks.push(target.indexEntry);
  }
  index.updated = new Date().toISOString().slice(0, 10);
  await fs.writeFile(DECK_INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);

  return {
    deck: target.deckData.deck,
    deckPath: target.indexEntry?.path || target.indexPath,
    added: result.added,
    replaced: result.replaced,
    skipped: result.skipped,
    totalCards: target.deckData.cards.length
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
    type: cleanString(payload.type) || existingCard.type,
    difficulty: cleanString(payload.difficulty) || existingCard.difficulty,
    topic: cleanString(payload.topic) || existingCard.topic,
    subtopic: cleanString(payload.subtopic) || existingCard.subtopic,
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

  await fs.writeFile(target.filePath, `${JSON.stringify(target.deckData, null, 2)}\n`);
  index.updated = new Date().toISOString().slice(0, 10);
  await fs.writeFile(DECK_INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);

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

function extractCards(rawJson) {
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

  const cards = Array.isArray(parsed) ? parsed : parsed.cards;
  if (!Array.isArray(cards)) {
    const error = new Error("JSON must contain a cards array, or be an array of card objects.");
    error.statusCode = 400;
    throw error;
  }

  return cards;
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
  const fileName = `${deckId}.json`;
  const indexPath = `data/decks/${fileName}`;
  const filePath = path.join(DECK_DIR, fileName);
  const nowVersion = payload.newDeckVersion?.trim() || "0.1";

  return {
    filePath,
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

  return { filePath, indexPath, deckData };
}

function mergeCards(existingCards, incomingCards, replaceDuplicates) {
  const cards = [...existingCards];
  const idToIndex = new Map(cards.map((card, index) => [card.id, index]));
  const skipped = [];
  const replaced = [];
  let added = 0;

  incomingCards.forEach((card) => {
    if (idToIndex.has(card.id)) {
      if (replaceDuplicates) {
        cards[idToIndex.get(card.id)] = card;
        replaced.push(card.id);
      } else {
        skipped.push(card.id);
      }
      return;
    }

    idToIndex.set(card.id, cards.length);
    cards.push(card);
    added += 1;
  });

  return { cards, added, replaced, skipped };
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

function summarizeDeck(deckData) {
  const cards = deckData.cards || [];
  const duplicateIds = findDuplicates(cards.map((card) => card.id).filter(Boolean));
  const missingFields = [];
  const cardTypes = countBy(cards, "type");
  const difficulties = countBy(cards, "difficulty");
  const tags = new Map();

  cards.forEach((card) => {
    REQUIRED_CARD_FIELDS.forEach((field) => {
      if (!card[field]) missingFields.push(`${card.id || "Unknown card"} missing ${field}`);
    });

    if (!Array.isArray(card.tags)) {
      missingFields.push(`${card.id || "Unknown card"} missing tags array`);
      return;
    }

    card.tags.forEach((tag) => {
      tags.set(tag, (tags.get(tag) || 0) + 1);
    });
  });

  return {
    totalCards: cards.length,
    cardTypes,
    difficulties,
    tags: Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count })),
    missingFields,
    duplicateIds,
    exportReady: missingFields.length === 0 && duplicateIds.length === 0
  };
}

function countBy(cards, field) {
  return cards.reduce((counts, card) => {
    const key = card[field] || "missing";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
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
  getDeck,
  importCards,
  listDecks,
  updateCard,
  validateCards
};
