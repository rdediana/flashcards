const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "data");
const PACKAGE_DIR = path.join(DATA_DIR, "packages");
const PACKAGE_INDEX_PATH = path.join(DATA_DIR, "package-index.json");

const REQUIRED_ITEM_FIELDS = ["id", "blueprint", "domain", "topic", "subtopic", "type", "difficulty"];
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const VALID_ITEM_TYPES = new Set([
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

async function listPackages() {
  const index = await readPackageIndex();
  return Promise.all((index.packages || []).map(async (entry) => {
    try {
      const target = await readExistingPackage(index, entry.packageId);
      return {
        ...entry,
        version: target.packageData.package.version || "",
        itemCount: target.packageData.items.length
      };
    } catch {
      return {
        ...entry,
        version: "",
        itemCount: null
      };
    }
  }));
}

async function getPackageIndex() {
  const index = await readPackageIndex();
  return {
    index,
    formatted: `${JSON.stringify(index, null, 2)}\n`,
    sync: await checkPackageIndexSync(index)
  };
}

async function getPackage(packageId) {
  const index = await readPackageIndex();
  const target = await readExistingPackage(index, packageId);
  return {
    indexEntry: (index.packages || []).find((package) => package.packageId === packageId),
    package: target.packageData.package,
    items: target.packageData.items,
    summary: summarizePackage(target.packageData)
  };
}

async function createEmptyPackage(payload) {
  const index = await readPackageIndex();
  const target = await createPackage(index, {
    newPackageTitle: payload.title,
    newPackageId: payload.packageId,
    newPackageSubject: payload.subject,
    newPackageVersion: payload.version,
    newPackageSource: payload.source,
    newPackageTags: payload.tags,
    newPackageDescription: payload.description
  });

  await writeJsonFile(target.filePath, target.packageData);
  index.packages.push(target.indexEntry);
  await writePackageIndex(index);

  return {
    package: target.packageData.package,
    indexEntry: target.indexEntry,
    summary: summarizePackage(target.packageData)
  };
}

async function updatePackageDetails(payload) {
  const index = await readPackageIndex();
  const target = await readExistingPackage(index, payload.originalPackageId);
  const entry = (index.packages || []).find((package) => package.packageId === payload.originalPackageId);
  const nextPackageId = slugify(payload.packageId || target.packageData.package.id);
  const existingIds = new Set((index.packages || [])
    .map((package) => package.packageId)
    .filter((packageId) => packageId !== payload.originalPackageId));

  if (existingIds.has(nextPackageId)) {
    const error = new Error("Package ID already exists.");
    error.statusCode = 400;
    throw error;
  }

  const title = cleanString(payload.title);
  if (!title) {
    const error = new Error("Package title is required.");
    error.statusCode = 400;
    throw error;
  }

  target.packageData.package = {
    ...target.packageData.package,
    id: nextPackageId,
    title,
    version: cleanString(payload.version) || "0.1",
    source: cleanString(payload.source),
    description: cleanString(payload.description)
  };

  if (entry) {
    entry.packageId = nextPackageId;
    entry.title = title;
    entry.subject = cleanString(payload.subject) || entry.subject || "Test Simulators";
    entry.description = cleanString(payload.description);
    entry.tags = normalizeTags(payload.tags);
  }

  if (nextPackageId !== payload.originalPackageId) {
    const nextFilePath = path.join(PACKAGE_DIR, `${nextPackageId}.json`);
    await writeJsonFile(nextFilePath, target.packageData);
    await fs.unlink(target.filePath);
    if (entry) entry.path = `data/packages/${nextPackageId}.json`;
  } else {
    await writeJsonFile(target.filePath, target.packageData);
  }

  await writePackageIndex(index);
  return {
    package: target.packageData.package,
    indexEntry: entry,
    summary: summarizePackage(target.packageData)
  };
}

async function deletePackage(packageId) {
  const index = await readPackageIndex();
  const entry = (index.packages || []).find((package) => package.packageId === packageId);
  if (!entry) {
    const error = new Error("Select an existing package.");
    error.statusCode = 404;
    throw error;
  }

  index.packages = (index.packages || []).filter((package) => package.packageId !== packageId);
  const filePath = path.join(DATA_DIR, path.relative("data", entry.path));
  await fs.unlink(filePath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  await writePackageIndex(index);
  return { packageId, removedPath: entry.path, packages: index.packages };
}

async function clonePackage(payload) {
  const index = await readPackageIndex();
  const target = await readExistingPackage(index, payload.sourcePackageId);
  const existingIds = new Set((index.packages || []).map((package) => package.packageId));
  const title = cleanString(payload.title) || `${target.packageData.package.title} Copy`;
  const packageId = uniqueSlug(payload.packageId || title, existingIds);
  const cloned = JSON.parse(JSON.stringify(target.packageData));

  cloned.package = {
    ...cloned.package,
    id: packageId,
    title,
    version: cleanString(payload.version) || cloned.package.version || "0.1",
    source: cleanString(payload.source) || cloned.package.source || "Cloned package",
    description: cleanString(payload.description) || cloned.package.description || ""
  };

  if (Array.isArray(cloned.package.history)) {
    cloned.package.history = [
      ...cloned.package.history,
      {
        version: cloned.package.version,
        date: new Date().toISOString().slice(0, 10),
        notes: `Cloned from ${target.packageData.package.id}.`
      }
    ];
  }

  const indexEntry = {
    packageId,
    title,
    subject: cleanString(payload.subject) || target.indexEntry?.subject || "Test Simulators",
    description: cloned.package.description,
    path: `data/packages/${packageId}.json`,
    tags: normalizeTags(payload.tags || target.indexEntry?.tags || [])
  };

  await writeJsonFile(path.join(PACKAGE_DIR, `${packageId}.json`), cloned);
  index.packages.push(indexEntry);
  await writePackageIndex(index);

  return {
    package: cloned.package,
    indexEntry,
    summary: summarizePackage(cloned)
  };
}

async function importPackage(payload) {
  const packageData = parsePackageJson(payload.packageJson);
  const errors = validatePackageData(packageData);
  if (errors.length) {
    const error = new Error("Package validation failed.");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const index = await readPackageIndex();
  const replaceExisting = Boolean(payload.replaceExisting);
  const existingEntry = (index.packages || []).find((package) => package.packageId === packageData.package.id);
  if (existingEntry && !replaceExisting) {
    const error = new Error("A package with this ID already exists. Enable replace to import it.");
    error.statusCode = 400;
    throw error;
  }

  const indexEntry = {
    packageId: packageData.package.id,
    title: packageData.package.title,
    subject: cleanString(payload.subject) || existingEntry?.subject || "Test Simulators",
    description: packageData.package.description || "",
    path: `data/packages/${packageData.package.id}.json`,
    tags: normalizeTags(payload.tags || existingEntry?.tags || [])
  };

  await writeJsonFile(path.join(PACKAGE_DIR, `${packageData.package.id}.json`), packageData);
  if (existingEntry) {
    Object.assign(existingEntry, indexEntry);
  } else {
    index.packages.push(indexEntry);
  }
  await writePackageIndex(index);

  return {
    package: packageData.package,
    indexEntry,
    summary: summarizePackage(packageData),
    replaced: Boolean(existingEntry)
  };
}

async function importItems(payload) {
  const parsedPayload = parseItemPayload(payload.itemsJson);
  const parsedItems = parsedPayload.items;
  const itemErrors = validateItems(parsedItems);
  if (itemErrors.length) {
    const error = new Error("Item validation failed.");
    error.statusCode = 400;
    error.details = itemErrors;
    error.summary = buildItemSummary(parsedItems);
    error.payloadType = parsedPayload.payloadType;
    throw error;
  }

  const index = await readPackageIndex();
  const target = await readExistingPackage(index, payload.packageId);
  const result = mergeItems(target.packageData.items, parsedItems, Boolean(payload.replaceDuplicates));
  target.packageData.items = result.items;

  await writeJsonFile(target.filePath, target.packageData);
  await writePackageIndex(index);

  return {
    package: target.packageData.package,
    packagePath: target.indexEntry?.path || target.indexPath,
    added: result.added,
    replaced: result.replaced,
    skipped: result.skipped,
    skippedItems: result.skippedItems,
    importSummary: buildImportSummary(parsedPayload, result),
    itemSummary: buildItemSummary(parsedItems),
    totalItems: target.packageData.items.length
  };
}

async function validateItemImport(payload) {
  const parsedPayload = parseItemPayload(payload.itemsJson);
  const parsedItems = parsedPayload.items;
  const index = await readPackageIndex();
  const target = payload.packageId ? await readExistingPackage(index, payload.packageId) : null;
  const existingIds = new Set((target?.packageData.items || []).map((item) => item.id).filter(Boolean));
  const replaceDuplicates = Boolean(payload.replaceDuplicates);
  const results = buildItemValidationResults(parsedItems, existingIds, replaceDuplicates);
  const invalidItems = results.filter((item) => !item.valid);
  const duplicateItems = results.filter((item) => item.wouldSkip);
  const summary = buildItemSummary(parsedItems);

  return {
    parseStatus: "Parsed",
    payloadType: parsedPayload.payloadType,
    totalItems: parsedItems.length,
    validItems: results.length - invalidItems.length,
    invalidItems,
    duplicateItems,
    summary,
    results
  };
}

async function updateItem(payload) {
  const index = await readPackageIndex();
  const target = await readExistingPackage(index, payload.packageId);
  const itemIndex = target.packageData.items.findIndex((item) => item.id === payload.itemId);
  if (itemIndex === -1) {
    const error = new Error("Select an existing item.");
    error.statusCode = 404;
    throw error;
  }

  const existingItem = target.packageData.items[itemIndex];
  const updatedItem = {
    ...existingItem,
    blueprint: cleanString(payload.blueprint) || existingItem.blueprint,
    domain: cleanString(payload.domain) || existingItem.domain,
    type: cleanString(payload.type) || existingItem.type,
    difficulty: cleanString(payload.difficulty) || existingItem.difficulty,
    topic: cleanString(payload.topic) || existingItem.topic,
    subtopic: cleanString(payload.subtopic) || existingItem.subtopic,
    tags: Object.prototype.hasOwnProperty.call(payload, "tags") ? normalizeTags(payload.tags) : existingItem.tags,
    front: Array.isArray(payload.front) ? payload.front : existingItem.front,
    back: Array.isArray(payload.back) ? payload.back : existingItem.back
  };

  target.packageData.items[itemIndex] = updatedItem;
  const itemErrors = validateItems(target.packageData.items);
  if (itemErrors.length) {
    const error = new Error("Item validation failed.");
    error.statusCode = 400;
    error.details = itemErrors;
    throw error;
  }

  await writeJsonFile(target.filePath, target.packageData);
  await writePackageIndex(index);

  return {
    package: target.packageData.package,
    item: updatedItem,
    summary: summarizePackage(target.packageData)
  };
}

async function readPackageIndex() {
  const raw = await fs.readFile(PACKAGE_INDEX_PATH, "utf8");
  return JSON.parse(raw);
}

async function writePackageIndex(index) {
  index.updated = new Date().toISOString().slice(0, 10);
  await writeJsonFile(PACKAGE_INDEX_PATH, index);
}

async function writeJsonFile(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parsePackageJson(rawJson) {
  if (!rawJson || !rawJson.trim()) {
    const error = new Error("Paste package JSON before importing.");
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

function validatePackageData(packageData) {
  const errors = [];
  if (!packageData || typeof packageData !== "object" || Array.isArray(packageData)) {
    return ["Package JSON must be an object."];
  }
  if (!packageData.package || typeof packageData.package !== "object" || Array.isArray(packageData.package)) {
    errors.push("package object exists.");
  }
  if (!Array.isArray(packageData.items)) errors.push("items array exists.");
  if (!packageData.package?.id) errors.push("package.id exists.");
  if (!packageData.package?.title) errors.push("package.title exists.");
  if (Array.isArray(packageData.items)) errors.push(...validateItems(packageData.items));
  return errors;
}

function extractItems(rawJson) {
  return parseItemPayload(rawJson).items;
}

function parseItemPayload(rawJson) {
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
  let items;
  if (Array.isArray(parsed)) {
    payloadType = "Items array";
    items = parsed;
  } else if (Array.isArray(parsed?.items) && parsed?.package && typeof parsed.package === "object") {
    payloadType = "Full package object";
    items = parsed.items;
  } else if (Array.isArray(parsed?.items)) {
    payloadType = "Items-only object";
    items = parsed.items;
  } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.id) {
    payloadType = "Single item object";
    items = [parsed];
  }

  if (!Array.isArray(items)) {
    const error = new Error("JSON must contain a items array, or be an array of item objects.");
    error.statusCode = 400;
    throw error;
  }

  return { parsed, payloadType, items };
}

function validateItems(items) {
  const errors = [];
  const seenIds = new Set();

  items.forEach((item, index) => {
    const label = item?.id || `item ${index + 1}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${label} must be an object.`);
      return;
    }

    REQUIRED_ITEM_FIELDS.forEach((field) => {
      if (!item[field]) errors.push(`${label} missing ${field}.`);
    });

    if (seenIds.has(item.id)) errors.push(`Duplicate pasted item id: ${item.id}.`);
    seenIds.add(item.id);

    if (!Array.isArray(item.tags)) errors.push(`${label} tags must be an array.`);
    if (!Array.isArray(item.front)) errors.push(`${label} front must be an array.`);
    if (!Array.isArray(item.back)) errors.push(`${label} back must be an array.`);
    [...(item.front || []), ...(item.back || [])].forEach((block, blockIndex) => {
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

async function createPackage(index, payload) {
  const title = payload.newPackageTitle?.trim();
  if (!title) {
    const error = new Error("New package title is required.");
    error.statusCode = 400;
    throw error;
  }

  const existingIds = new Set((index.packages || []).map((package) => package.packageId));
  const packageId = uniqueSlug(payload.newPackageId || title, existingIds);
  const indexPath = `data/packages/${packageId}.json`;
  const nowVersion = payload.newPackageVersion?.trim() || "0.1";

  return {
    filePath: path.join(PACKAGE_DIR, `${packageId}.json`),
    indexPath,
    indexEntry: {
      packageId,
      title,
      subject: payload.newPackageSubject?.trim() || "Test Simulators",
      description: payload.newPackageDescription?.trim() || "",
      path: indexPath,
      tags: normalizeTags(payload.newPackageTags)
    },
    packageData: {
      package: {
        id: packageId,
        title,
        version: nowVersion,
        source: payload.newPackageSource?.trim() || "Admin import",
        description: payload.newPackageDescription?.trim() || ""
      },
      items: []
    }
  };
}

async function readExistingPackage(index, packageId) {
  const entry = (index.packages || []).find((package) => package.packageId === packageId);
  if (!entry) {
    const error = new Error("Select an existing package.");
    error.statusCode = 404;
    throw error;
  }

  const indexPath = entry.path;
  const filePath = path.join(DATA_DIR, path.relative("data", indexPath));
  const packageData = JSON.parse(await fs.readFile(filePath, "utf8"));
  if (!packageData.package || !Array.isArray(packageData.items)) {
    const error = new Error(`${entry.title} is not a valid package file.`);
    error.statusCode = 400;
    throw error;
  }

  return { filePath, indexPath, indexEntry: entry, packageData };
}

function mergeItems(existingItems, incomingItems, replaceDuplicates) {
  const items = [...existingItems];
  const idToIndex = new Map(items.map((item, index) => [item.id, index]));
  const skipped = [];
  const skippedItems = [];
  const replaced = [];
  let added = 0;

  incomingItems.forEach((item) => {
    if (idToIndex.has(item.id)) {
      if (replaceDuplicates) {
        items[idToIndex.get(item.id)] = item;
        replaced.push(item.id);
      } else {
        skipped.push(item.id);
        skippedItems.push({
          id: item.id,
          reason: "Item ID already exists in the selected package and replacement is off.",
          item
        });
      }
      return;
    }

    idToIndex.set(item.id, items.length);
    items.push(item);
    added += 1;
  });

  return { items, added, replaced, skipped, skippedItems };
}

function buildItemValidationResults(items, existingIds = new Set(), replaceDuplicates = false) {
  const seenIds = new Set();

  return items.map((item, index) => {
    const errors = [];
    const id = item?.id || "";
    const label = id || `item ${index + 1}`;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${label} must be an object.`);
    } else {
      REQUIRED_ITEM_FIELDS.forEach((field) => {
        if (!item[field]) errors.push(`${label} missing ${field}.`);
      });

      if (!Array.isArray(item.tags)) errors.push(`${label} tags must be an array.`);
      if (!Array.isArray(item.front)) errors.push(`${label} front must be an array.`);
      if (!Array.isArray(item.back)) errors.push(`${label} back must be an array.`);
      [...(item.front || []), ...(item.back || [])].forEach((block, blockIndex) => {
        validateBlock(block, `${label} block ${blockIndex + 1}`, errors);
      });
    }

    if (id) {
      if (seenIds.has(id)) errors.push(`Duplicate pasted item id: ${id}.`);
      seenIds.add(id);
    }

    const wouldSkip = Boolean(id && existingIds.has(id) && !replaceDuplicates);
    return {
      index: index + 1,
      id: id || `item ${index + 1}`,
      valid: errors.length === 0,
      errors,
      wouldSkip,
      skipReason: wouldSkip ? "Item ID already exists in the selected package and replacement is off." : "",
      item
    };
  });
}

function buildImportSummary(parsedPayload, mergeResult) {
  const failedCount = (mergeResult.skipped?.length || 0);
  const importedCount = (mergeResult.added || 0) + (mergeResult.replaced?.length || 0);
  return {
    status: failedCount ? "Partial success" : "Success",
    payloadType: parsedPayload.payloadType,
    totalFound: parsedPayload.items.length,
    imported: importedCount,
    added: mergeResult.added || 0,
    updated: mergeResult.replaced?.length || 0,
    skipped: mergeResult.skipped?.length || 0,
    duplicateIds: findDuplicates(parsedPayload.items.map((item) => item?.id).filter(Boolean)),
    validationErrors: 0
  };
}

function buildItemSummary(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const missingRequiredFields = [];
  const invalidTagsFormat = [];
  const invalidFrontBackFormat = [];
  const invalidRenderBlocks = [];
  const renderBlockTypeCounts = {};
  const tags = new Map();

  safeItems.forEach((item, index) => {
    const label = item?.id || `item ${index + 1}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      missingRequiredFields.push(`${label} must be an object`);
      return;
    }

    REQUIRED_ITEM_FIELDS.forEach((field) => {
      if (!item[field]) missingRequiredFields.push(`${label} missing ${field}`);
    });

    if (!Array.isArray(item.tags)) {
      invalidTagsFormat.push(`${label} tags must be an array`);
    } else {
      item.tags.forEach((tag) => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    }

    ["front", "back"].forEach((field) => {
      if (!Array.isArray(item[field])) {
        invalidFrontBackFormat.push(`${label} ${field} must be an array`);
        return;
      }
      item[field].forEach((block, blockIndex) => {
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
    totalItems: safeItems.length,
    blueprints: countBy(safeItems, "blueprint"),
    domains: countBy(safeItems, "domain"),
    topics: countBy(safeItems, "topic"),
    subtopics: countBy(safeItems, "subtopic"),
    typeCounts: countBy(safeItems, "type"),
    difficultyCounts: countBy(safeItems, "difficulty"),
    renderBlockTypeCounts,
    tags: Array.from(tags.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count })),
    duplicateIds: findDuplicates(safeItems.map((item) => item?.id).filter(Boolean)),
    missingRequiredFields,
    invalidTagsFormat,
    invalidFrontBackFormat,
    invalidRenderBlocks,
    firstItemId: safeItems[0]?.id || "",
    lastItemId: safeItems[safeItems.length - 1]?.id || ""
  };
}

function summarizePackage(packageData) {
  const items = packageData.items || [];
  const duplicateIds = findDuplicates(items.map((item) => item.id).filter(Boolean));
  const missingFields = [];
  const invalidBlocks = [];
  const emptyFaces = [];
  const unknownDifficulties = [];
  const unknownTypes = [];
  const missingTags = [];
  const itemTypes = countBy(items, "type");
  const difficulties = countBy(items, "difficulty");
  const blueprints = countBy(items, "blueprint");
  const domains = countBy(items, "domain");
  const topics = countBy(items, "topic");
  const subtopics = countBy(items, "subtopic");
  const tags = new Map();

  items.forEach((item) => {
    REQUIRED_ITEM_FIELDS.forEach((field) => {
      if (!item[field]) missingFields.push(`${item.id || "Unknown item"} missing ${field}`);
    });

    if (!VALID_DIFFICULTIES.has(item.difficulty)) unknownDifficulties.push(`${item.id || "Unknown item"} uses ${item.difficulty || "missing"}.`);
    if (!VALID_ITEM_TYPES.has(item.type)) unknownTypes.push(`${item.id || "Unknown item"} uses ${item.type || "missing"}.`);

    if (!Array.isArray(item.tags)) {
      missingFields.push(`${item.id || "Unknown item"} missing tags array`);
      missingTags.push(`${item.id || "Unknown item"} missing tags.`);
    } else {
      if (!item.tags.length) missingTags.push(`${item.id || "Unknown item"} has no tags.`);
      item.tags.forEach((tag) => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    }

    if (!Array.isArray(item.front) || !item.front.length) emptyFaces.push(`${item.id || "Unknown item"} has empty front blocks.`);
    if (!Array.isArray(item.back) || !item.back.length) emptyFaces.push(`${item.id || "Unknown item"} has empty back blocks.`);
    [...(item.front || []), ...(item.back || [])].forEach((block, blockIndex) => {
      const blockErrors = [];
      validateBlock(block, `${item.id || "Unknown item"} block ${blockIndex + 1}`, blockErrors);
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
    duplicateItemIds: duplicateIds,
    invalidRenderBlocks: invalidBlocks,
    emptyFrontBackBlocks: emptyFaces,
    unknownDifficultyValues: unknownDifficulties,
    unknownItemTypeValues: unknownTypes,
    missingTags
  };

  return {
    totalItems: items.length,
    itemTypes,
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
    coverageWarnings: buildCoverageWarnings(items, { itemTypes, difficulties, domains, topics }),
    versionHistory: Array.isArray(packageData.package?.history) ? packageData.package.history : [],
    exportReady: health.valid
  };
}

function buildCoverageWarnings(items, stats) {
  const warnings = [];
  if (!items.length) return ["Package has no items yet."];
  if (!stats.difficulties.hard) warnings.push("No hard items.");
  if (!stats.itemTypes.troubleshooting) warnings.push("No troubleshooting items.");
  if (!stats.itemTypes["cli-output"]) warnings.push("No CLI-output items.");

  Object.entries(stats.topics || {}).forEach(([topic, count]) => {
    if (topic !== "missing" && count < 3) warnings.push(`${topic} has very few items (${count}).`);
  });

  if ((stats.difficulties.easy || 0) / items.length > 0.65) warnings.push("Difficulty is skewed too easy.");

  const domainCounts = Object.values(stats.domains || {}).filter((count) => count > 0);
  if (domainCounts.length > 1 && Math.max(...domainCounts) > Math.min(...domainCounts) * 3) {
    warnings.push("Domain coverage is uneven.");
  }

  if ((stats.itemTypes.definition || 0) / items.length > 0.45) warnings.push("Too many definition-only items.");
  return warnings;
}

async function checkPackageIndexSync(index) {
  const issues = [];
  const packageIds = (index.packages || []).map((package) => package.packageId).filter(Boolean);
  findDuplicates(packageIds).forEach((packageId) => issues.push(`Duplicate package ID in index: ${packageId}.`));

  for (const entry of index.packages || []) {
    if (!entry.path) {
      issues.push(`${entry.packageId || entry.title || "Package"} is missing a path.`);
      continue;
    }

    try {
      const filePath = path.join(DATA_DIR, path.relative("data", entry.path));
      const packageData = JSON.parse(await fs.readFile(filePath, "utf8"));
      if (!packageData.package || !Array.isArray(packageData.items)) {
        issues.push(`${entry.packageId} path does not contain a valid package file.`);
      } else if (packageData.package.id !== entry.packageId) {
        issues.push(`${entry.packageId} index ID does not match loaded package ID ${packageData.package.id}.`);
      }
    } catch {
      issues.push(`${entry.packageId || entry.path} could not load from ${entry.path}.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function countBy(items, field) {
  return items.reduce((counts, item) => {
    const key = item && typeof item === "object" && !Array.isArray(item) && item[field] ? item[field] : "missing";
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
  return slug || `package-${Date.now()}`;
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
  clonePackage,
  createEmptyPackage,
  deletePackage,
  getPackage,
  getPackageIndex,
  importItems,
  importPackage,
  listPackages,
  updateItem,
  updatePackageDetails,
  validateItemImport,
  validateItems,
  validatePackageData
};
