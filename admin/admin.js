const state = {
  activeTool: "dashboard",
  decks: [],
  deckIndex: null,
  deckIndexFormatted: "",
  deckIndexSync: null,
  currentDeck: null,
  currentDeckDetails: null,
  cards: [],
  selectedCardId: null,
  editMode: false,
  deckModalMode: "create",
  lastSkippedCards: []
};

const els = {
  currentDeckLine: document.querySelector("#currentDeckLine"),
  navDeckName: document.querySelector("#navDeckName"),
  navButtons: Array.from(document.querySelectorAll("[data-tool]")),
  mobileToolSelect: document.querySelector("#mobileToolSelect"),
  toolViews: Array.from(document.querySelectorAll("[data-tool-view]")),
  existingDeckFields: document.querySelector("#existingDeckFields"),
  deckSelect: document.querySelector("#deckSelect"),
  replaceDuplicates: document.querySelector("#replaceDuplicates"),
  clearJsonAfterImport: document.querySelector("#clearJsonAfterImport"),
  cardsJson: document.querySelector("#cardsJson"),
  importButton: document.querySelector("#importButton"),
  importSummary: document.querySelector("#importSummary"),
  exportSkippedCardsButton: document.querySelector("#exportSkippedCardsButton"),
  importDeckTitle: document.querySelector("#importDeckTitle"),
  importDeckId: document.querySelector("#importDeckId"),
  importDeckSubject: document.querySelector("#importDeckSubject"),
  importDeckVersion: document.querySelector("#importDeckVersion"),
  importDeckCardCount: document.querySelector("#importDeckCardCount"),
  importDeckDescription: document.querySelector("#importDeckDescription"),
  deckIndexTableBody: document.querySelector("#deckIndexTableBody"),
  deckIndexSyncStatus: document.querySelector("#deckIndexSyncStatus"),
  deckIndexSyncList: document.querySelector("#deckIndexSyncList"),
  showDeckIndexButton: document.querySelector("#showDeckIndexButton"),
  deckIndexDialog: document.querySelector("#deckIndexDialog"),
  deckIndexJsonView: document.querySelector("#deckIndexJsonView"),
  createDeckButton: document.querySelector("#createDeckButton"),
  deckDetailsForm: document.querySelector("#deckDetailsForm"),
  deckManagerId: document.querySelector("#deckManagerId"),
  deckManagerTitle: document.querySelector("#deckManagerTitle"),
  deckManagerVersion: document.querySelector("#deckManagerVersion"),
  deckManagerSubject: document.querySelector("#deckManagerSubject"),
  deckManagerSource: document.querySelector("#deckManagerSource"),
  deckManagerTags: document.querySelector("#deckManagerTags"),
  deckManagerDescription: document.querySelector("#deckManagerDescription"),
  saveDeckDetailsButton: document.querySelector("#saveDeckDetailsButton"),
  resetDeckDetailsButton: document.querySelector("#resetDeckDetailsButton"),
  deckDetailsStatus: document.querySelector("#deckDetailsStatus"),
  deckStatsTotal: document.querySelector("#deckStatsTotal"),
  deckStatsBlueprintTotal: document.querySelector("#deckStatsBlueprintTotal"),
  deckStatsDomainTotal: document.querySelector("#deckStatsDomainTotal"),
  deckStatsTopicTotal: document.querySelector("#deckStatsTopicTotal"),
  deckStatsDimension: document.querySelector("#deckStatsDimension"),
  deckStatsSearch: document.querySelector("#deckStatsSearch"),
  deckStatsResultCount: document.querySelector("#deckStatsResultCount"),
  deckStatsList: document.querySelector("#deckStatsList"),
  validateDeckButton: document.querySelector("#validateDeckButton"),
  exportDeckButton: document.querySelector("#exportDeckButton"),
  cloneDeckButton: document.querySelector("#cloneDeckButton"),
  deleteDeckButton: document.querySelector("#deleteDeckButton"),
  deckImportJson: document.querySelector("#deckImportJson"),
  replaceDeckImport: document.querySelector("#replaceDeckImport"),
  importDeckButton: document.querySelector("#importDeckButton"),
  deckActionStatus: document.querySelector("#deckActionStatus"),
  deckHealthStatus: document.querySelector("#deckHealthStatus"),
  deckHealthList: document.querySelector("#deckHealthList"),
  deckCoverageWarnings: document.querySelector("#deckCoverageWarnings"),
  deckVersionNotes: document.querySelector("#deckVersionNotes"),
  deckModal: document.querySelector("#deckModal"),
  deckModalTitle: document.querySelector("#deckModalTitle"),
  modalDeckTitle: document.querySelector("#modalDeckTitle"),
  modalDeckId: document.querySelector("#modalDeckId"),
  modalDeckVersion: document.querySelector("#modalDeckVersion"),
  modalDeckSubject: document.querySelector("#modalDeckSubject"),
  modalDeckSource: document.querySelector("#modalDeckSource"),
  modalDeckTags: document.querySelector("#modalDeckTags"),
  modalDeckDescription: document.querySelector("#modalDeckDescription"),
  cancelDeckModalButton: document.querySelector("#cancelDeckModalButton"),
  submitDeckModalButton: document.querySelector("#submitDeckModalButton"),
  dashboardDeckName: document.querySelector("#dashboardDeckName"),
  totalCardsMetric: document.querySelector("#totalCardsMetric"),
  readinessMetric: document.querySelector("#readinessMetric"),
  cardTypesList: document.querySelector("#cardTypesList"),
  difficultyList: document.querySelector("#difficultyList"),
  tagsList: document.querySelector("#tagsList"),
  missingFieldsList: document.querySelector("#missingFieldsList"),
  duplicateIdsList: document.querySelector("#duplicateIdsList"),
  readinessDetail: document.querySelector("#readinessDetail"),
  cardSearchInput: document.querySelector("#cardSearchInput"),
  cardList: document.querySelector("#cardList"),
  editorCardId: document.querySelector("#editorCardId"),
  editorCardType: document.querySelector("#editorCardType"),
  editorCardDifficulty: document.querySelector("#editorCardDifficulty"),
  editorCardTopic: document.querySelector("#editorCardTopic"),
  editorCardSubtopic: document.querySelector("#editorCardSubtopic"),
  editorFront: document.querySelector("#editorFront"),
  editorBack: document.querySelector("#editorBack"),
  editorPreview: document.querySelector("#editorPreview"),
  editCardButton: document.querySelector("#editCardButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  saveCardButton: document.querySelector("#saveCardButton"),
  editorStatus: document.querySelector("#editorStatus"),
  validateCardsButton: document.querySelector("#validateCardsButton"),
  validatorReplaceDuplicates: document.querySelector("#validatorReplaceDuplicates"),
  validatorCardsJson: document.querySelector("#validatorCardsJson"),
  validatorTotalCards: document.querySelector("#validatorTotalCards"),
  validatorValidCards: document.querySelector("#validatorValidCards"),
  validatorInvalidCards: document.querySelector("#validatorInvalidCards"),
  validatorResults: document.querySelector("#validatorResults")
};

init();

async function init() {
  bindEvents();
  await loadDecks();
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTool(button.dataset.tool));
  });

  els.mobileToolSelect.addEventListener("change", () => {
    setActiveTool(els.mobileToolSelect.value);
  });

  els.deckSelect.addEventListener("change", async () => {
    await loadDeckDetails(els.deckSelect.value);
  });

  els.importButton.addEventListener("click", importCards);
  els.exportSkippedCardsButton.addEventListener("click", exportSkippedCards);
  els.showDeckIndexButton.addEventListener("click", showDeckIndexJson);
  els.createDeckButton.addEventListener("click", () => openDeckModal("create"));
  els.deckDetailsForm.addEventListener("submit", saveDeckDetails);
  els.resetDeckDetailsButton.addEventListener("click", renderDeckDetailsForm);
  els.deckStatsDimension.addEventListener("change", () => {
    els.deckStatsSearch.value = "";
    renderDeckStatistics();
  });
  els.deckStatsSearch.addEventListener("input", renderDeckStatistics);
  els.validateDeckButton.addEventListener("click", () => {
    renderDeckManager();
    renderDeckActionStatus("Validation refreshed.", "success");
  });
  els.exportDeckButton.addEventListener("click", exportSelectedDeck);
  els.cloneDeckButton.addEventListener("click", () => openDeckModal("clone"));
  els.deleteDeckButton.addEventListener("click", deleteSelectedDeck);
  els.importDeckButton.addEventListener("click", importFullDeck);
  els.cancelDeckModalButton.addEventListener("click", () => els.deckModal.close());
  els.submitDeckModalButton.addEventListener("click", submitDeckModal);
  els.modalDeckTitle.addEventListener("input", () => {
    if (!els.modalDeckId.dataset.touched) {
      els.modalDeckId.value = slugify(els.modalDeckTitle.value);
    }
  });
  els.modalDeckId.addEventListener("input", () => {
    els.modalDeckId.dataset.touched = "true";
  });
  els.cardSearchInput.addEventListener("input", renderCardList);
  els.editCardButton.addEventListener("click", enterEditMode);
  els.cancelEditButton.addEventListener("click", cancelEdit);
  els.saveCardButton.addEventListener("click", saveSelectedCard);
  els.validateCardsButton.addEventListener("click", validatePastedCards);
  [els.editorCardType, els.editorCardDifficulty, els.editorCardTopic, els.editorCardSubtopic, els.editorFront, els.editorBack].forEach((input) => {
    input.addEventListener("input", renderDraftPreview);
  });
}

