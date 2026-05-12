# Flashcards

A static, mobile-friendly flashcard viewer with a local deck importer.

## Daily workflow

### 1. Start the local admin importer

```bash
cd /Users/rdediana/Documents/Codex/flashcards
node admin/server.js
```

Admin UI:

```text
http://localhost:8787
```

The admin service reads and writes deck files under `viewer/data/`.

### 2. Start the local viewer

Only start this if it is not already running:

Because the app loads JSON with `fetch`, use a tiny local server instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Viewer:

```text
http://localhost:8000
```

The root URL redirects to the viewer.

### 3. Import or update cards

Using the admin UI:

- Create a new deck or select an existing deck.
- Import generated card JSON.
- Enable duplicate replacement when intentionally updating existing cards.
- Use the Card Editor for direct fixes to existing cards.

Deck files update under:

```text
viewer/data/decks/
```

Deck metadata updates in:

```text
viewer/data/deck-index.json
```

### 4. Verify locally

Open:

```text
http://localhost:8000
```

Check:

- Deck loads from the viewer.
- Filters work.
- Cards render correctly.
- References and structured blocks render correctly.
- Browser console has no malformed JSON or fetch errors.
- Admin Dashboard shows no duplicate IDs or missing required fields.

### 5. Review changes

```bash
git status
git diff
```

### 6. Publish updates

```bash
git add viewer/data/deck-index.json viewer/data/decks
git commit -m "Update flashcard decks"
git push
```

GitHub Pages redeploys automatically.

Public site:

```text
https://rdediana.github.io/flashcards/
```

## Project layout

```text
index.html
  redirects to viewer/

viewer/
  index.html
  styles.css
  app.js
  data/
    deck-index.json
    decks/

admin/
  local importer app

shared/
  schema/
  examples/
  validation/
```

## Run the admin tool

The admin app is a separate local web service with its own tool-based navigation shell. It can read deck summaries and write to deck JSON files:

```bash
node admin/server.js
```

Then open `http://localhost:8787`.

Current admin areas:

- Dashboard: deck overview, card counts, tag summary, missing fields, duplicate IDs, and export readiness.
- Decks: placeholder area for future deck index, editor, and builder tools.
- Card Editor: top-level tool with searchable card list, selected-card metadata, front/back content search, edit mode, save, and preview.
- Import / Export: current card importer plus future export placeholders.
- Validate and Settings: placeholder areas for planned admin tooling.

## Edit cards

Update cards in:

```text
viewer/data/decks/ccnp-encor-350-401-v1.2.json
```

Decks are listed in:

```text
viewer/data/deck-index.json
```

Progress is saved in browser `localStorage` under `flashcards.progress.<deck-id>`, so keep card IDs stable once added.

## Recommended next improvements

### 1. Create a master deck schema reference

Use `shared/schema/` for the canonical deck format, AI generation contract, and validation reference.

### 2. Create a card generation pre-prompt

Standardize generated cards around consistent structure, deterministic IDs, duplicate prevention, and stable domain/topic/subtopic naming.

### 3. Add lightweight validation

Build on the admin summary checks with duplicate card ID detection, malformed JSON detection, schema validation, and missing reference detection.

### 4. Keep the architecture simple

The current architecture is intentionally lean:

```text
GitHub Pages = frontend hosting
viewer/data JSON files = source of truth
admin importer = local-only tooling
Git = version control and rollback
```

### 5. Keep the pre-push habit

Before every push:

```bash
git status
git diff
```

This helps avoid committing PDFs, secrets, temporary files, or broken deck data.
