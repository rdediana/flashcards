const deckIndexPath = "./data/deck-index.json";
const fallbackDeckPath = "./data/decks/ccnp-encor-350-401-v1.2.json";
const selectedDeckStorageKey = "flashcards.selectedDeckId";

const state = {
  deck: null,
  deckIndex: null,
  deckEntry: null,
  cards: [],
  filteredCards: [],
  currentIndex: 0,
  answerVisible: false,
  showTags: false,
  shuffle: false,
  mode: "all",
  activeView: "review",
  focusMode: false,
  activeSession: false,
  reviewSet: null,
  setSummary: null,
  session: null,
  progress: null
};

const els = {
  deckTitle: document.querySelector("#deckTitle"),
  deckMeta: document.querySelector("#deckMeta"),
  deckPicker: document.querySelector("#deckPicker"),
  reviewedMetric: document.querySelector("#reviewedMetric"),
  accuracyMetric: document.querySelector("#accuracyMetric"),
  weakMetric: document.querySelector("#weakMetric"),
  statsReviewedMetric: document.querySelector("#statsReviewedMetric"),
  statsAccuracyMetric: document.querySelector("#statsAccuracyMetric"),
  statsWeakMetric: document.querySelector("#statsWeakMetric"),
  statsFlaggedMetric: document.querySelector("#statsFlaggedMetric"),
  correctMetric: document.querySelector("#correctMetric"),
  incorrectMetric: document.querySelector("#incorrectMetric"),
  skippedMetric: document.querySelector("#skippedMetric"),
  totalSessionsMetric: document.querySelector("#totalSessionsMetric"),
  totalReviewedMetric: document.querySelector("#totalReviewedMetric"),
  overallAccuracyMetric: document.querySelector("#overallAccuracyMetric"),
  lastReviewedMetric: document.querySelector("#lastReviewedMetric"),
  lastCountMetric: document.querySelector("#lastCountMetric"),
  lastAccuracyMetric: document.querySelector("#lastAccuracyMetric"),
  flaggedMetric: document.querySelector("#flaggedMetric"),
  homeWeakMetric: document.querySelector("#homeWeakMetric"),
  sessionHistoryList: document.querySelector("#sessionHistoryList"),
  homeDashboard: document.querySelector("#homeDashboard"),
  cardPosition: document.querySelector("#cardPosition"),
  filterPanel: document.querySelector("#filterPanel"),
  filterCount: document.querySelector("#filterCount"),
  collapseFiltersButton: document.querySelector("#collapseFiltersButton"),
  focusModeButton: document.querySelector("#focusModeButton"),
  focusMainPanel: document.querySelector("#focusMainPanel"),
  focusDeckTitle: document.querySelector("#focusDeckTitle"),
  focusFilteredMetric: document.querySelector("#focusFilteredMetric"),
  focusReviewedMetric: document.querySelector("#focusReviewedMetric"),
  focusAccuracyMetric: document.querySelector("#focusAccuracyMetric"),
  focusResumeButton: document.querySelector("#focusResumeButton"),
  focusShuffleButton: document.querySelector("#focusShuffleButton"),
  exitFocusButton: document.querySelector("#exitFocusButton"),
  focusMobileDock: document.querySelector("#focusMobileDock"),
  focusStatusBox: document.querySelector("#focusStatusBox"),
  viewButtons: Array.from(document.querySelectorAll(".view-button")),
  searchInput: document.querySelector("#searchInput"),
  domainFilter: document.querySelector("#domainFilter"),
  topicFilter: document.querySelector("#topicFilter"),
  subtopicFilter: document.querySelector("#subtopicFilter"),
  difficultyFilter: document.querySelector("#difficultyFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  tagFilter: document.querySelector("#tagFilter"),
  viewedFilter: document.querySelector("#viewedFilter"),
  cardPanel: document.querySelector(".card-panel"),
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
  startSessionButton: document.querySelector("#startSessionButton"),
  resumeSessionButton: document.querySelector("#resumeSessionButton"),
  endSessionButton: document.querySelector("#endSessionButton"),
  toggleTagsButton: document.querySelector("#toggleTagsButton"),
  markButton: document.querySelector("#markButton"),
  exportProgressButton: document.querySelector("#exportProgressButton"),
  importProgressInput: document.querySelector("#importProgressInput"),
  resetProgressButton: document.querySelector("#resetProgressButton"),
  weakList: document.querySelector("#weakList"),
  resultPanel: document.querySelector(".result-panel"),
  sessionBox: document.querySelector("#sessionBox"),
  summaryPanel: document.querySelector("#summaryPanel"),
  summaryContent: document.querySelector("#summaryContent"),
  reviewAgainButton: document.querySelector("#reviewAgainButton"),
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate")
};

document.body.classList.remove("is-focus-mode");
document.body.dataset.activeView = "dashboard";

init();

async function init() {
  try {
    const initialDeck = await loadInitialDeck();
    applyLoadedDeck(initialDeck.deckData, initialDeck.entry);
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
    const decks = state.deckIndex.decks || [];
    const savedDeckId = localStorage.getItem(selectedDeckStorageKey);
    const selectedDeck = decks.find((deck) => deck.deckId === savedDeckId) || decks[0];
    if (!selectedDeck?.path) {
      throw new Error("Deck index does not list a deck path.");
    }

    return {
      deckData: await fetchJson(resolveDeckPath(selectedDeck.path)),
      entry: selectedDeck
    };
  } catch {
    return {
      deckData: await fetchJson(fallbackDeckPath),
      entry: null
    };
  }
}

async function loadDeckFromSelection(deckId) {
  const entry = (state.deckIndex?.decks || []).find((deck) => deck.deckId === deckId);
  if (!entry?.path) throw new Error("Selected deck is missing a path.");
  const deckData = await fetchJson(resolveDeckPath(entry.path));
  applyLoadedDeck(deckData, entry);
  localStorage.setItem(selectedDeckStorageKey, deckData.deck.id);
  applyFilters();
}

function applyLoadedDeck(deckData, entry) {
  const errors = validateDeck(deckData);
  if (errors.length) {
    throw new Error(errors.join(" "));
  }

  state.deck = deckData.deck;
  state.deckEntry = entry;
  state.cards = deckData.cards;
  state.filteredCards = [];
  state.currentIndex = 0;
  state.answerVisible = false;
  state.showTags = false;
  state.mode = "all";
  state.activeSession = false;
  state.session = null;
  state.reviewSet = null;
  state.setSummary = null;
  state.progress = loadProgress();

  hydrateDeckHeader(deckData);
  populateDeckPicker();
  populateFilters();
  resetFilterControls();
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
  const displayTitle = displayDeckTitle(deckData.deck.title);
  document.title = displayTitle;
  els.deckTitle.textContent = displayTitle;
  els.deckMeta.textContent = `${deckData.deck.source || "JSON deck"} | Version ${deckData.deck.version || "0.1"} | ${deckData.cards.length} cards`;
}

function bindEvents() {
  els.deckPicker.addEventListener("change", async () => {
    try {
      await loadDeckFromSelection(els.deckPicker.value);
    } catch (error) {
      renderLoadError(error);
    }
  });

  [els.searchInput, els.domainFilter, els.topicFilter, els.subtopicFilter, els.difficultyFilter, els.typeFilter, els.tagFilter, els.viewedFilter].forEach((control) => {
    control.addEventListener("input", () => {
      state.currentIndex = 0;
      clearReviewSet();
      applyFilters();
    });
  });

  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      els.modeButtons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
      state.currentIndex = 0;
      clearReviewSet();
      applyFilters();
    });
  });

  els.viewButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.view));
  });

  els.questionFace.addEventListener("click", advanceQuestionFace);
  els.questionFace.addEventListener("keydown", (event) => handleKeyboardAction(event, advanceQuestionFace));
  els.answerFace.addEventListener("click", hideAnswer);
  els.answerFace.addEventListener("keydown", (event) => handleKeyboardAction(event, hideAnswer));

  els.correctButton.addEventListener("click", () => scoreCurrentCard("correct"));
  els.incorrectButton.addEventListener("click", () => scoreCurrentCard("incorrect"));
  els.skipButton.addEventListener("click", () => scoreCurrentCard("skipped"));
  els.prevButton.addEventListener("click", () => moveCard(-1));
  els.nextButton.addEventListener("click", () => moveCard(1));

  els.focusShuffleButton.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    syncShuffleButtons();
    applyFilters();
  });

  els.markButton.addEventListener("click", toggleMarked);
  els.toggleTagsButton.addEventListener("click", toggleTags);
  els.startSessionButton.addEventListener("click", startSession);
  els.resumeSessionButton.addEventListener("click", resumeSession);
  els.endSessionButton.addEventListener("click", endSession);
  els.focusModeButton.addEventListener("click", enterFocusMode);
  els.exitFocusButton.addEventListener("click", exitFocusMode);
  els.focusResumeButton.addEventListener("click", () => setActiveView("review"));
  els.exportProgressButton.addEventListener("click", exportProgress);
  els.importProgressInput.addEventListener("change", importProgress);
  els.resetProgressButton.addEventListener("click", resetProgress);
  els.collapseFiltersButton.addEventListener("click", () => {
    startReviewSet();
  });
  els.reviewAgainButton.addEventListener("click", startReviewSet);
  window.matchMedia("(max-width: 720px)").addEventListener("change", renderViewState);

  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-reset-filters]")) {
      resetFilters();
    }
  });
}

