const state = {
  mode: "existing",
  decks: []
};

const els = {
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
  importSummary: document.querySelector("#importSummary")
};

init();

async function init() {
  bindEvents();
  await loadDecks();
}

function bindEvents() {
  els.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.importMode;
      els.modeButtons.forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === button);
      });
      els.existingDeckFields.hidden = state.mode !== "existing";
      els.newDeckFields.hidden = state.mode !== "new";
    });
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
}

async function loadDecks() {
  try {
    const response = await fetch("/api/decks");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load decks.");
    state.decks = data.decks || [];
    renderDeckOptions();
  } catch (error) {
    renderSummary(error.message, "error");
  }
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
