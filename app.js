const deckIndexPath = "./data/deck-index.json";
const fallbackDeckPath = "./data/decks/ccnp-encor-350-401-v1.2.json";

const state = {
  deck: null,
  deckIndex: null,
  cards: [],
  filteredCards: [],
  currentIndex: 0,
  answerVisible: false,
  showTags: false,
  shuffle: false,
  mode: "all",
  session: {
    id: `session-${Date.now()}`,
    startedAt: new Date().toISOString(),
    reviewedIds: new Set(),
    correct: 0,
    incorrect: 0,
    skipped: 0
  },
  progress: null
};

const els = {
  deckTitle: document.querySelector("#deckTitle"),
  deckMeta: document.querySelector("#deckMeta"),
  selectedDeck: document.querySelector("#selectedDeck"),
  reviewedMetric: document.querySelector("#reviewedMetric"),
  accuracyMetric: document.querySelector("#accuracyMetric"),
  weakMetric: document.querySelector("#weakMetric"),
  correctMetric: document.querySelector("#correctMetric"),
  incorrectMetric: document.querySelector("#incorrectMetric"),
  skippedMetric: document.querySelector("#skippedMetric"),
  cardPosition: document.querySelector("#cardPosition"),
  filterPanel: document.querySelector("#filterPanel"),
  filterCount: document.querySelector("#filterCount"),
  collapseFiltersButton: document.querySelector("#collapseFiltersButton"),
  searchInput: document.querySelector("#searchInput"),
  domainFilter: document.querySelector("#domainFilter"),
  topicFilter: document.querySelector("#topicFilter"),
  subtopicFilter: document.querySelector("#subtopicFilter"),
  difficultyFilter: document.querySelector("#difficultyFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  tagFilter: document.querySelector("#tagFilter"),
  cardTitle: document.querySelector("#cardTitle"),
  cardBreadcrumb: document.querySelector("#cardBreadcrumb"),
  difficultyMeta: document.querySelector("#difficultyMeta"),
  typeMeta: document.querySelector("#typeMeta"),
  cardMeta: document.querySelector("#cardMeta"),
  frontContent: document.querySelector("#frontContent"),
  backContent: document.querySelector("#backContent"),
  questionFace: document.querySelector("#questionFace"),
  answerFace: document.querySelector("#answerFace"),
  actionBar: document.querySelector("#actionBar"),
  correctButton: document.querySelector("#correctButton"),
  incorrectButton: document.querySelector("#incorrectButton"),
  skipButton: document.querySelector("#skipButton"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  randomButton: document.querySelector("#randomButton"),
  shuffleButton: document.querySelector("#shuffleButton"),
  finishButton: document.querySelector("#finishButton"),
  toggleTagsButton: document.querySelector("#toggleTagsButton"),
  markButton: document.querySelector("#markButton"),
  exportProgressButton: document.querySelector("#exportProgressButton"),
  importProgressInput: document.querySelector("#importProgressInput"),
  resetProgressButton: document.querySelector("#resetProgressButton"),
  weakList: document.querySelector("#weakList"),
  sessionBox: document.querySelector("#sessionBox"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate")
};

init();

async function init() {
  try {
    const deckData = await loadInitialDeck();
    const errors = validateDeck(deckData);
    if (errors.length) {
      throw new Error(errors.join(" "));
    }

    state.deck = deckData.deck;
    state.cards = deckData.cards;
    state.progress = loadProgress();

    hydrateDeckHeader(deckData);
    populateFilters();
    bindEvents();
    applyFilters();
  } catch (error) {
    renderLoadError(error);
  }
}

async function loadInitialDeck() {
  try {
    const indexResponse = await fetch(deckIndexPath);
    if (!indexResponse.ok) {
      throw new Error(`Deck index request failed: ${indexResponse.status}`);
    }

    state.deckIndex = await indexResponse.json();
    const firstDeck = state.deckIndex.decks?.[0];
    if (!firstDeck?.path) {
      throw new Error("Deck index does not list a deck path.");
    }

    return fetchJson(resolveDeckPath(firstDeck.path));
  } catch {
    return fetchJson(fallbackDeckPath);
  }
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Deck request failed: ${response.status}`);
  }
  return response.json();
}

function resolveDeckPath(path) {
  return path.startsWith("./") || path.startsWith("/") ? path : `./${path}`;
}

function validateDeck(deckData) {
  const errors = [];
  const requiredCardFields = ["id", "blueprint", "domain", "topic", "subtopic", "type", "difficulty"];
  const seenIds = new Set();

  if (!deckData.deck || !Array.isArray(deckData.cards)) {
    if (!deckData.deck) errors.push("Missing deck object.");
    if (!Array.isArray(deckData.cards)) errors.push("Missing cards array.");
    return errors;
  }

  deckData.cards.forEach((card, index) => {
    requiredCardFields.forEach((field) => {
      if (!card[field]) {
        errors.push(`Card ${card.id || index} missing ${field}.`);
      }
    });

    if (seenIds.has(card.id)) {
      errors.push(`Duplicate card id: ${card.id}.`);
    }
    seenIds.add(card.id);

    if (!Array.isArray(card.tags)) errors.push(`${card.id || index} tags must be an array.`);
    if (!Array.isArray(card.front)) errors.push(`${card.id || index} front must be an array.`);
    if (!Array.isArray(card.back)) errors.push(`${card.id || index} back must be an array.`);
    [...(card.front || []), ...(card.back || [])].forEach((block, blockIndex) => {
      validateBlock(block, `${card.id || index} block ${blockIndex}`, errors);
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

function hydrateDeckHeader(deckData) {
  els.deckTitle.textContent = deckData.deck.title;
  els.selectedDeck.textContent = deckData.deck.title;
  els.deckMeta.textContent = `${deckData.deck.source || "JSON deck"} | Version ${deckData.deck.version || "0.1"} | ${deckData.cards.length} cards`;
}

function bindEvents() {
  [els.searchInput, els.domainFilter, els.topicFilter, els.subtopicFilter, els.difficultyFilter, els.typeFilter, els.tagFilter].forEach((control) => {
    control.addEventListener("input", () => {
      state.currentIndex = 0;
      applyFilters();
    });
  });

  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      els.modeButtons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
      state.currentIndex = 0;
      applyFilters();
    });
  });

  els.questionFace.addEventListener("click", advanceQuestionFace);
  els.questionFace.addEventListener("keydown", (event) => handleKeyboardAction(event, advanceQuestionFace));
  els.answerFace.addEventListener("click", () => moveCard(1));
  els.answerFace.addEventListener("keydown", (event) => handleKeyboardAction(event, () => moveCard(1)));

  els.correctButton.addEventListener("click", () => scoreCurrentCard("correct"));
  els.incorrectButton.addEventListener("click", () => scoreCurrentCard("incorrect"));
  els.skipButton.addEventListener("click", () => scoreCurrentCard("skipped"));
  els.prevButton.addEventListener("click", () => moveCard(-1));
  els.nextButton.addEventListener("click", () => moveCard(1));
  els.randomButton.addEventListener("click", randomCard);

  els.shuffleButton.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    els.shuffleButton.textContent = state.shuffle ? "Shuffle On" : "Shuffle Off";
    els.shuffleButton.setAttribute("aria-pressed", String(state.shuffle));
    applyFilters();
  });

  els.markButton.addEventListener("click", toggleMarked);
  els.toggleTagsButton.addEventListener("click", toggleTags);
  els.finishButton.addEventListener("click", finishSession);
  els.exportProgressButton.addEventListener("click", exportProgress);
  els.importProgressInput.addEventListener("change", importProgress);
  els.resetProgressButton.addEventListener("click", resetProgress);
  els.collapseFiltersButton.addEventListener("click", () => {
    els.filterPanel.open = false;
    els.questionFace.focus();
  });

  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-reset-filters]")) {
      resetFilters();
    }
  });
}

function populateFilters() {
  setOptions(els.domainFilter, uniqueValues(state.cards, "domain"), "All domains");
  setOptions(els.topicFilter, uniqueValues(state.cards, "topic"), "All topics");
  setOptions(els.subtopicFilter, uniqueValues(state.cards, "subtopic"), "All subtopics");
  setOptions(els.difficultyFilter, uniqueValues(state.cards, "difficulty"), "All difficulties");
  setOptions(els.typeFilter, uniqueValues(state.cards, "type"), "All types");
  setOptions(els.tagFilter, [...new Set(state.cards.flatMap((card) => card.tags || []))].sort(), "All tags");
}

function setOptions(select, values, defaultLabel) {
  select.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = defaultLabel;
  select.append(allOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = titleCase(value);
    select.append(option);
  });
}

function uniqueValues(cards, key) {
  return [...new Set(cards.map((card) => card[key]).filter(Boolean))].sort();
}

function applyFilters() {
  const search = els.searchInput.value.trim().toLowerCase();
  const filters = {
    domain: els.domainFilter.value,
    topic: els.topicFilter.value,
    subtopic: els.subtopicFilter.value,
    difficulty: els.difficultyFilter.value,
    type: els.typeFilter.value,
    tag: els.tagFilter.value
  };

  state.filteredCards = state.cards.filter((card) => {
    const progress = getCardProgress(card.id);
    const matchesMode =
      state.mode === "all" ||
      (state.mode === "weak" && isWeakCard(card)) ||
      (state.mode === "marked" && progress.markedForReview);

    const matchesFilters =
      (!filters.domain || card.domain === filters.domain) &&
      (!filters.topic || card.topic === filters.topic) &&
      (!filters.subtopic || card.subtopic === filters.subtopic) &&
      (!filters.difficulty || card.difficulty === filters.difficulty) &&
      (!filters.type || card.type === filters.type) &&
      (!filters.tag || (card.tags || []).includes(filters.tag));

    const searchable = [
      card.id,
      card.blueprint,
      card.domain,
      card.topic,
      card.subtopic,
      card.difficulty,
      card.type,
      ...(card.tags || []),
      blocksToSearchText(card.front),
      blocksToSearchText(card.back)
    ].join(" ").toLowerCase();

    return matchesMode && matchesFilters && (!search || searchable.includes(search));
  });

  if (state.shuffle) {
    state.filteredCards = [...state.filteredCards].sort(() => Math.random() - 0.5);
  }

  state.currentIndex = clamp(state.currentIndex, 0, Math.max(state.filteredCards.length - 1, 0));
  state.answerVisible = false;
  els.filterCount.textContent = `${state.filteredCards.length} card${state.filteredCards.length === 1 ? "" : "s"}`;
  renderCurrentCard();
  renderStats();
}

function renderCurrentCard() {
  const card = state.filteredCards[state.currentIndex];

  if (!card) {
    renderEmptyState();
    return;
  }

  els.cardTitle.textContent = `${card.blueprint} | ${card.subtopic || card.topic}`;
  els.cardBreadcrumb.textContent = `${card.domain} > ${card.topic}${card.subtopic ? ` > ${card.subtopic}` : ""}`;
  els.difficultyMeta.textContent = titleCase(card.difficulty);
  els.typeMeta.textContent = titleCase(card.type || "card");
  els.cardMeta.replaceChildren(
    pill(`${card.domain} > ${card.topic}${card.subtopic ? ` > ${card.subtopic}` : ""}`),
    pill(titleCase(card.difficulty)),
    pill(titleCase(card.type || "card")),
    ...(card.tags || []).map((tag) => pill(`#${tag}`))
  );
  els.cardMeta.hidden = !state.showTags;
  els.toggleTagsButton.textContent = state.showTags ? "-" : "+";
  els.toggleTagsButton.setAttribute("aria-expanded", String(state.showTags));

  renderBlocks(card.front, els.frontContent);
  renderBlocks(card.back, els.backContent);
  els.answerFace.classList.toggle("is-hidden", !state.answerVisible);
  els.actionBar.classList.toggle("is-hidden", !state.answerVisible);

  const progress = getCardProgress(card.id);
  els.markButton.classList.toggle("is-active", progress.markedForReview);
  els.markButton.setAttribute("aria-pressed", String(progress.markedForReview));
  els.markButton.textContent = progress.markedForReview ? "Flagged" : "Flag";

  els.cardPosition.textContent = `${state.currentIndex + 1} / ${state.filteredCards.length}`;
  els.prevButton.disabled = state.filteredCards.length < 2;
  els.nextButton.disabled = state.filteredCards.length < 2;
  els.randomButton.disabled = state.filteredCards.length < 2;
  [els.correctButton, els.incorrectButton, els.skipButton, els.markButton, els.toggleTagsButton].forEach((button) => {
    button.disabled = false;
  });
}

function renderEmptyState() {
  els.cardTitle.textContent = "No matching cards";
  els.cardBreadcrumb.textContent = "";
  els.difficultyMeta.textContent = "-";
  els.typeMeta.textContent = "-";
  els.cardMeta.replaceChildren();
  els.cardMeta.hidden = true;
  els.frontContent.replaceChildren(els.emptyStateTemplate.content.cloneNode(true));
  els.backContent.replaceChildren();
  els.answerFace.classList.add("is-hidden");
  els.actionBar.classList.add("is-hidden");
  els.cardPosition.textContent = "0 / 0";
  [els.correctButton, els.incorrectButton, els.skipButton, els.prevButton, els.nextButton, els.randomButton, els.markButton, els.toggleTagsButton].forEach((button) => {
    button.disabled = true;
  });
}

function renderBlocks(blocks, target) {
  target.replaceChildren();

  blocks.forEach((block) => {
    if (block.type === "heading") {
      const heading = document.createElement("h3");
      heading.textContent = block.text;
      target.append(heading);
      return;
    }

    if (block.type === "text") {
      const paragraph = document.createElement("p");
      paragraph.textContent = block.text;
      target.append(paragraph);
      return;
    }

    if (block.type === "code" || block.type === "diagram" || block.type === "cli-output") {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      if (block.language) {
        code.dataset.language = block.language;
      }
      code.textContent = block.text;
      pre.append(code);
      target.append(pre);
      return;
    }

    if (block.type === "table") {
      target.append(renderTable(block));
      return;
    }

    if (block.type === "callout") {
      const callout = document.createElement("div");
      callout.className = `callout ${block.style || "note"}`;
      callout.textContent = block.text;
      target.append(callout);
      return;
    }

    if (block.type === "ordered-list" || block.type === "unordered-list") {
      const list = document.createElement(block.type === "ordered-list" ? "ol" : "ul");
      (block.items || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.append(li);
      });
      target.append(list);
      return;
    }

    const fallback = document.createElement("p");
    fallback.textContent = block.text || JSON.stringify(block);
    target.append(fallback);
  });
}

function renderTable(block) {
  const wrap = document.createElement("div");
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  wrap.className = "table-wrap";

  (block.headers || []).forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.append(th);
  });

  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  (block.rows || []).forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.append(td);
    });
    tbody.append(tr);
  });

  table.append(tbody);
  wrap.append(table);
  return wrap;
}