async function loadDecks() {
  try {
    const [decksResponse, indexResponse] = await Promise.all([
      fetch("/api/decks"),
      fetch("/api/deck-index")
    ]);
    const data = await decksResponse.json();
    const indexData = await indexResponse.json();
    if (!decksResponse.ok) throw new Error(data.error || "Could not load decks.");
    if (!indexResponse.ok) throw new Error(indexData.error || "Could not load deck index.");
    state.decks = data.decks || [];
    state.deckIndex = indexData.index;
    state.deckIndexFormatted = indexData.formatted || "";
    state.deckIndexSync = indexData.sync;
    renderDeckOptions();
    renderDeckIndexTable();
    renderDeckIndexSync();
    if (state.decks[0]) {
      await loadDeckDetails(state.decks[0].deckId);
    }
  } catch (error) {
    renderSummary(error.message, "error");
    renderEmptyDeckState(error.message);
  }
}

async function loadDeckDetails(deckId) {
  if (!deckId) return;

  try {
    const response = await fetch(`/api/deck?deckId=${encodeURIComponent(deckId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load deck.");

    state.currentDeck = data.deck;
    state.currentDeckDetails = data;
    state.cards = data.cards || [];
    if (els.deckSelect.value !== deckId) {
      els.deckSelect.value = deckId;
    }
    state.editMode = false;
    state.selectedCardId = state.selectedCardId && state.cards.some((card) => card.id === state.selectedCardId)
      ? state.selectedCardId
      : state.cards[0]?.id || null;

    renderCurrentDeck();
    renderDashboard();
    renderDeckManager();
    renderImportDeckDetails();
    renderCardList();
    renderSelectedCard();
  } catch (error) {
    renderSummary(error.message, "error");
    renderEmptyDeckState(error.message);
  }
}

function setActiveTool(tool) {
  state.activeTool = tool;
  els.navButtons.forEach((button) => {
    const isActive = button.dataset.tool === tool;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });
  els.mobileToolSelect.value = tool;
  els.toolViews.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.toolView === tool);
  });
}

function renderDeckOptions() {
  els.deckSelect.replaceChildren();
  state.decks.forEach((deck) => {
    const option = document.createElement("option");
    option.value = deck.deckId;
    option.textContent = `${deck.title} (${deck.deckId})`;
    els.deckSelect.append(option);
  });

  if (!state.decks.length) {
    const option = document.createElement("option");
    option.textContent = "No decks found";
    els.deckSelect.append(option);
  }
}

function renderCurrentDeck() {
  const title = state.currentDeck?.title || "No deck selected";
  els.currentDeckLine.textContent = `Current Deck: ${title}`;
  els.navDeckName.textContent = title;
  els.dashboardDeckName.textContent = title;
}

function renderDashboard() {
  const summary = state.currentDeckDetails?.summary;
  if (!summary) return;

  els.totalCardsMetric.textContent = summary.totalCards;
  els.readinessMetric.textContent = summary.exportReady ? "Ready" : "Needs review";
  els.readinessMetric.classList.toggle("is-ready", summary.exportReady);
  els.readinessDetail.textContent = summary.exportReady
    ? "No missing required fields or duplicate card IDs were found."
    : "Review missing fields or duplicate card IDs before exporting.";

  renderStatList(els.cardTypesList, summary.cardTypes);
  renderStatList(els.difficultyList, summary.difficulties);
  renderTags(summary.tags);
  renderIssueList(els.missingFieldsList, summary.missingFields, "No missing required fields.");
  renderIssueList(els.duplicateIdsList, summary.duplicateIds, "No duplicate IDs found.");
}

function renderDeckManager() {
  renderDeckIndexTable();
  renderDeckDetailsForm();
  renderDeckStatistics();
  renderDeckHealth();
  renderDeckCoverageWarnings();
  renderDeckIndexSync();
  renderDeckVersionNotes();
}

function renderDeckIndexTable() {
  if (!els.deckIndexTableBody) return;
  els.deckIndexTableBody.replaceChildren();
  if (!state.decks.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="8">No decks found.</td>`;
    els.deckIndexTableBody.append(row);
    return;
  }

  state.decks.forEach((deck) => {
    const isSelected = deck.deckId === state.currentDeck?.id;
    const row = document.createElement("tr");
    row.classList.toggle("is-selected", isSelected);
    row.innerHTML = `
      <td>${escapeHtml(deck.title || "")}</td>
      <td><code>${escapeHtml(deck.deckId || "")}</code></td>
      <td>${escapeHtml(deck.subject || "")}</td>
      <td>${escapeHtml(deck.version || "")}</td>
      <td>${deck.cardCount ?? ""}</td>
      <td>${escapeHtml((deck.tags || []).join(", "))}</td>
      <td><code>${escapeHtml(deck.path || "")}</code></td>
      <td>
        <div class="table-actions">
          <button type="button" class="secondary-button small-button" data-deck-action="view" data-deck-id="${escapeHtml(deck.deckId)}">View</button>
          <button type="button" class="secondary-button small-button" data-deck-action="edit" data-deck-id="${escapeHtml(deck.deckId)}">Edit</button>
          <button type="button" class="secondary-button small-button" data-deck-action="export" data-deck-id="${escapeHtml(deck.deckId)}">Export</button>
          <button type="button" class="danger-button small-button" data-deck-action="delete" data-deck-id="${escapeHtml(deck.deckId)}">Delete</button>
        </div>
      </td>
    `;
    row.querySelectorAll("[data-deck-action]").forEach((button) => {
      button.addEventListener("click", () => handleDeckTableAction(button.dataset.deckAction, button.dataset.deckId));
    });
    els.deckIndexTableBody.append(row);
  });
}

async function handleDeckTableAction(action, deckId) {
  if (deckId && deckId !== state.currentDeck?.id) {
    await loadDeckDetails(deckId);
  }
  if (action === "edit") els.deckManagerTitle.focus();
  if (action === "export") exportSelectedDeck();
  if (action === "delete") deleteSelectedDeck();
}

function renderDeckDetailsForm() {
  const deck = state.currentDeck;
  const entry = state.currentDeckDetails?.indexEntry || {};
  els.deckManagerId.value = deck?.id || "";
  els.deckManagerTitle.value = deck?.title || "";
  els.deckManagerVersion.value = deck?.version || "";
  els.deckManagerSubject.value = entry.subject || "";
  els.deckManagerSource.value = deck?.source || "";
  els.deckManagerTags.value = (entry.tags || []).join(", ");
  els.deckManagerDescription.value = deck?.description || "";
}

function renderImportDeckDetails() {
  const deck = state.currentDeck;
  const entry = state.currentDeckDetails?.indexEntry || {};
  els.importDeckTitle.textContent = deck?.title || "Select a deck";
  els.importDeckId.textContent = deck?.id || "-";
  els.importDeckSubject.textContent = entry.subject || "-";
  els.importDeckVersion.textContent = deck?.version || "-";
  els.importDeckCardCount.textContent = String(state.currentDeckDetails?.cards?.length ?? "-");
  els.importDeckDescription.textContent = deck?.description || entry.description || "-";
}

function renderDeckStatistics() {
  const summary = state.currentDeckDetails?.summary;
  if (!summary) return;
  els.deckStatsTotal.textContent = summary.totalCards;
  els.deckStatsBlueprintTotal.textContent = Object.keys(summary.blueprints || {}).length;
  els.deckStatsDomainTotal.textContent = Object.keys(summary.domains || {}).length;
  els.deckStatsTopicTotal.textContent = Object.keys(summary.topics || {}).length;

  const dimension = els.deckStatsDimension.value || "blueprints";
  const query = els.deckStatsSearch.value.trim().toLowerCase();
  const entries = statEntriesFor(summary, dimension)
    .filter(([label]) => String(label).toLowerCase().includes(query))
    .sort(([labelA, countA], [labelB, countB]) => countB - countA || String(labelA).localeCompare(String(labelB)));
  const visibleEntries = entries.slice(0, 60);

  els.deckStatsResultCount.textContent = `${entries.length} ${statDimensionLabel(dimension)} ${entries.length === 1 ? "result" : "results"}${entries.length > visibleEntries.length ? " - showing first 60" : ""}.`;
  renderStatEntries(els.deckStatsList, visibleEntries, "No matching statistics.");
}

function statEntriesFor(summary, dimension) {
  if (dimension === "tags") return (summary.tags || []).map(({ tag, count }) => [tag, count]);
  return Object.entries(summary[dimension] || {});
}

function statDimensionLabel(dimension) {
  return {
    blueprints: "blueprint",
    domains: "domain",
    topics: "topic",
    subtopics: "subtopic",
    tags: "tag",
    cardTypes: "type",
    difficulties: "difficulty"
  }[dimension] || "statistic";
}

function renderStatEntries(target, entries, emptyMessage) {
  target.replaceChildren();
  if (!entries.length) {
    target.append(emptyText(emptyMessage));
    return;
  }

  entries.forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `<span>${escapeHtml(label)}</span><strong>${count}</strong>`;
    target.append(row);
  });
}

