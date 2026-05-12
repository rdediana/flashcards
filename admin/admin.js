const state = {
  mode: "existing",
  activeTool: "dashboard",
  decks: [],
  currentDeck: null,
  currentDeckDetails: null,
  cards: [],
  selectedCardId: null,
  editMode: false
};

const els = {
  currentDeckLine: document.querySelector("#currentDeckLine"),
  navDeckName: document.querySelector("#navDeckName"),
  navButtons: Array.from(document.querySelectorAll("[data-tool]")),
  mobileToolSelect: document.querySelector("#mobileToolSelect"),
  toolViews: Array.from(document.querySelectorAll("[data-tool-view]")),
  modeButtons: Array.from(document.querySelectorAll("[data-import-mode]")),
  existingDeckFields: document.querySelector("#existingDeckFields"),
  newDeckFields: document.querySelector("#newDeckFields"),
  deckSelect: document.querySelector("#deckSelect"),
  replaceDuplicates: document.querySelector("#replaceDuplicates"),
  newDeckTitle: document.querySelector("#newDeckTitle"),
  newDeckId: document.querySelector("#newDeckId"),
  newDeckSubject: document.querySelector("#newDeckSubject"),
  newDeckSource: document.querySelector("#newDeckSource"),
  newDeckTags: document.querySelector("#newDeckTags"),
  newDeckDescription: document.querySelector("#newDeckDescription"),
  cardsJson: document.querySelector("#cardsJson"),
  importButton: document.querySelector("#importButton"),
  importSummary: document.querySelector("#importSummary"),
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
  editorStatus: document.querySelector("#editorStatus")
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

  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => setImportMode(button.dataset.importMode));
  });

  els.deckSelect.addEventListener("change", async () => {
    await loadDeckDetails(els.deckSelect.value);
  });

  els.newDeckTitle.addEventListener("input", () => {
    if (!els.newDeckId.dataset.touched) {
      els.newDeckId.value = slugify(els.newDeckTitle.value);
    }
  });

  els.newDeckId.addEventListener("input", () => {
    els.newDeckId.dataset.touched = "true";
  });

  els.importButton.addEventListener("click", importCards);
  els.cardSearchInput.addEventListener("input", renderCardList);
  els.editCardButton.addEventListener("click", enterEditMode);
  els.cancelEditButton.addEventListener("click", cancelEdit);
  els.saveCardButton.addEventListener("click", saveSelectedCard);
  [els.editorCardType, els.editorCardDifficulty, els.editorCardTopic, els.editorCardSubtopic, els.editorFront, els.editorBack].forEach((input) => {
    input.addEventListener("input", renderDraftPreview);
  });
}

async function loadDecks() {
  try {
    const response = await fetch("/api/decks");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load decks.");
    state.decks = data.decks || [];
    renderDeckOptions();
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

function setImportMode(mode) {
  state.mode = mode;
  els.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.importMode === mode);
  });
  els.existingDeckFields.hidden = mode !== "existing";
  els.newDeckFields.hidden = mode !== "new";
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
  els.tagsList.replaceChildren();
  if (!tags?.length) {
    els.tagsList.append(emptyText("No tags found."));
    return;
  }

  tags.slice(0, 18).forEach(({ tag, count }) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = `${tag} ${count}`;
    els.tagsList.append(pill);
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

async function importCards() {
  els.importButton.disabled = true;
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

    renderSummary([
      `<strong>${escapeHtml(data.deck.title)}</strong> updated.`,
      `${data.added} added, ${data.replaced.length} replaced, ${data.skipped.length} skipped.`,
      `${data.totalCards} cards now in deck.`
    ].join("<br>"), "success");
    await loadDecks();
    await loadDeckDetails(data.deck.id);
  } catch (error) {
    renderSummary(error.message, "error");
  } finally {
    els.importButton.disabled = false;
  }
}

function readForm() {
  return {
    mode: state.mode,
    deckId: els.deckSelect.value,
    replaceDuplicates: els.replaceDuplicates.checked,
    newDeckTitle: els.newDeckTitle.value,
    newDeckId: els.newDeckId.value,
    newDeckSubject: els.newDeckSubject.value,
    newDeckSource: els.newDeckSource.value,
    newDeckTags: els.newDeckTags.value,
    newDeckDescription: els.newDeckDescription.value,
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