function renderStats() {
  const allProgress = Object.values(state.progress.cards);
  const reviewed = allProgress.filter((cardProgress) => cardProgress.attempts > 0).length;
  const correct = allProgress.reduce((total, cardProgress) => total + cardProgress.correct, 0);
  const incorrect = allProgress.reduce((total, cardProgress) => total + cardProgress.incorrect, 0);
  const skipped = allProgress.reduce((total, cardProgress) => total + cardProgress.skipped, 0);
  const accuracy = correct + incorrect ? Math.round((correct / (correct + incorrect)) * 100) : 0;
  const weakCards = state.cards.filter(isWeakCard);

  els.reviewedMetric.textContent = String(reviewed);
  els.accuracyMetric.textContent = `${accuracy}%`;
  els.weakMetric.textContent = String(weakCards.length);
  els.correctMetric.textContent = String(correct);
  els.incorrectMetric.textContent = String(incorrect);
  els.skippedMetric.textContent = String(skipped);

  renderWeakAreas(weakCards);
}

function renderWeakAreas(weakCards) {
  els.weakList.replaceChildren();

  if (!weakCards.length) {
    const note = document.createElement("p");
    note.textContent = "No weak areas yet. Missed or flagged cards will appear here.";
    els.weakList.append(note);
    return;
  }

  const groups = new Map();
  weakCards.forEach((card) => {
    const key = `${card.blueprint} | ${card.domain} > ${card.topic} > ${card.subtopic || "General"}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  });

  [...groups.entries()].slice(0, 5).forEach(([label, count]) => {
    const item = document.createElement("div");
    item.className = "weak-card";
    const strong = document.createElement("strong");
    strong.textContent = label;
    const span = document.createElement("span");
    span.textContent = `${count} card${count === 1 ? "" : "s"} need attention`;
    item.append(strong, span);
    els.weakList.append(item);
  });
}

function scoreCurrentCard(result) {
  const card = state.filteredCards[state.currentIndex];
  if (!card) return;

  const progress = getCardProgress(card.id);
  const now = new Date().toISOString();

  if (result === "correct") {
    progress.attempts += 1;
    progress.correct += 1;
    state.session.correct += 1;
    progress.confidence = Math.min(5, progress.confidence + 1);
  }

  if (result === "incorrect") {
    progress.attempts += 1;
    progress.incorrect += 1;
    state.session.incorrect += 1;
    progress.confidence = Math.max(1, progress.confidence - 1);
  }

  if (result === "skipped") {
    progress.skipped += 1;
    state.session.skipped += 1;
  }

  progress.lastReviewed = now;
  state.progress.cards[card.id] = progress;
  state.session.reviewedIds.add(card.id);
  saveProgress();
  renderStats();
  moveCard(1);
}

function advanceQuestionFace() {
  if (state.answerVisible) {
    moveCard(1);
    return;
  }

  revealAnswer();
}

function revealAnswer() {
  if (!state.filteredCards[state.currentIndex] || state.answerVisible) return;
  state.answerVisible = true;
  renderCurrentCard();
  els.answerFace.focus();
}

function handleKeyboardAction(event, action) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  action();
}

function toggleMarked() {
  const card = state.filteredCards[state.currentIndex];
  if (!card) return;

  const progress = getCardProgress(card.id);
  progress.markedForReview = !progress.markedForReview;
  state.progress.cards[card.id] = progress;
  saveProgress();
  renderCurrentCard();
  renderStats();
}

function toggleTags() {
  state.showTags = !state.showTags;
  renderCurrentCard();
}

function moveCard(direction) {
  if (!state.filteredCards.length) return;
  state.currentIndex = (state.currentIndex + direction + state.filteredCards.length) % state.filteredCards.length;
  state.answerVisible = false;
  renderCurrentCard();
}

function randomCard() {
  if (state.filteredCards.length < 2) return;
  let nextIndex = state.currentIndex;
  while (nextIndex === state.currentIndex) {
    nextIndex = Math.floor(Math.random() * state.filteredCards.length);
  }
  state.currentIndex = nextIndex;
  state.answerVisible = false;
  renderCurrentCard();
}

function finishSession() {
  const endedAt = new Date().toISOString();
  const summary = {
    id: state.session.id,
    startedAt: state.session.startedAt,
    endedAt,
    cardsReviewed: state.session.reviewedIds.size,
    correct: state.session.correct,
    incorrect: state.session.incorrect,
    skipped: state.session.skipped
  };

  state.progress.sessions.unshift(summary);
  state.progress.sessions = state.progress.sessions.slice(0, 20);
  saveProgress();

  const totalAnswered = summary.correct + summary.incorrect;
  const accuracy = totalAnswered ? Math.round((summary.correct / totalAnswered) * 100) : 0;
  els.sessionBox.replaceChildren(
    makeElement("h3", "Session Summary"),
    makeElement("p", `${summary.cardsReviewed} cards reviewed | ${accuracy}% accuracy | ${summary.skipped} skipped`)
  );

  state.session = {
    id: `session-${Date.now()}`,
    startedAt: new Date().toISOString(),
    reviewedIds: new Set(),
    correct: 0,
    incorrect: 0,
    skipped: 0
  };
}

function resetFilters() {
  els.searchInput.value = "";
  els.domainFilter.value = "";
  els.topicFilter.value = "";
  els.subtopicFilter.value = "";
  els.difficultyFilter.value = "";
  els.typeFilter.value = "";
  els.tagFilter.value = "";
  state.mode = "all";
  els.modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.mode === "all"));
  state.currentIndex = 0;
  applyFilters();
}

function loadProgress() {
  const storageKey = progressKey();
  const legacyStorageKey = legacyProgressKey();
  const fallback = {
    deckId: state.deck.id,
    deckVersion: state.deck.version,
    cards: {},
    sessions: []
  };

  try {
    const stored = localStorage.getItem(storageKey) || localStorage.getItem(legacyStorageKey);
    return { ...fallback, ...(stored ? JSON.parse(stored) : {}) };
  } catch {
    return fallback;
  }
}

function saveProgress() {
  localStorage.setItem(progressKey(), JSON.stringify({
    deckId: state.deck.id,
    deckVersion: state.deck.version,
    cards: state.progress.cards,
    sessions: state.progress.sessions
  }));
}

function progressKey() {
  return `flashcards.progress.${state.deck.id}`;
}

function legacyProgressKey() {
  return `ccnpFlashcards.progress.${state.deck.id}`;
}

function getCardProgress(cardId) {
  return state.progress.cards[cardId] || {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0,
    lastReviewed: null,
    markedForReview: false,
    confidence: 3
  };
}

function isWeakCard(card) {
  const progress = getCardProgress(card.id);
  const answered = progress.correct + progress.incorrect;
  const accuracy = answered ? progress.correct / answered : 1;
  return progress.markedForReview || progress.incorrect >= 2 || (answered >= 2 && accuracy < 0.7) || progress.confidence <= 2;
}

function blocksToSearchText(blocks) {
  return (blocks || []).map((block) => {
    if (block.text) return block.text;
    if (block.items) return block.items.join(" ");
    if (block.headers || block.rows) return [...(block.headers || []), ...(block.rows || []).flat()].join(" ");
    return "";
  }).join(" ");
}

function exportProgress() {
  const data = JSON.stringify(state.progress, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.deck.id}-progress.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importProgress(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      if (imported.deckId && imported.deckId !== state.deck.id) {
        throw new Error("Progress file belongs to a different deck.");
      }
      state.progress = {
        deckId: state.deck.id,
        deckVersion: state.deck.version,
        cards: imported.cards || {},
        sessions: imported.sessions || []
      };
      saveProgress();
      applyFilters();
      els.sessionBox.replaceChildren(makeElement("h3", "Session Summary"), makeElement("p", "Progress imported."));
    } catch (error) {
      els.sessionBox.replaceChildren(makeElement("h3", "Session Summary"), makeElement("p", error.message));
    } finally {
      event.target.value = "";
    }
  });
  reader.readAsText(file);
}

function resetProgress() {
  const confirmed = window.confirm("Reset progress for this deck?");
  if (!confirmed) return;

  state.progress = {
    deckId: state.deck.id,
    deckVersion: state.deck.version,
    cards: {},
    sessions: []
  };
  saveProgress();
  applyFilters();
  els.sessionBox.replaceChildren(makeElement("h3", "Session Summary"), makeElement("p", "Progress reset."));
}

function pill(text) {
  const span = document.createElement("span");
  span.className = "pill";
  span.textContent = text;
  return span;
}

function makeElement(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function titleCase(value) {
  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function renderLoadError(error) {
  els.deckTitle.textContent = "Deck failed to load";
  els.deckMeta.textContent = error.message;
  els.cardTitle.textContent = "Check the JSON file";
  els.frontContent.textContent = "The app could not load or validate the deck. Fix the JSON and refresh the page.";
}