function populateDeckPicker() {
  els.deckPicker.replaceChildren();
  const decks = state.deckIndex?.decks || [];
  const options = decks.length ? decks : [{
    deckId: state.deck?.id || "",
    title: state.deck?.title || "Current deck"
  }];

  options.forEach((deck) => {
    const option = document.createElement("option");
    option.value = deck.deckId;
    option.textContent = deck.title || deck.deckId;
    els.deckPicker.append(option);
  });

  els.deckPicker.value = state.deck?.id || options[0]?.deckId || "";
  els.deckPicker.disabled = options.length < 2;
}

function populateFilters() {
  setOptions(els.domainFilter, uniqueValues(state.cards, "domain"), "All domains");
  setOptions(els.topicFilter, uniqueValues(state.cards, "topic"), "All topics");
  setOptions(els.subtopicFilter, uniqueValues(state.cards, "subtopic"), "All subtopics");
  setOptions(els.difficultyFilter, uniqueValues(state.cards, "difficulty"), "All difficulties");
  setOptions(els.typeFilter, uniqueValues(state.cards, "type"), "All types");
  setOptions(els.tagFilter, [...new Set(state.cards.flatMap((card) => card.tags || []))].sort(), "All tags");
}

function resetFilterControls() {
  els.searchInput.value = "";
  els.domainFilter.value = "";
  els.topicFilter.value = "";
  els.subtopicFilter.value = "";
  els.difficultyFilter.value = "";
  els.typeFilter.value = "";
  els.tagFilter.value = "";
  els.viewedFilter.value = "";
  state.mode = "all";
  els.modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.mode === "all"));
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
    tag: els.tagFilter.value,
    viewed: els.viewedFilter.value
  };

  state.filteredCards = state.cards.filter((card) => {
    const progress = getCardProgress(card.id);
    const isViewed = isViewedCard(progress);
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
      (!filters.tag || (card.tags || []).includes(filters.tag)) &&
      (!filters.viewed || (filters.viewed === "viewed" ? isViewed : !isViewed));

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
  renderViewState();
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
  document.body.classList.toggle("is-answer-visible", state.answerVisible);

  const progress = getCardProgress(card.id);
  els.markButton.classList.toggle("is-active", progress.markedForReview);
  els.markButton.setAttribute("aria-pressed", String(progress.markedForReview));
  els.markButton.textContent = progress.markedForReview ? "Flagged" : "Flag";

  els.cardPosition.textContent = cardPositionLabel();
  els.prevButton.disabled = state.filteredCards.length < 2;
  els.nextButton.disabled = state.filteredCards.length < 2;
  [els.correctButton, els.incorrectButton, els.skipButton, els.markButton, els.toggleTagsButton].forEach((button) => {
    button.disabled = false;
  });
  renderViewState();
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
  document.body.classList.remove("is-answer-visible");
  els.cardPosition.textContent = "0 / 0";
  [els.correctButton, els.incorrectButton, els.skipButton, els.prevButton, els.nextButton, els.markButton, els.toggleTagsButton].forEach((button) => {
    button.disabled = true;
  });
  renderViewState();
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
  const flaggedCards = state.cards.filter((card) => getCardProgress(card.id).markedForReview);
  const sessions = state.progress.sessions || [];
  const lastSession = sessions[0];
  const lastAnswered = lastSession ? lastSession.correct + lastSession.incorrect : 0;
  const lastAccuracy = lastAnswered ? Math.round((lastSession.correct / lastAnswered) * 100) : 0;

  els.reviewedMetric.textContent = String(reviewed);
  els.accuracyMetric.textContent = `${accuracy}%`;
  els.weakMetric.textContent = String(weakCards.length);
  els.correctMetric.textContent = String(correct);
  els.incorrectMetric.textContent = String(incorrect);
  els.skippedMetric.textContent = String(skipped);
  els.statsReviewedMetric.textContent = String(reviewed);
  els.statsAccuracyMetric.textContent = `${accuracy}%`;
  els.statsWeakMetric.textContent = String(weakCards.length);
  els.statsFlaggedMetric.textContent = String(flaggedCards.length);
  els.focusReviewedMetric.textContent = String(reviewed);
  els.focusAccuracyMetric.textContent = `${accuracy}%`;
  els.totalSessionsMetric.textContent = String(sessions.length);
  els.totalReviewedMetric.textContent = String(sessions.reduce((total, session) => total + (session.cardsReviewed || 0), 0));
  els.overallAccuracyMetric.textContent = `${accuracy}%`;
  els.lastReviewedMetric.textContent = lastSession ? formatShortDate(lastSession.endedAt) : "None";
  els.lastCountMetric.textContent = String(lastSession?.cardsReviewed || 0);
  els.lastAccuracyMetric.textContent = `${lastAccuracy}%`;
  els.flaggedMetric.textContent = String(flaggedCards.length);
  els.homeWeakMetric.textContent = String(weakCards.length);

  renderWeakAreas(weakCards);
  renderSessionHistory();
  renderFocusMain();
}

function renderSessionHistory() {
  els.sessionHistoryList.replaceChildren();

  const sessions = state.progress.sessions || [];
  if (!sessions.length) {
    els.sessionHistoryList.append(makeElement("p", "No completed sessions yet."));
    return;
  }

  sessions.slice(0, 5).forEach((session) => {
    const totalAnswered = session.correct + session.incorrect;
    const accuracy = totalAnswered ? Math.round((session.correct / totalAnswered) * 100) : 0;
    const item = document.createElement("article");
    item.className = "session-history-card";
    item.append(
      makeElement("strong", formatShortDate(session.endedAt)),
      makeElement("span", `${session.cardsReviewed} reviewed | ${accuracy}% accuracy | ${session.skipped} skipped`)
    );
    els.sessionHistoryList.append(item);
  });
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
  ensureActiveSession();

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
  recordReviewSetResult(card.id, result);

  if (isReviewSetComplete()) {
    completeReviewSet();
    return;
  }

  moveToNextUnscored(1);
}

function advanceQuestionFace() {
  if (state.answerVisible) {
    hideAnswer();
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

function hideAnswer() {
  if (!state.answerVisible) return;
  state.answerVisible = false;
  renderCurrentCard();
  els.questionFace.focus();
}

function handleKeyboardAction(event, action) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  action();
}

function toggleMarked() {
  const card = state.filteredCards[state.currentIndex];
  if (!card) return;
  ensureActiveSession();

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

function moveToNextUnscored(direction) {
  if (!state.filteredCards.length) return;

  if (!state.reviewSet || state.reviewSet.scoredIds.size >= state.reviewSet.ids.length) {
    moveCard(direction);
    return;
  }

  const startIndex = state.currentIndex;
  let nextIndex = startIndex;

  do {
    nextIndex = (nextIndex + direction + state.filteredCards.length) % state.filteredCards.length;
    const nextCard = state.filteredCards[nextIndex];
    if (nextCard && !state.reviewSet.scoredIds.has(nextCard.id)) {
      state.currentIndex = nextIndex;
      state.answerVisible = false;
      renderCurrentCard();
      return;
    }
  } while (nextIndex !== startIndex);

  renderCurrentCard();
}

function finishSession() {
  endSession();
}

function startSession() {
  state.session = createSession();
  state.activeSession = true;
  enterFocusMode("main");
  renderStats();
}

function resumeSession() {
  ensureActiveSession();
  enterFocusMode("main");
  renderStats();
}

function endSession() {
  if (!state.activeSession || !state.session) return;

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
  saveProgress();

  const totalAnswered = summary.correct + summary.incorrect;
  const accuracy = totalAnswered ? Math.round((summary.correct / totalAnswered) * 100) : 0;
  els.sessionBox.replaceChildren(
    makeElement("h3", "Session Summary"),
    makeElement("p", `${summary.cardsReviewed} cards reviewed | ${accuracy}% accuracy | ${summary.skipped} skipped`)
  );

  state.activeSession = false;
  state.session = null;
  state.focusMode = false;
  state.activeView = "review";
  renderStats();
  renderViewState();
}

function ensureActiveSession() {
  if (state.activeSession && state.session) return;
  state.session = createSession();
  state.activeSession = true;
  renderViewState();
}

function createSession() {
  return {
    id: `session-${Date.now()}`,
    startedAt: new Date().toISOString(),
    reviewedIds: new Set(),
    correct: 0,
    incorrect: 0,
    skipped: 0
  };
}

function startReviewSet() {
  ensureActiveSession();
  state.currentIndex = clamp(state.currentIndex, 0, Math.max(state.filteredCards.length - 1, 0));
  state.answerVisible = false;
  state.setSummary = null;
  state.reviewSet = {
    ids: state.filteredCards.map((card) => card.id),
    scoredIds: new Set(),
    correct: 0,
    incorrect: 0,
    skipped: 0,
    startedAt: new Date().toISOString()
  };

  enterFocusMode();
  setActiveView("review");
  els.filterPanel.open = false;
  renderSummary();
  renderCurrentCard();
  els.questionFace.focus();
}

function clearReviewSet() {
  state.reviewSet = null;
  state.setSummary = null;
  renderSummary();
}

function recordReviewSetResult(cardId, result) {
  if (!state.reviewSet || state.reviewSet.scoredIds.has(cardId)) return;

  state.reviewSet.scoredIds.add(cardId);
  state.reviewSet[result] += 1;
}

function isReviewSetComplete() {
  return Boolean(state.reviewSet?.ids.length && state.reviewSet.scoredIds.size >= state.reviewSet.ids.length);
}

function completeReviewSet() {
  const totalAnswered = state.reviewSet.correct + state.reviewSet.incorrect;
  const accuracy = totalAnswered ? Math.round((state.reviewSet.correct / totalAnswered) * 100) : 0;
  state.setSummary = {
    cardsReviewed: state.reviewSet.scoredIds.size,
    totalCards: state.reviewSet.ids.length,
    correct: state.reviewSet.correct,
    incorrect: state.reviewSet.incorrect,
    skipped: state.reviewSet.skipped,
    accuracy
  };

  state.answerVisible = false;
  state.focusMode = true;
  setActiveView("main");
  renderCurrentCard();
  renderSummary();
}

function renderSummary() {
  if (!els.summaryContent) return;

  if (!state.setSummary) {
    els.summaryContent.replaceChildren(makeElement("p", "Complete a filtered card set to see a summary."));
    return;
  }

  const summary = state.setSummary;
  els.summaryContent.replaceChildren(
    summaryMetric("Reviewed", `${summary.cardsReviewed} / ${summary.totalCards}`),
    summaryMetric("Accuracy", `${summary.accuracy}%`),
    summaryMetric("Correct", String(summary.correct)),
    summaryMetric("Incorrect", String(summary.incorrect)),
    summaryMetric("Skipped", String(summary.skipped))
  );
  els.sessionBox.replaceChildren(
    makeElement("h3", "Card Set Summary"),
    makeElement("p", `${summary.cardsReviewed} cards reviewed | ${summary.accuracy}% accuracy | ${summary.skipped} skipped`)
  );
}

function summaryMetric(label, value) {
  const article = document.createElement("article");
  article.className = "metric-card";
  article.append(makeElement("span", label), makeElement("strong", value));
  return article;
}

function cardPositionLabel() {
  if (!state.reviewSet?.ids.length) {
    return `${state.currentIndex + 1} / ${state.filteredCards.length}`;
  }

  const nextCount = Math.min(state.reviewSet.scoredIds.size + 1, state.reviewSet.ids.length);
  return `${nextCount} / ${state.reviewSet.ids.length}`;
}

function setFocusMode(enabled) {
  state.focusMode = Boolean(enabled);
  renderViewState();
}

function enterFocusMode(view = state.activeView) {
  ensureActiveSession();
  state.focusMode = true;
  state.activeView = view;
  if (!["main", "filters", "review", "progress"].includes(state.activeView)) {
    state.activeView = "main";
  }
  renderViewState();
}

function exitFocusMode() {
  state.focusMode = false;
  state.activeView = "review";
  els.filterPanel.open = true;
  renderViewState();
}

function setActiveView(view) {
  state.activeView = view;
  if (state.focusMode && view === "filters") els.filterPanel.open = true;
  renderViewState();
}

function renderViewState() {
  const showFocusMain = state.focusMode && state.activeView === "main";
  const showFilters = state.focusMode && state.activeView === "filters";
  const showReview = state.focusMode && state.activeView === "review";
  const showProgress = state.focusMode && state.activeView === "progress";
  const showSummary = state.focusMode && state.activeView === "main" && Boolean(state.setSummary);

  document.body.dataset.activeView = state.focusMode ? state.activeView : "dashboard";
  document.body.classList.toggle("is-focus-mode", state.focusMode);
  els.homeDashboard.hidden = state.focusMode;
  document.querySelector(".overview-panel").hidden = state.focusMode;
  els.focusMainPanel.hidden = !showFocusMain;
  els.filterPanel.hidden = !showFilters;
  els.filterPanel.open = state.focusMode ? state.activeView === "filters" : els.filterPanel.open;
  els.cardPanel.hidden = !showReview;
  els.resultPanel.hidden = !showProgress;
  els.summaryPanel.hidden = !showSummary;
  els.focusMobileDock.hidden = !state.focusMode;
  els.focusModeButton.hidden = state.focusMode;
  els.startSessionButton.hidden = state.activeSession;
  els.resumeSessionButton.hidden = !state.activeSession;
  els.endSessionButton.hidden = !state.activeSession;

  els.focusModeButton.classList.toggle("is-active", state.focusMode);
  els.focusModeButton.setAttribute("aria-pressed", String(state.focusMode));
  els.focusModeButton.textContent = state.focusMode ? "Exit Focus" : "Focus Mode";
  els.viewButtons.forEach((button) => {
    const isActive = button.dataset.view === state.activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  renderFocusStatus();
  renderFocusMain();
}

function renderFocusMain() {
  if (!state.deck) return;
  els.focusDeckTitle.textContent = state.deck.title;
  els.focusFilteredMetric.textContent = String(state.filteredCards.length);
}

function renderFocusStatus() {
  if (!state.deck) return;

  const filterSummary = activeFilterSummary();
  const position = state.filteredCards.length ? cardPositionLabel() : "0 / 0";
  const parts = [abbreviateDeckTitle(state.deck.title), filterSummary, position].filter(Boolean);
  els.focusStatusBox.textContent = parts.join(" | ");
}

function activeFilterSummary() {
  const values = [
    els.searchInput.value.trim(),
    els.domainFilter.value,
    els.topicFilter.value,
    els.subtopicFilter.value,
    els.difficultyFilter.value,
    els.typeFilter.value,
    els.tagFilter.value,
    els.viewedFilter.value
  ].filter(Boolean);

  if (state.mode !== "all") values.push(titleCase(state.mode));
  if (!values.length) return "All cards";
  return values.slice(0, 2).map(titleCase).join(", ");
}

function abbreviateDeckTitle(title) {
  return displayDeckTitle(title).replace("Flashcards", "").trim();
}

function displayDeckTitle(title) {
  return String(title || "Flashcards")
    .replace(/\bCCNP\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim() || "Flashcards";
}

function syncShuffleButtons() {
  const label = state.shuffle ? "Shuffle On" : "Shuffle Off";
  els.focusShuffleButton.textContent = label;
  els.focusShuffleButton.setAttribute("aria-pressed", String(state.shuffle));
}

function resetFilters() {
  resetFilterControls();
  state.currentIndex = 0;
  clearReviewSet();
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

function isViewedCard(progress) {
  return progress.attempts > 0 || progress.skipped > 0 || Boolean(progress.lastReviewed);
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

function formatShortDate(value) {
  if (!value) return "None";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
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
