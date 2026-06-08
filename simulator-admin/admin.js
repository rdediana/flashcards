const state = {
  activeTool: "dashboard",
  packages: [],
  packageIndex: null,
  packageIndexFormatted: "",
  packageIndexSync: null,
  currentPackage: null,
  currentPackageDetails: null,
  items: [],
  visibleItemIds: [],
  selectedItemId: null,
  editMode: false,
  packageFormMode: "edit",
  packageIdTouched: false,
  packageModalMode: "create",
  lastSkippedItems: []
};

const els = {
  currentPackageLine: document.querySelector("#currentPackageLine"),
  navPackageName: document.querySelector("#navPackageName"),
  navButtons: Array.from(document.querySelectorAll("[data-tool]")),
  mobileToolSelect: document.querySelector("#mobileToolSelect"),
  toolViews: Array.from(document.querySelectorAll("[data-tool-view]")),
  existingPackageFields: document.querySelector("#existingPackageFields"),
  packageSelect: document.querySelector("#packageSelect"),
  replaceDuplicates: document.querySelector("#replaceDuplicates"),
  clearJsonAfterImport: document.querySelector("#clearJsonAfterImport"),
  clearImportJsonButton: document.querySelector("#clearImportJsonButton"),
  itemsJson: document.querySelector("#itemsJson"),
  importButton: document.querySelector("#importButton"),
  importSummary: document.querySelector("#importSummary"),
  exportSkippedItemsButton: document.querySelector("#exportSkippedItemsButton"),
  importPackageTitle: document.querySelector("#importPackageTitle"),
  importPackageId: document.querySelector("#importPackageId"),
  importPackageSubject: document.querySelector("#importPackageSubject"),
  importPackageVersion: document.querySelector("#importPackageVersion"),
  importPackageItemCount: document.querySelector("#importPackageItemCount"),
  importPackageDescription: document.querySelector("#importPackageDescription"),
  packageIndexTableBody: document.querySelector("#packageIndexTableBody"),
  packageIndexSyncStatus: document.querySelector("#packageIndexSyncStatus"),
  packageIndexSyncList: document.querySelector("#packageIndexSyncList"),
  showPackageIndexButton: document.querySelector("#showPackageIndexButton"),
  packageIndexDialog: document.querySelector("#packageIndexDialog"),
  packageIndexJsonView: document.querySelector("#packageIndexJsonView"),
  createPackageButton: document.querySelector("#createPackageButton"),
  packageDetailsForm: document.querySelector("#packageDetailsForm"),
  packageFormHeading: document.querySelector("#packageFormHeading"),
  packageManagerId: document.querySelector("#packageManagerId"),
  packageManagerTitle: document.querySelector("#packageManagerTitle"),
  packageManagerVersion: document.querySelector("#packageManagerVersion"),
  packageManagerSubject: document.querySelector("#packageManagerSubject"),
  packageManagerSource: document.querySelector("#packageManagerSource"),
  packageManagerTags: document.querySelector("#packageManagerTags"),
  packageManagerDescription: document.querySelector("#packageManagerDescription"),
  savePackageDetailsButton: document.querySelector("#savePackageDetailsButton"),
  resetPackageDetailsButton: document.querySelector("#resetPackageDetailsButton"),
  packageDetailsStatus: document.querySelector("#packageDetailsStatus"),
  packageStatsTotal: document.querySelector("#packageStatsTotal"),
  packageStatsBlueprintTotal: document.querySelector("#packageStatsBlueprintTotal"),
  packageStatsDomainTotal: document.querySelector("#packageStatsDomainTotal"),
  packageStatsTopicTotal: document.querySelector("#packageStatsTopicTotal"),
  packageStatsDimension: document.querySelector("#packageStatsDimension"),
  packageStatsSearch: document.querySelector("#packageStatsSearch"),
  packageStatsResultCount: document.querySelector("#packageStatsResultCount"),
  packageStatsList: document.querySelector("#packageStatsList"),
  validatePackageButton: document.querySelector("#validatePackageButton"),
  exportPackageButton: document.querySelector("#exportPackageButton"),
  clonePackageButton: document.querySelector("#clonePackageButton"),
  deletePackageButton: document.querySelector("#deletePackageButton"),
  packageImportJson: document.querySelector("#packageImportJson"),
  replacePackageImport: document.querySelector("#replacePackageImport"),
  importPackageButton: document.querySelector("#importPackageButton"),
  packageActionStatus: document.querySelector("#packageActionStatus"),
  packageHealthStatus: document.querySelector("#packageHealthStatus"),
  packageHealthList: document.querySelector("#packageHealthList"),
  packageCoverageWarnings: document.querySelector("#packageCoverageWarnings"),
  packageVersionNotes: document.querySelector("#packageVersionNotes"),
  packageModal: document.querySelector("#packageModal"),
  packageModalTitle: document.querySelector("#packageModalTitle"),
  modalPackageTitle: document.querySelector("#modalPackageTitle"),
  modalPackageId: document.querySelector("#modalPackageId"),
  modalPackageVersion: document.querySelector("#modalPackageVersion"),
  modalPackageSubject: document.querySelector("#modalPackageSubject"),
  modalPackageSource: document.querySelector("#modalPackageSource"),
  modalPackageTags: document.querySelector("#modalPackageTags"),
  modalPackageDescription: document.querySelector("#modalPackageDescription"),
  cancelPackageModalButton: document.querySelector("#cancelPackageModalButton"),
  submitPackageModalButton: document.querySelector("#submitPackageModalButton"),
  dashboardPackageName: document.querySelector("#dashboardPackageName"),
  totalItemsMetric: document.querySelector("#totalItemsMetric"),
  readinessMetric: document.querySelector("#readinessMetric"),
  itemTypesList: document.querySelector("#itemTypesList"),
  difficultyList: document.querySelector("#difficultyList"),
  tagsList: document.querySelector("#tagsList"),
  missingFieldsList: document.querySelector("#missingFieldsList"),
  duplicateIdsList: document.querySelector("#duplicateIdsList"),
  readinessDetail: document.querySelector("#readinessDetail"),
  itemSearchInput: document.querySelector("#itemSearchInput"),
  itemList: document.querySelector("#itemList"),
  selectedItemMetadata: document.querySelector("#selectedItemMetadata"),
  selectedItemPath: document.querySelector("#selectedItemPath"),
  editorItemId: document.querySelector("#editorItemId"),
  editorItemBlueprint: document.querySelector("#editorItemBlueprint"),
  editorItemDomain: document.querySelector("#editorItemDomain"),
  editorItemType: document.querySelector("#editorItemType"),
  editorItemDifficulty: document.querySelector("#editorItemDifficulty"),
  editorItemTopic: document.querySelector("#editorItemTopic"),
  editorItemSubtopic: document.querySelector("#editorItemSubtopic"),
  editorItemTags: document.querySelector("#editorItemTags"),
  editorFront: document.querySelector("#editorFront"),
  editorBack: document.querySelector("#editorBack"),
  editorPreview: document.querySelector("#editorPreview"),
  copySelectedItemJsonButton: document.querySelector("#copySelectedItemJsonButton"),
  exportSelectedItemJsonButton: document.querySelector("#exportSelectedItemJsonButton"),
  bulkTagsInput: document.querySelector("#bulkTagsInput"),
  addTagsToResultsButton: document.querySelector("#addTagsToResultsButton"),
  removeTagsFromResultsButton: document.querySelector("#removeTagsFromResultsButton"),
  replaceTagsForResultsButton: document.querySelector("#replaceTagsForResultsButton"),
  editItemButton: document.querySelector("#editItemButton"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  saveItemButton: document.querySelector("#saveItemButton"),
  editorStatus: document.querySelector("#editorStatus"),
  validateItemsButton: document.querySelector("#validateItemsButton"),
  validatorImportButton: document.querySelector("#validatorImportButton"),
  validatorReplaceDuplicates: document.querySelector("#validatorReplaceDuplicates"),
  validatorClearJsonAfterImport: document.querySelector("#validatorClearJsonAfterImport"),
  clearValidatorJsonButton: document.querySelector("#clearValidatorJsonButton"),
  validatorItemsJson: document.querySelector("#validatorItemsJson"),
  validatorTotalItems: document.querySelector("#validatorTotalItems"),
  validatorValidItems: document.querySelector("#validatorValidItems"),
  validatorInvalidItems: document.querySelector("#validatorInvalidItems"),
  validatorResults: document.querySelector("#validatorResults")
};

init();

async function init() {
  bindEvents();
  await loadPackages();
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTool(button.dataset.tool));
  });

  els.mobileToolSelect.addEventListener("change", () => {
    setActiveTool(els.mobileToolSelect.value);
  });

  els.packageSelect.addEventListener("change", async () => {
    await loadPackageDetails(els.packageSelect.value);
  });

  els.importButton.addEventListener("click", importItems);
  els.clearImportJsonButton.addEventListener("click", () => {
    els.itemsJson.value = "";
  });
  els.exportSkippedItemsButton.addEventListener("click", exportSkippedItems);
  els.showPackageIndexButton.addEventListener("click", showPackageIndexJson);
  els.createPackageButton.addEventListener("click", beginNewPackage);
  els.packageDetailsForm.addEventListener("submit", savePackageDetails);
  els.resetPackageDetailsButton.addEventListener("click", cancelPackageDetails);
  els.packageManagerTitle.addEventListener("input", () => {
    if (state.packageFormMode === "create" && !state.packageIdTouched) {
      els.packageManagerId.value = slugify(els.packageManagerTitle.value);
    }
  });
  els.packageManagerId.addEventListener("input", () => {
    if (state.packageFormMode === "create") state.packageIdTouched = true;
  });
  els.packageStatsDimension.addEventListener("change", () => {
    els.packageStatsSearch.value = "";
    renderPackageStatistics();
  });
  els.packageStatsSearch.addEventListener("input", renderPackageStatistics);
  els.validatePackageButton.addEventListener("click", () => {
    renderPackageManager();
    renderPackageActionStatus("Validation refreshed.", "success");
  });
  els.exportPackageButton.addEventListener("click", exportSelectedPackage);
  els.clonePackageButton.addEventListener("click", () => openPackageModal("clone"));
  els.deletePackageButton.addEventListener("click", deleteSelectedPackage);
  els.importPackageButton.addEventListener("click", importFullPackage);
  els.cancelPackageModalButton.addEventListener("click", () => els.packageModal.close());
  els.submitPackageModalButton.addEventListener("click", submitPackageModal);
  els.modalPackageTitle.addEventListener("input", () => {
    if (!els.modalPackageId.dataset.touched) {
      els.modalPackageId.value = slugify(els.modalPackageTitle.value);
    }
  });
  els.modalPackageId.addEventListener("input", () => {
    els.modalPackageId.dataset.touched = "true";
  });
  els.itemSearchInput.addEventListener("input", renderItemList);
  els.copySelectedItemJsonButton.addEventListener("click", copySelectedItemJson);
  els.exportSelectedItemJsonButton.addEventListener("click", exportSelectedItemJson);
  els.addTagsToResultsButton.addEventListener("click", () => applyTagsToSearchResults("add"));
  els.removeTagsFromResultsButton.addEventListener("click", () => applyTagsToSearchResults("remove"));
  els.replaceTagsForResultsButton.addEventListener("click", () => applyTagsToSearchResults("replace"));
  els.editItemButton.addEventListener("click", enterEditMode);
  els.cancelEditButton.addEventListener("click", cancelEdit);
  els.saveItemButton.addEventListener("click", saveSelectedItem);
  els.validateItemsButton.addEventListener("click", validatePastedItems);
  els.validatorImportButton.addEventListener("click", importValidatedItems);
  els.clearValidatorJsonButton.addEventListener("click", () => {
    els.validatorItemsJson.value = "";
  });
  [
    els.editorItemBlueprint,
    els.editorItemDomain,
    els.editorItemType,
    els.editorItemDifficulty,
    els.editorItemTopic,
    els.editorItemSubtopic,
    els.editorItemTags,
    els.editorFront,
    els.editorBack
  ].forEach((input) => {
    input.addEventListener("input", renderDraftPreview);
  });
}