function renderDeckHealth() {
  const health = state.currentDeckDetails?.summary?.health;
  if (!health) return;
  els.deckHealthStatus.textContent = health.valid ? "Valid" : "Invalid";
  els.deckHealthStatus.classList.toggle("is-ready", health.valid);
  els.deckHealthList.replaceChildren();
  const groups = [
    ["Missing required fields", health.missingRequiredFields],
    ["Duplicate card IDs", health.duplicateCardIds],
    ["Invalid render blocks", health.invalidRenderBlocks],
    ["Empty front/back blocks", health.emptyFrontBackBlocks],
    ["Unknown difficulty values", health.unknownDifficultyValues],
    ["Unknown card type values", health.unknownCardTypeValues],
    ["Missing tags", health.missingTags]
  ];
  groups.forEach(([label, items]) => {
    const item = document.createElement("p");
    item.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${items?.length ? escapeHtml(items.slice(0, 6).join("; ")) : "None"}`;
    els.deckHealthList.append(item);
  });
}

function renderDeckCoverageWarnings() {
  renderIssueList(els.deckCoverageWarnings, state.currentDeckDetails?.summary?.coverageWarnings, "No coverage warnings.");
}

function renderDeckIndexSync() {
  if (!state.deckIndexSync) return;
  els.deckIndexSyncStatus.textContent = state.deckIndexSync.valid ? "Synced" : "Needs review";
  els.deckIndexSyncStatus.classList.toggle("is-ready", state.deckIndexSync.valid);
  renderIssueList(els.deckIndexSyncList, state.deckIndexSync.issues, "Every indexed deck path loads and IDs match.");
}

function renderDeckVersionNotes() {
  const history = state.currentDeckDetails?.summary?.versionHistory || [];
  els.deckVersionNotes.replaceChildren();
  if (!history.length) {
    els.deckVersionNotes.append(emptyText("No version history recorded. Optional history[] notes are supported when present."));
    return;
  }
  history.forEach((entry) => {
    const item = document.createElement("p");
    item.innerHTML = `<strong>${escapeHtml(entry.version || "Version")}</strong> ${escapeHtml(entry.date || "")}<br>${escapeHtml(entry.notes || "")}`;
    els.deckVersionNotes.append(item);
  });
}

function renderStatList(target, stats) {
  target.replaceChildren();
  const entries = Object.entries(stats || {});
  if (!entries.length) {
    target.append(emptyText("No data yet."));
    return;
  }

  entries
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([label, count]) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `<span>${escapeHtml(label)}</span><strong>${count}</strong>`;
      target.append(row);
    });
}

function renderTags(tags) {
  renderTagsInto(els.tagsList, tags);
}

function renderTagsInto(target, tags) {
  target.replaceChildren();
  if (!tags?.length) {
    target.append(emptyText("No tags found."));
    return;
  }

  tags.slice(0, 18).forEach(({ tag, count }) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = `${tag} ${count}`;
    target.append(pill);
  });
}

function renderIssueList(target, issues, emptyMessage) {
  target.replaceChildren();
  if (!issues?.length) {
    target.append(emptyText(emptyMessage));
    return;
  }

  issues.slice(0, 8).forEach((issue) => {
    const item = document.createElement("p");
    item.textContent = issue;
    target.append(item);
  });
}

function renderCardList() {
  const query = els.cardSearchInput.value.trim().toLowerCase();
  const cards = query ? state.cards.filter((card) => cardMatches(card, query)) : state.cards;
  els.cardList.replaceChildren();

  if (!cards.length) {
    els.cardList.append(emptyText("No cards match this filter."));
    return;
  }

  cards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-list-item";
    button.classList.toggle("is-active", card.id === state.selectedCardId);
    button.innerHTML = `
      <strong>${escapeHtml(card.id)}</strong>
      <span>${escapeHtml([card.topic, card.subtopic].filter(Boolean).join(" / "))}</span>
    `;
    button.addEventListener("click", () => {
      if (state.editMode && hasEditorChanges()) {
        renderEditorStatus("Save or cancel the current edit before selecting another card.", "error");
        return;
      }
      state.selectedCardId = card.id;
      state.editMode = false;
      renderCardList();
      renderSelectedCard();
    });
    els.cardList.append(button);
  });
}

function renderSelectedCard() {
  const card = state.cards.find((candidate) => candidate.id === state.selectedCardId);
  if (!card) {
    els.editorPreview.textContent = "Select a card to preview it.";
    return;
  }

  els.editorCardId.value = card.id || "";
  els.editorCardType.value = card.type || "";
  els.editorCardDifficulty.value = card.difficulty || "";
  els.editorCardTopic.value = card.topic || "";
  els.editorCardSubtopic.value = card.subtopic || "";
  els.editorFront.value = blocksToText(card.front);
  els.editorBack.value = blocksToText(card.back);
  renderReadonlyPreview(card);
  renderEditorMode();
  renderEditorStatus("", "neutral");
}

function renderPreviewBlock(title, blocks) {
  const section = document.createElement("section");
  section.className = "preview-section";
  const heading = document.createElement("h4");
  heading.textContent = title;
  section.append(heading);
  const body = document.createElement("div");
  body.className = "block-stack";
  body.innerHTML = blocksToHtml(blocks);
  section.append(body);
  return section;
}

function cardMatches(card, query) {
  return [
    card.id,
    card.domain,
    card.topic,
    card.subtopic,
    card.type,
    card.difficulty,
    ...(card.tags || []),
    blocksToText(card.front),
    blocksToText(card.back)
  ].some((value) => String(value || "").toLowerCase().includes(query));
}

function enterEditMode() {
  if (!state.selectedCardId) return;
  state.editMode = true;
  renderEditorMode();
  renderDraftPreview();
  renderEditorStatus("Editing selected card.", "neutral");
}

function cancelEdit() {
  state.editMode = false;
  renderSelectedCard();
}

async function saveSelectedCard() {
  const card = selectedCard();
  if (!card) return;

  els.saveCardButton.disabled = true;
  renderEditorStatus("Saving changes...", "neutral");

  try {
    const response = await fetch("/api/card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readCardEditorPayload(card))
    });
    const data = await response.json();
    if (!response.ok) {
      const details = data.details?.length ? ` ${data.details.join(" ")}` : "";
      throw new Error(`${data.error || "Save failed."}${details}`);
    }

    const index = state.cards.findIndex((candidate) => candidate.id === data.card.id);
    if (index !== -1) state.cards[index] = data.card;
    state.currentDeckDetails.summary = data.summary;
    state.editMode = false;
    renderDashboard();
    renderCardList();
    renderSelectedCard();
    renderEditorStatus("Changes saved.", "success");
  } catch (error) {
    renderEditorStatus(error.message, "error");
  } finally {
    els.saveCardButton.disabled = false;
  }
}

function readCardEditorPayload(card) {
  return {
    deckId: state.currentDeck?.id,
    cardId: card.id,
    type: els.editorCardType.value,
    difficulty: els.editorCardDifficulty.value,
    topic: els.editorCardTopic.value,
    subtopic: els.editorCardSubtopic.value,
    front: facePayload(card.front, els.editorFront.value),
    back: facePayload(card.back, els.editorBack.value)
  };
}

function facePayload(existingBlocks, editedText) {
  if (editedText === blocksToText(existingBlocks)) return existingBlocks;
  const blocks = Array.isArray(existingBlocks) && existingBlocks.length ? existingBlocks : [{ type: "text", text: "" }];
  if (blocks.length === 1 && Object.prototype.hasOwnProperty.call(blocks[0], "text")) {
    return [{ ...blocks[0], text: editedText }];
  }
  return [{ type: "text", text: editedText }];
}

function renderEditorMode() {
  const editable = state.editMode;
  [els.editorCardType, els.editorCardDifficulty, els.editorCardTopic, els.editorCardSubtopic, els.editorFront, els.editorBack].forEach((input) => {
    input.disabled = !editable;
  });
  els.editCardButton.hidden = editable;
  els.cancelEditButton.hidden = !editable;
  els.saveCardButton.hidden = !editable;
}

function renderDraftPreview() {
  const card = selectedCard();
  if (!card) return;
  const draftCard = {
    ...card,
    type: els.editorCardType.value,
    difficulty: els.editorCardDifficulty.value,
    topic: els.editorCardTopic.value,
    subtopic: els.editorCardSubtopic.value,
    front: facePayload(card.front, els.editorFront.value),
    back: facePayload(card.back, els.editorBack.value)
  };
  renderReadonlyPreview(draftCard);
}

function renderReadonlyPreview(card) {
  els.editorPreview.replaceChildren(renderPreviewBlock("Front", card.front), renderPreviewBlock("Back", card.back));
}

function selectedCard() {
  return state.cards.find((candidate) => candidate.id === state.selectedCardId);
}

function hasEditorChanges() {
  const card = selectedCard();
  if (!card) return false;
  return els.editorCardType.value !== (card.type || "")
    || els.editorCardDifficulty.value !== (card.difficulty || "")
    || els.editorCardTopic.value !== (card.topic || "")
    || els.editorCardSubtopic.value !== (card.subtopic || "")
    || els.editorFront.value !== blocksToText(card.front)
    || els.editorBack.value !== blocksToText(card.back);
}

function renderEditorStatus(message, type) {
  els.editorStatus.textContent = message;
  els.editorStatus.classList.toggle("is-error", type === "error");
  els.editorStatus.classList.toggle("is-success", type === "success");
}

async function saveDeckDetails(event) {
  event.preventDefault();
  if (!state.currentDeck) return;
  const nextId = slugify(els.deckManagerId.value);
  if (nextId !== state.currentDeck.id && !confirm("Changing deck.id can disconnect existing local progress tied to the old deck ID. Continue?")) {
    els.deckManagerId.value = state.currentDeck.id;
    return;
  }

  els.saveDeckDetailsButton.disabled = true;
  renderDeckDetailsStatus("Saving deck details...", "neutral");
  try {
    const response = await fetch("/api/deck", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalDeckId: state.currentDeck.id,
        deckId: nextId,
        title: els.deckManagerTitle.value,
        version: els.deckManagerVersion.value,
        subject: els.deckManagerSubject.value,
        source: els.deckManagerSource.value,
        tags: els.deckManagerTags.value,
        description: els.deckManagerDescription.value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save deck details.");
    renderDeckDetailsStatus("Deck details saved.", "success");
    await loadDecks();
    await loadDeckDetails(data.deck.id);
  } catch (error) {
    renderDeckDetailsStatus(error.message, "error");
  } finally {
    els.saveDeckDetailsButton.disabled = false;
  }
}

function renderDeckDetailsStatus(message, type) {
  els.deckDetailsStatus.textContent = message;
  els.deckDetailsStatus.classList.toggle("is-error", type === "error");
  els.deckDetailsStatus.classList.toggle("is-success", type === "success");
}

function renderDeckActionStatus(message, type) {
  els.deckActionStatus.textContent = message;
  els.deckActionStatus.classList.toggle("is-error", type === "error");
  els.deckActionStatus.classList.toggle("is-success", type === "success");
}

function showDeckIndexJson() {
  els.deckIndexJsonView.textContent = state.deckIndexFormatted || "{}";
  els.deckIndexDialog.showModal();
}

function openDeckModal(mode) {
  state.deckModalMode = mode;
  els.deckModalTitle.textContent = mode === "clone" ? "Clone Deck" : "Add Deck";
  els.submitDeckModalButton.textContent = mode === "clone" ? "Clone Deck" : "Create Deck";
  const source = mode === "clone" ? state.currentDeck : null;
  const entry = mode === "clone" ? state.currentDeckDetails?.indexEntry : null;
  els.modalDeckTitle.value = source ? `${source.title} Copy` : "";
  els.modalDeckId.value = source ? `${source.id}-copy` : "";
  els.modalDeckVersion.value = source?.version || "0.1";
  els.modalDeckSubject.value = entry?.subject || "";
  els.modalDeckSource.value = source?.source || "Admin deck manager";
  els.modalDeckTags.value = (entry?.tags || []).join(", ");
  els.modalDeckDescription.value = source?.description || "";
  delete els.modalDeckId.dataset.touched;
  els.deckModal.showModal();
}

async function submitDeckModal() {
  const isClone = state.deckModalMode === "clone";
  const endpoint = isClone ? "/api/deck/clone" : "/api/deck";
  const body = {
    sourceDeckId: state.currentDeck?.id,
    title: els.modalDeckTitle.value,
    deckId: els.modalDeckId.value,
    version: els.modalDeckVersion.value,
    subject: els.modalDeckSubject.value,
    source: els.modalDeckSource.value,
    tags: els.modalDeckTags.value,
    description: els.modalDeckDescription.value
  };

  els.submitDeckModalButton.disabled = true;
  renderDeckActionStatus(isClone ? "Cloning deck..." : "Creating deck...", "neutral");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Deck action failed.");
    els.deckModal.close();
    renderDeckActionStatus(isClone ? "Deck cloned." : "Deck created.", "success");
    await loadDecks();
    await loadDeckDetails(data.deck.id);
  } catch (error) {
    renderDeckActionStatus(error.message, "error");
  } finally {
    els.submitDeckModalButton.disabled = false;
  }
}

async function deleteSelectedDeck() {
  if (!state.currentDeck) return;
  const confirmed = confirm("Deleting this deck removes it from the deck index. Existing local progress may remain unless cleared separately.");
  if (!confirmed) return;
  renderDeckActionStatus("Removing deck from index...", "neutral");
  try {
    const response = await fetch("/api/deck", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deckId: state.currentDeck.id })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not delete deck.");
    renderDeckActionStatus(`${data.deckId} removed from deck index.`, "success");
    state.currentDeck = null;
    state.currentDeckDetails = null;
    state.cards = [];
    await loadDecks();
  } catch (error) {
    renderDeckActionStatus(error.message, "error");
  }
}

function exportSelectedDeck() {
  if (!state.currentDeckDetails) return;
  const deckData = {
    deck: state.currentDeckDetails.deck,
    cards: state.currentDeckDetails.cards
  };
  downloadJson(deckData, `${state.currentDeckDetails.deck.id}.json`);
  renderDeckActionStatus(`Exported ${state.currentDeckDetails.deck.id}.json.`, "success");
}

function downloadJson(data, filename) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importFullDeck() {
  els.importDeckButton.disabled = true;
  renderDeckActionStatus("Importing deck JSON...", "neutral");
  try {
    const response = await fetch("/api/deck/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckJson: els.deckImportJson.value,
        replaceExisting: els.replaceDeckImport.checked
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const details = data.details?.length ? ` ${data.details.join(" ")}` : "";
      throw new Error(`${data.error || "Import failed."}${details}`);
    }
    els.deckImportJson.value = "";
    renderDeckActionStatus(data.replaced ? "Deck imported and replaced existing deck." : "Deck imported.", "success");
    await loadDecks();
    await loadDeckDetails(data.deck.id);
  } catch (error) {
    renderDeckActionStatus(error.message, "error");
  } finally {
    els.importDeckButton.disabled = false;
  }
}

async function importCards() {
  els.importButton.disabled = true;
  state.lastSkippedCards = [];
  els.exportSkippedCardsButton.hidden = true;
  renderSummary("Importing cards...", "neutral");

  try {
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readForm())
    });
    const data = await response.json();
    if (!response.ok) {
      const details = data.details?.length ? `<ul>${data.details.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
      throw new Error(`${data.error || "Import failed."}${details}`);
    }

    state.lastSkippedCards = data.skippedCards || [];
    renderSummary([
      `<strong>${escapeHtml(data.deck.title)}</strong> updated.`,
      `${data.added} added, ${data.replaced.length} replaced, ${data.skipped.length} skipped.`,
      `${data.totalCards} cards now in deck.`,
      renderSkippedImportDetails(state.lastSkippedCards)
    ].join("<br>"), "success");
    els.exportSkippedCardsButton.hidden = state.lastSkippedCards.length === 0;
    if (els.clearJsonAfterImport.checked) {
      els.cardsJson.value = "";
    }
    await loadDecks();
    await loadDeckDetails(data.deck.id);
  } catch (error) {
    renderSummary(error.message, "error");
  } finally {
    els.importButton.disabled = false;
  }
}

function renderSkippedImportDetails(skippedCards) {
  if (!skippedCards?.length) return "";
  return [
    `<span class="summary-note">Skipped because matching card IDs already exist and replacement is off.</span>`,
    `<ul>${skippedCards.slice(0, 10).map((item) => `<li><code>${escapeHtml(item.id)}</code>: ${escapeHtml(item.reason)}</li>`).join("")}</ul>`,
    skippedCards.length > 10 ? `<span class="summary-note">${skippedCards.length - 10} more skipped cards are available in the export.</span>` : ""
  ].filter(Boolean).join("");
}

function exportSkippedCards() {
  if (!state.lastSkippedCards.length) return;
  downloadJson({
    reason: "Cards skipped during import because their IDs already exist in the selected deck and replacement was off.",
    skipped: state.lastSkippedCards.map(({ id, reason, card }) => ({ id, reason, card }))
  }, `${state.currentDeck?.id || "deck"}-skipped-cards.json`);
}

async function validatePastedCards() {
  els.validateCardsButton.disabled = true;
  renderValidatorStatus("Validating cards...", "neutral");

  try {
    const response = await fetch("/api/cards/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckId: els.deckSelect.value,
        replaceDuplicates: els.validatorReplaceDuplicates.checked,
        cardsJson: els.validatorCardsJson.value
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const details = data.details?.length ? ` ${data.details.join(" ")}` : "";
      throw new Error(`${data.error || "Validation failed."}${details}`);
    }
    renderValidatorResults(data);
  } catch (error) {
    renderValidatorError(error.message);
  } finally {
    els.validateCardsButton.disabled = false;
  }
}

function renderValidatorResults(data) {
  els.validatorTotalCards.textContent = String(data.totalCards || 0);
  els.validatorValidCards.textContent = String(data.validCards || 0);
  els.validatorInvalidCards.textContent = String(data.invalidCards?.length || 0);
  els.validatorResults.replaceChildren();

  const issues = [
    ...(data.invalidCards || []).map((item) => ({
      title: `${item.id} did not validate`,
      details: item.errors
    })),
    ...(data.duplicateCards || []).map((item) => ({
      title: `${item.id} would be skipped on import`,
      details: [item.skipReason]
    }))
  ];

  if (!issues.length) {
    els.validatorResults.append(makeIssueParagraph("All pasted cards validate. No import skips detected for the selected options."));
    return;
  }

  issues.forEach((issue) => {
    const block = document.createElement("div");
    block.className = "validation-result-card";
    const title = document.createElement("strong");
    title.textContent = issue.title;
    const list = document.createElement("ul");
    issue.details.forEach((detail) => {
      const item = document.createElement("li");
      item.textContent = detail;
      list.append(item);
    });
    block.append(title, list);
    els.validatorResults.append(block);
  });
}

function renderValidatorStatus(message) {
  els.validatorTotalCards.textContent = "0";
  els.validatorValidCards.textContent = "0";
  els.validatorInvalidCards.textContent = "0";
  els.validatorResults.replaceChildren(makeIssueParagraph(message));
}

function renderValidatorError(message) {
  els.validatorTotalCards.textContent = "0";
  els.validatorValidCards.textContent = "0";
  els.validatorInvalidCards.textContent = "0";
  els.validatorResults.replaceChildren(makeIssueParagraph(message));
}

function makeIssueParagraph(message) {
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  return paragraph;
}

function readForm() {
  return {
    deckId: els.deckSelect.value,
    replaceDuplicates: els.replaceDuplicates.checked,
    cardsJson: els.cardsJson.value
  };
}

function renderSummary(message, type) {
  els.importSummary.classList.toggle("is-error", type === "error");
  els.importSummary.classList.toggle("is-success", type === "success");
  els.importSummary.innerHTML = type === "error" ? message : `<p>${message}</p>`;
}

function renderEmptyDeckState(message) {
  els.currentDeckLine.textContent = `Current Deck: ${message}`;
  els.navDeckName.textContent = "No deck loaded";
  els.dashboardDeckName.textContent = "No deck loaded";
  els.importDeckTitle.textContent = message;
  els.importDeckId.textContent = "-";
  els.importDeckSubject.textContent = "-";
  els.importDeckVersion.textContent = "-";
  els.importDeckCardCount.textContent = "-";
  els.importDeckDescription.textContent = "-";
}

function blocksToText(blocks) {
  return (blocks || []).map((block) => {
    if (block.text) return block.text;
    if (Array.isArray(block.items)) return block.items.join("\n");
    if (Array.isArray(block.rows)) return block.rows.map((row) => row.join(" | ")).join("\n");
    return JSON.stringify(block, null, 2);
  }).join("\n\n");
}

function blocksToHtml(blocks) {
  return (blocks || []).map((block) => {
    if (block.type === "heading") return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === "code" || block.type === "cli-output") return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    if (block.type === "ordered-list") return `<ol>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`;
    if (block.type === "unordered-list") return `<ul>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    if (block.type === "table") return renderTable(block);
    return `<p>${escapeHtml(block.text || "")}</p>`;
  }).join("");
}

function renderTable(block) {
  const headers = (block.headers || []).map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const rows = (block.rows || []).map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function emptyText(message) {
  const element = document.createElement("p");
  element.className = "empty-admin-text";
  element.textContent = message;
  return element;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