async function loadPackages(preferredPackageId) {
  try {
    const [packagesResponse, indexResponse] = await Promise.all([
      fetch("/api/packages"),
      fetch("/api/package-index")
    ]);
    const data = await packagesResponse.json();
    const indexData = await indexResponse.json();
    if (!packagesResponse.ok) throw new Error(data.error || "Could not load packages.");
    if (!indexResponse.ok) throw new Error(indexData.error || "Could not load package index.");
    state.packages = data.packages || [];
    state.packageIndex = indexData.index;
    state.packageIndexFormatted = indexData.formatted || "";
    state.packageIndexSync = indexData.sync;
    renderPackageOptions();
    renderPackageIndexTable();
    renderPackageIndexSync();
    const packageToLoad = state.packages.find((package) => package.packageId === preferredPackageId)
      || state.packages.find((package) => package.packageId === state.currentPackage?.id)
      || state.packages[0];
    if (packageToLoad) {
      await loadPackageDetails(packageToLoad.packageId);
    }
  } catch (error) {
    renderSummary(error.message, "error");
    renderEmptyPackageState(error.message);
  }
}

async function loadPackageDetails(packageId) {
  if (!packageId) return;

  try {
    const response = await fetch(`/api/package?packageId=${encodeURIComponent(packageId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load package.");

    state.currentPackage = data.package;
    state.currentPackageDetails = data;
    state.packageFormMode = "edit";
    state.packageIdTouched = false;
    state.items = data.items || [];
    if (els.packageSelect.value !== packageId) {
      els.packageSelect.value = packageId;
    }
    state.editMode = false;
    state.selectedItemId = state.selectedItemId && state.items.some((item) => item.id === state.selectedItemId)
      ? state.selectedItemId
      : state.items[0]?.id || null;

    renderCurrentPackage();
    renderDashboard();
    renderPackageManager();
    renderImportPackageDetails();
    renderItemList();
    renderSelectedItem();
  } catch (error) {
    renderSummary(error.message, "error");
    renderEmptyPackageState(error.message);
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

function renderPackageOptions() {
  els.packageSelect.replaceChildren();
  state.packages.forEach((package) => {
    const option = document.createElement("option");
    option.value = package.packageId;
    option.textContent = `${package.title} (${package.packageId})`;
    els.packageSelect.append(option);
  });

  if (!state.packages.length) {
    const option = document.createElement("option");
    option.textContent = "No packages found";
    els.packageSelect.append(option);
  }
}

function renderCurrentPackage() {
  const title = state.currentPackage?.title || "No package selected";
  els.currentPackageLine.textContent = `Current Bank: ${title}`;
  els.navPackageName.textContent = title;
  els.dashboardPackageName.textContent = title;
}

function renderDashboard() {
  const summary = state.currentPackageDetails?.summary;
  if (!summary) return;

  els.totalItemsMetric.textContent = summary.totalItems;
  els.readinessMetric.textContent = summary.exportReady ? "Ready" : "Needs review";
  els.readinessMetric.classList.toggle("is-ready", summary.exportReady);
  els.readinessDetail.textContent = summary.exportReady
    ? "No missing required fields or duplicate item IDs were found."
    : "Review missing fields or duplicate item IDs before exporting.";

  renderStatList(els.itemTypesList, summary.itemTypes);
  renderStatList(els.difficultyList, summary.difficulties);
  renderTags(summary.tags);
  renderIssueList(els.missingFieldsList, summary.missingFields, "No missing required fields.");
  renderIssueList(els.duplicateIdsList, summary.duplicateIds, "No duplicate IDs found.");
}

function renderPackageManager() {
  renderPackageIndexTable();
  renderPackageDetailsForm();
  renderPackageStatistics();
  renderPackageHealth();
  renderPackageCoverageWarnings();
  renderPackageIndexSync();
  renderPackageVersionNotes();
}

function renderPackageIndexTable() {
  if (!els.packageIndexTableBody) return;
  els.packageIndexTableBody.replaceChildren();
  if (!state.packages.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="8">No packages found.</td>`;
    els.packageIndexTableBody.append(row);
    return;
  }

  state.packages.forEach((package) => {
    const isSelected = package.packageId === state.currentPackage?.id;
    const row = document.createElement("tr");
    row.classList.toggle("is-selected", isSelected);
    row.innerHTML = `
      <td>${escapeHtml(package.title || "")}</td>
      <td><code>${escapeHtml(package.packageId || "")}</code></td>
      <td>${escapeHtml(package.subject || "")}</td>
      <td>${escapeHtml(package.version || "")}</td>
      <td>${package.itemCount ?? ""}</td>
      <td>${escapeHtml((package.tags || []).join(", "))}</td>
      <td><code>${escapeHtml(package.path || "")}</code></td>
      <td>
        <div class="table-actions">
          <button type="button" class="secondary-button small-button" data-package-action="view" data-package-id="${escapeHtml(package.packageId)}">View</button>
          <button type="button" class="secondary-button small-button" data-package-action="edit" data-package-id="${escapeHtml(package.packageId)}">Edit</button>
          <button type="button" class="secondary-button small-button" data-package-action="export" data-package-id="${escapeHtml(package.packageId)}">Export</button>
          <button type="button" class="danger-button small-button" data-package-action="delete" data-package-id="${escapeHtml(package.packageId)}">Delete</button>
        </div>
      </td>
    `;
    row.querySelectorAll("[data-package-action]").forEach((button) => {
      button.addEventListener("click", () => handlePackageTableAction(button.dataset.packageAction, button.dataset.packageId));
    });
    els.packageIndexTableBody.append(row);
  });
}

async function handlePackageTableAction(action, packageId) {
  if (packageId && packageId !== state.currentPackage?.id) {
    await loadPackageDetails(packageId);
  }
  if (action === "edit") els.packageManagerTitle.focus();
  if (action === "export") exportSelectedPackage();
  if (action === "delete") deleteSelectedPackage();
}

function renderPackageDetailsForm() {
  if (state.packageFormMode === "create") return;
  const package = state.currentPackage;
  const entry = state.currentPackageDetails?.indexEntry || {};
  els.packageFormHeading.textContent = "Bank Metadata";
  els.savePackageDetailsButton.textContent = "Save Bank Metadata";
  els.packageManagerId.value = package?.id || "";
  els.packageManagerTitle.value = package?.title || "";
  els.packageManagerVersion.value = package?.version || "";
  els.packageManagerSubject.value = entry.subject || "";
  els.packageManagerSource.value = package?.source || "";
  els.packageManagerTags.value = (entry.tags || []).join(", ");
  els.packageManagerDescription.value = package?.description || "";
}

function renderImportPackageDetails() {
  const package = state.currentPackage;
  const entry = state.currentPackageDetails?.indexEntry || {};
  els.importPackageTitle.textContent = package?.title || "Select a package";
  els.importPackageId.textContent = package?.id || "-";
  els.importPackageSubject.textContent = entry.subject || "-";
  els.importPackageVersion.textContent = package?.version || "-";
  els.importPackageItemCount.textContent = String(state.currentPackageDetails?.items?.length ?? "-");
  els.importPackageDescription.textContent = package?.description || entry.description || "-";
}

function renderPackageStatistics() {
  const summary = state.currentPackageDetails?.summary;
  if (!summary) return;
  els.packageStatsTotal.textContent = summary.totalItems;
  els.packageStatsBlueprintTotal.textContent = Object.keys(summary.blueprints || {}).length;
  els.packageStatsDomainTotal.textContent = Object.keys(summary.domains || {}).length;
  els.packageStatsTopicTotal.textContent = Object.keys(summary.topics || {}).length;

  const dimension = els.packageStatsDimension.value || "blueprints";
  const query = els.packageStatsSearch.value.trim().toLowerCase();
  const entries = statEntriesFor(summary, dimension)
    .filter(([label]) => String(label).toLowerCase().includes(query))
    .sort(([labelA, countA], [labelB, countB]) => countB - countA || String(labelA).localeCompare(String(labelB)));
  const visibleEntries = entries.slice(0, 60);

  els.packageStatsResultCount.textContent = `${entries.length} ${statDimensionLabel(dimension)} ${entries.length === 1 ? "result" : "results"}${entries.length > visibleEntries.length ? " - showing first 60" : ""}.`;
  renderStatEntries(els.packageStatsList, visibleEntries, "No matching statistics.");
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
    itemTypes: "type",
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

function renderPackageHealth() {
  const health = state.currentPackageDetails?.summary?.health;
  if (!health) return;
  els.packageHealthStatus.textContent = health.valid ? "Valid" : "Invalid";
  els.packageHealthStatus.classList.toggle("is-ready", health.valid);
  els.packageHealthList.replaceChildren();
  const groups = [
    ["Missing required fields", health.missingRequiredFields],
    ["Duplicate item IDs", health.duplicateItemIds],
    ["Invalid render blocks", health.invalidRenderBlocks],
    ["Empty front/back blocks", health.emptyFrontBackBlocks],
    ["Unknown difficulty values", health.unknownDifficultyValues],
    ["Unknown item type values", health.unknownItemTypeValues],
    ["Missing tags", health.missingTags]
  ];
  groups.forEach(([label, items]) => {
    const item = document.createElement("p");
    item.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${items?.length ? escapeHtml(items.slice(0, 6).join("; ")) : "None"}`;
    els.packageHealthList.append(item);
  });
}

function renderPackageCoverageWarnings() {
  renderIssueList(els.packageCoverageWarnings, state.currentPackageDetails?.summary?.coverageWarnings, "No coverage warnings.");
}

function renderPackageIndexSync() {
  if (!state.packageIndexSync) return;
  els.packageIndexSyncStatus.textContent = state.packageIndexSync.valid ? "Synced" : "Needs review";
  els.packageIndexSyncStatus.classList.toggle("is-ready", state.packageIndexSync.valid);
  renderIssueList(els.packageIndexSyncList, state.packageIndexSync.issues, "Every indexed package path loads and IDs match.");
}

function renderPackageVersionNotes() {
  const history = state.currentPackageDetails?.summary?.versionHistory || [];
  els.packageVersionNotes.replaceChildren();
  if (!history.length) {
    els.packageVersionNotes.append(emptyText("No version history recorded. Optional history[] notes are supported when present."));
    return;
  }
  history.forEach((entry) => {
    const item = document.createElement("p");
    item.innerHTML = `<strong>${escapeHtml(entry.version || "Version")}</strong> ${escapeHtml(entry.date || "")}<br>${escapeHtml(entry.notes || "")}`;
    els.packageVersionNotes.append(item);
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

function renderItemList() {
  const query = els.itemSearchInput.value.trim().toLowerCase();
  const items = query ? state.items.filter((item) => itemMatches(item, query)) : state.items;
  state.visibleItemIds = items.map((item) => item.id).filter(Boolean);
  els.itemList.replaceChildren();

  if (!items.length) {
    els.itemList.append(emptyText("No items match this filter."));
    return;
  }

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-list-item";
    button.classList.toggle("is-active", item.id === state.selectedItemId);
    button.innerHTML = `
      <strong>${escapeHtml(item.id)}</strong>
      <span>${escapeHtml([item.domain, item.topic, item.subtopic].filter(Boolean).join(" / "))}</span>
    `;
    button.addEventListener("click", () => {
      if (state.editMode && hasEditorChanges()) {
        renderEditorStatus("Save or cancel the current edit before selecting another item.", "error");
        return;
      }
      state.selectedItemId = item.id;
      state.editMode = false;
      renderItemList();
      renderSelectedItem();
    });
    els.itemList.append(button);
  });
}

function renderSelectedItem() {
  const item = state.items.find((candidate) => candidate.id === state.selectedItemId);
  if (!item) {
    els.selectedItemPath.textContent = "Select an item to view metadata.";
    els.editorPreview.textContent = "Select an item to preview it.";
    return;
  }

  els.editorItemId.value = item.id || "";
  els.editorItemBlueprint.value = item.blueprint || "";
  els.editorItemDomain.value = item.domain || "";
  els.editorItemType.value = item.type || "";
  els.editorItemDifficulty.value = item.difficulty || "";
  els.editorItemTopic.value = item.topic || "";
  els.editorItemSubtopic.value = item.subtopic || "";
  els.editorItemTags.value = Array.isArray(item.tags) ? item.tags.join(", ") : "";
  els.editorFront.value = blocksToText(item.front);
  els.editorBack.value = blocksToText(item.back);
  renderSelectedItemMetadata(item);
  renderReadonlyPreview(item);
  renderEditorMode();
  renderEditorStatus("", "neutral");
}

function renderSelectedItemMetadata(item) {
  const path = [item.domain, item.topic, item.subtopic].filter(Boolean).join(" | ") || "No domain, topic, or subtopic";
  els.selectedItemPath.textContent = path;
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

function itemMatches(item, query) {
  return [
    item.id,
    item.domain,
    item.topic,
    item.subtopic,
    item.type,
    item.difficulty,
    ...(item.tags || []),
    blocksToText(item.front),
    blocksToText(item.back)
  ].some((value) => String(value || "").toLowerCase().includes(query));
}

function enterEditMode() {
  if (!state.selectedItemId) return;
  state.editMode = true;
  renderEditorMode();
  renderDraftPreview();
  renderEditorStatus("Editing selected item.", "neutral");
}

function cancelEdit() {
  state.editMode = false;
  renderSelectedItem();
}

async function saveSelectedItem() {
  const item = selectedItem();
  if (!item) return;

  els.saveItemButton.disabled = true;
  renderEditorStatus("Saving changes...", "neutral");

  try {
    const response = await fetch("/api/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(readItemEditorPayload(item))
    });
    const data = await response.json();
    if (!response.ok) {
      const details = data.details?.length ? ` ${data.details.join(" ")}` : "";
      throw new Error(`${data.error || "Save failed."}${details}`);
    }

    const index = state.items.findIndex((candidate) => candidate.id === data.item.id);
    if (index !== -1) state.items[index] = data.item;
    state.currentPackageDetails.items = state.items;
    state.currentPackageDetails.summary = data.summary;
    state.editMode = false;
    renderDashboard();
    renderItemList();
    renderSelectedItem();
    renderEditorStatus("Changes saved.", "success");
  } catch (error) {
    renderEditorStatus(error.message, "error");
  } finally {
    els.saveItemButton.disabled = false;
  }
}

function readItemEditorPayload(item) {
  return {
    packageId: state.currentPackage?.id,
    itemId: item.id,
    blueprint: els.editorItemBlueprint.value,
    domain: els.editorItemDomain.value,
    type: els.editorItemType.value,
    difficulty: els.editorItemDifficulty.value,
    topic: els.editorItemTopic.value,
    subtopic: els.editorItemSubtopic.value,
    tags: parseTags(els.editorItemTags.value),
    front: facePayload(item.front, els.editorFront.value),
    back: facePayload(item.back, els.editorBack.value)
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
  [
    els.editorItemBlueprint,
    els.editorItemDomain,
    els.editorItemType,
    els.editorItemDifficulty,
    els.editorItemTopic,
    els.editorItemSubtopic,
    els.editorItemTags,
    els.editorFront,
    els.editorBack
  ].forEach((input) => {
    input.disabled = !editable;
  });
  els.editItemButton.hidden = editable;
  els.cancelEditButton.hidden = !editable;
  els.saveItemButton.hidden = !editable;
}

function renderDraftPreview() {
  const item = selectedItem();
  if (!item) return;
  const draftItem = {
    ...item,
    blueprint: els.editorItemBlueprint.value,
    domain: els.editorItemDomain.value,
    type: els.editorItemType.value,
    difficulty: els.editorItemDifficulty.value,
    topic: els.editorItemTopic.value,
    subtopic: els.editorItemSubtopic.value,
    tags: parseTags(els.editorItemTags.value),
    front: facePayload(item.front, els.editorFront.value),
    back: facePayload(item.back, els.editorBack.value)
  };
  renderSelectedItemMetadata(draftItem);
  renderReadonlyPreview(draftItem);
}

function renderReadonlyPreview(item) {
  els.editorPreview.replaceChildren(renderPreviewBlock("Front", item.front), renderPreviewBlock("Back", item.back));
}

function selectedItem() {
  return state.items.find((candidate) => candidate.id === state.selectedItemId);
}

async function applyTagsToSearchResults(mode) {
  const tags = parseTags(els.bulkTagsInput.value);
  const targetItems = state.items.filter((item) => state.visibleItemIds.includes(item.id));
  if (!targetItems.length) {
    renderEditorStatus("No search results to update.", "error");
    return;
  }
  if (!tags.length && mode !== "replace") {
    renderEditorStatus("Enter one or more tags first.", "error");
    return;
  }

  const confirmed = confirm(`${modeTagsLabel(mode)} ${targetItems.length} visible item${targetItems.length === 1 ? "" : "s"}?`);
  if (!confirmed) return;

  setBulkTagButtonsDisabled(true);
  renderEditorStatus(`${modeTagsLabel(mode)} ${targetItems.length} visible item${targetItems.length === 1 ? "" : "s"}...`, "neutral");
  try {
    for (const item of targetItems) {
      const nextTags = tagsForMode(item.tags || [], tags, mode);
      const response = await fetch("/api/item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemPayloadFromItem(item, { tags: nextTags }))
      });
      const data = await response.json();
      if (!response.ok) {
        const details = data.details?.length ? ` ${data.details.join(" ")}` : "";
        throw new Error(`${data.error || "Bulk tag update failed."}${details}`);
      }
      const index = state.items.findIndex((candidate) => candidate.id === data.item.id);
      if (index !== -1) state.items[index] = data.item;
      state.currentPackageDetails.items = state.items;
      state.currentPackageDetails.summary = data.summary;
    }
    renderDashboard();
    renderItemList();
    renderSelectedItem();
    renderEditorStatus(`${modeTagsLabel(mode)} ${targetItems.length} visible item${targetItems.length === 1 ? "" : "s"}.`, "success");
  } catch (error) {
    renderEditorStatus(error.message, "error");
  } finally {
    setBulkTagButtonsDisabled(false);
  }
}

function setBulkTagButtonsDisabled(disabled) {
  [els.addTagsToResultsButton, els.removeTagsFromResultsButton, els.replaceTagsForResultsButton].forEach((button) => {
    button.disabled = disabled;
  });
}

function modeTagsLabel(mode) {
  return {
    add: "Add tags to",
    remove: "Remove tags from",
    replace: "Replace tags for"
  }[mode] || "Update tags for";
}

function tagsForMode(currentTags, requestedTags, mode) {
  const current = normalizeUniqueTags(currentTags);
  const requested = normalizeUniqueTags(requestedTags);
  if (mode === "replace") return requested;
  if (mode === "remove") {
    const removeSet = new Set(requested.map((tag) => tag.toLowerCase()));
    return current.filter((tag) => !removeSet.has(tag.toLowerCase()));
  }
  return normalizeUniqueTags([...current, ...requested]);
}

function itemPayloadFromItem(item, overrides = {}) {
  return {
    packageId: state.currentPackage?.id,
    itemId: item.id,
    blueprint: item.blueprint,
    domain: item.domain,
    type: item.type,
    difficulty: item.difficulty,
    topic: item.topic,
    subtopic: item.subtopic,
    tags: item.tags,
    front: item.front,
    back: item.back,
    ...overrides
  };
}

async function copySelectedItemJson() {
  const item = selectedItem();
  if (!item) return;
  const text = `${JSON.stringify(item, null, 2)}\n`;
  try {
    await navigator.clipboard.writeText(text);
    renderEditorStatus(`Copied ${item.id || "selected item"} JSON.`, "success");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    renderEditorStatus(`Copied ${item.id || "selected item"} JSON.`, "success");
  }
}

function exportSelectedItemJson() {
  const item = selectedItem();
  if (!item) return;
  downloadJson(item, `${jsonFilenamePart(item.id || "selected-item")}.json`);
  renderEditorStatus(`Exported ${item.id || "selected item"} JSON.`, "success");
}

function hasEditorChanges() {
  const item = selectedItem();
  if (!item) return false;
  return els.editorItemBlueprint.value !== (item.blueprint || "")
    || els.editorItemDomain.value !== (item.domain || "")
    || els.editorItemType.value !== (item.type || "")
    || els.editorItemDifficulty.value !== (item.difficulty || "")
    || els.editorItemTopic.value !== (item.topic || "")
    || els.editorItemSubtopic.value !== (item.subtopic || "")
    || els.editorItemTags.value !== (Array.isArray(item.tags) ? item.tags.join(", ") : "")
    || els.editorFront.value !== blocksToText(item.front)
    || els.editorBack.value !== blocksToText(item.back);
}

function renderEditorStatus(message, type) {
  els.editorStatus.textContent = message;
  els.editorStatus.classList.toggle("is-error", type === "error");
  els.editorStatus.classList.toggle("is-success", type === "success");
}

async function savePackageDetails(event) {
  event.preventDefault();
  const nextId = slugify(els.packageManagerId.value);
  const isCreating = state.packageFormMode === "create";
  if (!isCreating && !state.currentPackage) return;
  if (!isCreating && nextId !== state.currentPackage.id && !confirm("Changing package.id can disconnect existing local progress tied to the old package ID. Continue?")) {
    els.packageManagerId.value = state.currentPackage.id;
    return;
  }

  els.savePackageDetailsButton.disabled = true;
  renderPackageDetailsStatus(isCreating ? "Creating bank..." : "Saving bank metadata...", "neutral");
  try {
    const response = await fetch("/api/package", {
      method: isCreating ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalPackageId: state.currentPackage?.id,
        packageId: nextId,
        title: els.packageManagerTitle.value,
        version: els.packageManagerVersion.value,
        subject: els.packageManagerSubject.value,
        source: els.packageManagerSource.value,
        tags: els.packageManagerTags.value,
        description: els.packageManagerDescription.value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save bank metadata.");
    await loadPackages(data.package.id);
    renderPackageDetailsStatus(isCreating ? "Bank created and added to the list." : "Bank metadata saved.", "success");
  } catch (error) {
    renderPackageDetailsStatus(error.message, "error");
  } finally {
    els.savePackageDetailsButton.disabled = false;
  }
}

function beginNewPackage() {
  state.packageFormMode = "create";
  state.packageIdTouched = false;
  setActiveTool("packages");
  els.packageFormHeading.textContent = "New Bank Metadata";
  els.packageManagerId.value = "";
  els.packageManagerTitle.value = "";
  els.packageManagerVersion.value = "0.1";
  els.packageManagerSubject.value = "";
  els.packageManagerSource.value = "";
  els.packageManagerTags.value = "";
  els.packageManagerDescription.value = "";
  els.savePackageDetailsButton.textContent = "Save Bank Metadata";
  renderPackageDetailsStatus("Enter metadata for the new bank.", "neutral");
  els.packageManagerTitle.focus();
}

function cancelPackageDetails() {
  state.packageFormMode = "edit";
  state.packageIdTouched = false;
  renderPackageDetailsForm();
  renderPackageDetailsStatus("Metadata changes canceled.", "neutral");
}

function renderPackageDetailsStatus(message, type) {
  els.packageDetailsStatus.textContent = message;
  els.packageDetailsStatus.classList.toggle("is-error", type === "error");
  els.packageDetailsStatus.classList.toggle("is-success", type === "success");
}

function renderPackageActionStatus(message, type) {
  els.packageActionStatus.textContent = message;
  els.packageActionStatus.classList.toggle("is-error", type === "error");
  els.packageActionStatus.classList.toggle("is-success", type === "success");
}

function showPackageIndexJson() {
  els.packageIndexJsonView.textContent = state.packageIndexFormatted || "{}";
  els.packageIndexDialog.showModal();
}

function openPackageModal(mode) {
  state.packageModalMode = mode;
  els.packageModalTitle.textContent = "Clone Bank";
  els.submitPackageModalButton.textContent = "Clone Bank";
  const source = mode === "clone" ? state.currentPackage : null;
  const entry = mode === "clone" ? state.currentPackageDetails?.indexEntry : null;
  els.modalPackageTitle.value = source ? `${source.title} Copy` : "";
  els.modalPackageId.value = source ? `${source.id}-copy` : "";
  els.modalPackageVersion.value = source?.version || "0.1";
  els.modalPackageSubject.value = entry?.subject || "";
  els.modalPackageSource.value = source?.source || "Admin package manager";
  els.modalPackageTags.value = (entry?.tags || []).join(", ");
  els.modalPackageDescription.value = source?.description || "";
  delete els.modalPackageId.dataset.touched;
  els.packageModal.showModal();
}

async function submitPackageModal() {
  const isClone = state.packageModalMode === "clone";
  const endpoint = isClone ? "/api/package/clone" : "/api/package";
  const body = {
    sourcePackageId: state.currentPackage?.id,
    title: els.modalPackageTitle.value,
    packageId: els.modalPackageId.value,
    version: els.modalPackageVersion.value,
    subject: els.modalPackageSubject.value,
    source: els.modalPackageSource.value,
    tags: els.modalPackageTags.value,
    description: els.modalPackageDescription.value
  };

  els.submitPackageModalButton.disabled = true;
  renderPackageActionStatus(isClone ? "Cloning bank..." : "Creating bank...", "neutral");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Bank action failed.");
    els.packageModal.close();
    renderPackageActionStatus(isClone ? "Bank cloned." : "Bank created.", "success");
    await loadPackages();
    await loadPackageDetails(data.package.id);
  } catch (error) {
    renderPackageActionStatus(error.message, "error");
  } finally {
    els.submitPackageModalButton.disabled = false;
  }
}

async function deleteSelectedPackage() {
  if (!state.currentPackage) return;
  const confirmed = confirm("Deleting this bank removes it from the bank index. Existing local progress may remain unless cleared separately.");
  if (!confirmed) return;
  renderPackageActionStatus("Removing bank from index...", "neutral");
  try {
    const response = await fetch("/api/package", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: state.currentPackage.id })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not delete package.");
    renderPackageActionStatus(`${data.packageId} removed from bank index.`, "success");
    state.currentPackage = null;
    state.currentPackageDetails = null;
    state.items = [];
    await loadPackages();
  } catch (error) {
    renderPackageActionStatus(error.message, "error");
  }
}

function exportSelectedPackage() {
  if (!state.currentPackageDetails) return;
  const packageData = {
    package: state.currentPackageDetails.package,
    items: state.currentPackageDetails.items
  };
  downloadJson(packageData, `${state.currentPackageDetails.package.id}.json`);
  renderPackageActionStatus(`Exported ${state.currentPackageDetails.package.id}.json.`, "success");
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

async function importFullPackage() {
  els.importPackageButton.disabled = true;
  renderPackageActionStatus("Importing package JSON...", "neutral");
  try {
    const response = await fetch("/api/package/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageJson: els.packageImportJson.value,
        replaceExisting: els.replacePackageImport.checked
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const details = data.details?.length ? ` ${data.details.join(" ")}` : "";
      throw new Error(`${data.error || "Import failed."}${details}`);
    }
    els.packageImportJson.value = "";
    renderPackageActionStatus(data.replaced ? "Package imported and replaced existing package." : "Package imported.", "success");
    await loadPackages();
    await loadPackageDetails(data.package.id);
  } catch (error) {
    renderPackageActionStatus(error.message, "error");
  } finally {
    els.importPackageButton.disabled = false;
  }
}

async function importItems() {
  els.importButton.disabled = true;
  state.lastSkippedItems = [];
  els.exportSkippedItemsButton.hidden = true;
  renderSummary("Importing items...", "neutral");

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

    state.lastSkippedItems = data.skippedItems || [];
    renderImportSummary(data, "success");
    els.exportSkippedItemsButton.hidden = state.lastSkippedItems.length === 0;
    if (els.clearJsonAfterImport.checked && !state.lastSkippedItems.length) {
      els.itemsJson.value = "";
    }
    await loadPackages();
    await loadPackageDetails(data.package.id);
  } catch (error) {
    renderSummary(error.message, "error");
  } finally {
    els.importButton.disabled = false;
  }
}

function renderSkippedImportDetails(skippedItems) {
  if (!skippedItems?.length) return "";
  return [
    `<span class="summary-note">Skipped because matching item IDs already exist and replacement is off.</span>`,
    `<ul>${skippedItems.slice(0, 10).map((item) => `<li><code>${escapeHtml(item.id)}</code>: ${escapeHtml(item.reason)}</li>`).join("")}</ul>`,
    skippedItems.length > 10 ? `<span class="summary-note">${skippedItems.length - 10} more skipped items are available in the export.</span>` : ""
  ].filter(Boolean).join("");
}

function renderImportSummary(data, type) {
  const importSummary = data.importSummary || {};
  const itemSummary = data.itemSummary || {};
  const status = importSummary.status || "Success";
  const fields = [
    ["Status", status],
    ["Payload type", importSummary.payloadType || "Unknown"],
    ["Items found", importSummary.totalFound ?? data.added + (data.replaced?.length || 0) + (data.skipped?.length || 0)],
    ["Items imported", importSummary.imported ?? data.added],
    ["Items updated", importSummary.updated ?? data.replaced?.length ?? 0],
    ["Items skipped", importSummary.skipped ?? data.skipped?.length ?? 0],
    ["Validation errors", importSummary.validationErrors ?? 0],
    ["Duplicate IDs", formatList(itemSummary.duplicateIds)],
    ["Missing required fields", formatList(itemSummary.missingRequiredFields)],
    ["Domains", formatCountKeys(itemSummary.domains)],
    ["Topics", formatCountKeys(itemSummary.topics)],
    ["Subtopics", formatCountKeys(itemSummary.subtopics)],
    ["Tags", formatTags(itemSummary.tags)],
    ["Types", formatCounts(itemSummary.typeCounts)],
    ["Difficulty", formatCounts(itemSummary.difficultyCounts)],
    ["Block types", formatCounts(itemSummary.renderBlockTypeCounts)],
    ["First imported item ID", itemSummary.firstItemId || "none"],
    ["Last imported item ID", itemSummary.lastItemId || "none"]
  ];

  renderSummary([
    `<strong>Import Summary</strong><br><strong>${escapeHtml(data.package?.title || "Selected package")}</strong> updated. ${escapeHtml(String(data.totalItems ?? 0))} items now in package.`,
    renderSummaryGrid(fields),
    renderSkippedImportDetails(state.lastSkippedItems)
  ].filter(Boolean).join(""), type);
}

function exportSkippedItems() {
  if (!state.lastSkippedItems.length) return;
  downloadJson({
    reason: "Items skipped during import because their IDs already exist in the selected package and replacement was off.",
    skipped: state.lastSkippedItems.map(({ id, reason, item }) => ({ id, reason, item }))
  }, `${state.currentPackage?.id || "package"}-skipped-items.json`);
}

async function validatePastedItems() {
  els.validateItemsButton.disabled = true;
  renderValidatorStatus("Validating items...", "neutral");

  try {
    const response = await fetch("/api/items/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: els.packageSelect.value,
        replaceDuplicates: els.validatorReplaceDuplicates.checked,
        itemsJson: els.validatorItemsJson.value
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
    els.validateItemsButton.disabled = false;
  }
}

async function importValidatedItems() {
  els.validatorImportButton.disabled = true;
  renderValidatorStatus("Importing valid items...", "neutral");

  try {
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: els.packageSelect.value,
        replaceDuplicates: els.validatorReplaceDuplicates.checked,
        itemsJson: els.validatorItemsJson.value
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const details = data.details?.length ? ` ${data.details.join(" ")}` : "";
      throw new Error(`${data.error || "Import failed."}${details}`);
    }

    if (els.validatorClearJsonAfterImport.checked && !(data.skippedItems || []).length) {
      els.validatorItemsJson.value = "";
    }
    renderValidatorResults({
      parseStatus: "Parsed",
      payloadType: data.importSummary?.payloadType || "Unknown",
      totalItems: data.importSummary?.totalFound || 0,
      validItems: data.importSummary?.imported || 0,
      invalidItems: [],
      duplicateItems: (data.skippedItems || []).map((item) => ({
        id: item.id,
        skipReason: item.reason
      })),
      summary: data.itemSummary,
      importSummary: data.importSummary
    });
    await loadPackages();
    await loadPackageDetails(data.package.id);
  } catch (error) {
    renderValidatorError(error.message);
  } finally {
    els.validatorImportButton.disabled = false;
  }
}

function renderValidatorResults(data) {
  els.validatorTotalItems.textContent = String(data.totalItems || 0);
  els.validatorValidItems.textContent = String(data.validItems || 0);
  els.validatorInvalidItems.textContent = String(data.invalidItems?.length || 0);
  els.validatorResults.replaceChildren();

  const issues = [
    ...(data.invalidItems || []).map((item) => ({
      title: `${item.id} did not validate`,
      details: item.errors
    })),
    ...(data.duplicateItems || []).map((item) => ({
      title: `${item.id} would be skipped on import`,
      details: [item.skipReason]
    }))
  ];

  const summary = document.createElement("div");
  summary.className = "validation-result-item";
  summary.innerHTML = `
    <strong>${data.importSummary ? "Import Summary" : "Validation Summary"}</strong>
    ${renderSummaryGrid([
      ["JSON parse status", data.parseStatus || "Parsed"],
      ["Payload type", data.payloadType || "Unknown"],
      ["Total items detected", data.totalItems || 0],
      ["Required fields", data.summary?.missingRequiredFields?.length ? "Needs fixes" : "Present"],
      ["Duplicate IDs", formatList(data.summary?.duplicateIds)],
      ["Missing required fields", formatList(data.summary?.missingRequiredFields)],
      ["Invalid tags format", formatList(data.summary?.invalidTagsFormat)],
      ["Invalid front/back format", formatList(data.summary?.invalidFrontBackFormat)],
      ["Invalid render blocks", formatList(data.summary?.invalidRenderBlocks)],
      ["Types", formatCounts(data.summary?.typeCounts)],
      ["Difficulty", formatCounts(data.summary?.difficultyCounts)],
      ["Domains", formatCountKeys(data.summary?.domains)],
      ["Topics", formatCountKeys(data.summary?.topics)],
      ["Subtopics", formatCountKeys(data.summary?.subtopics)],
      ["Tags", formatTags(data.summary?.tags)],
      ["Block types", formatCounts(data.summary?.renderBlockTypeCounts)]
    ])}
  `;
  els.validatorResults.append(summary);

  if (!issues.length) {
    els.validatorResults.append(makeIssueParagraph("All pasted items validate. No import skips detected for the selected options."));
    return;
  }

  issues.forEach((issue) => {
    const block = document.createElement("div");
    block.className = "validation-result-item";
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
  els.validatorTotalItems.textContent = "0";
  els.validatorValidItems.textContent = "0";
  els.validatorInvalidItems.textContent = "0";
  els.validatorResults.replaceChildren(makeIssueParagraph(message));
}

function renderValidatorError(message) {
  els.validatorTotalItems.textContent = "0";
  els.validatorValidItems.textContent = "0";
  els.validatorInvalidItems.textContent = "0";
  const block = document.createElement("div");
  block.className = "validation-result-item";
  block.innerHTML = `
    <strong>Validation Summary</strong>
    ${renderSummaryGrid([
      ["JSON parse status", message.startsWith("Invalid JSON") ? "Failed" : "Not parsed"],
      ["Payload type", "Invalid/unknown"],
      ["Total items detected", 0]
    ])}
  `;
  els.validatorResults.replaceChildren(block, makeIssueParagraph(message));
}

function makeIssueParagraph(message) {
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  return paragraph;
}

function readForm() {
  return {
    packageId: els.packageSelect.value,
    replaceDuplicates: els.replaceDuplicates.checked,
    itemsJson: els.itemsJson.value
  };
}

function renderSummary(message, type) {
  els.importSummary.classList.toggle("is-error", type === "error");
  els.importSummary.classList.toggle("is-success", type === "success");
  els.importSummary.innerHTML = message;
}

function renderSummaryGrid(fields) {
  return `<div class="summary-grid">${fields.map(([label, value]) => `
    <p><span>${escapeHtml(label)}</span>${escapeHtml(normalizeSummaryValue(value))}</p>
  `).join("")}</div>`;
}

function normalizeSummaryValue(value) {
  if (value === undefined || value === null || value === "") return "none";
  return String(value);
}

function formatCounts(counts) {
  const entries = Object.entries(counts || {}).filter(([, count]) => count > 0);
  if (!entries.length) return "none";
  return entries
    .sort(([labelA, countA], [labelB, countB]) => countB - countA || labelA.localeCompare(labelB))
    .map(([label, count]) => `${label} ${count}`)
    .join(", ");
}

function formatCountKeys(counts) {
  const keys = Object.entries(counts || {})
    .filter(([label, count]) => label !== "missing" && count > 0)
    .sort(([labelA], [labelB]) => labelA.localeCompare(labelB))
    .map(([label]) => label);
  return keys.length ? keys.join(", ") : "none";
}

function formatTags(tags) {
  if (!tags?.length) return "none";
  return tags.map(({ tag, count }) => `${tag} ${count}`).join(", ");
}

function formatList(items) {
  return items?.length ? items.slice(0, 12).join("; ") : "none";
}

function jsonFilenamePart(value) {
  return String(value)
    .trim()
    .replace(/[\\/:"*?<>|]+/g, "-")
    .replace(/^-+|-+$/g, "") || "selected-item";
}

function renderEmptyPackageState(message) {
  els.currentPackageLine.textContent = `Current Bank: ${message}`;
  els.navPackageName.textContent = "No bank loaded";
  els.dashboardPackageName.textContent = "No bank loaded";
  els.importPackageTitle.textContent = message;
  els.importPackageId.textContent = "-";
  els.importPackageSubject.textContent = "-";
  els.importPackageVersion.textContent = "-";
  els.importPackageItemCount.textContent = "-";
  els.importPackageDescription.textContent = "-";
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

function parseTags(value) {
  if (Array.isArray(value)) return normalizeUniqueTags(value);
  return normalizeUniqueTags(String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean));
}

function normalizeUniqueTags(tags) {
  const seen = new Set();
  const normalized = [];
  (tags || []).forEach((tag) => {
    const value = String(tag || "").trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return;
    seen.add(key);
    normalized.push(value);
  });
  return normalized;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
