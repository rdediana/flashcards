# Flashcards

A static, mobile-friendly flashcard viewer with a local admin tool for importing, editing, and validating deck data.

## Features

- Static flashcard viewer.
- Local-only admin interface for deck imports and card edits.
- JSON files as the source of truth for decks and cards.
- Browser `localStorage` progress tracking by deck and card ID.
- Dashboard checks for missing fields, duplicate IDs, tag summaries, and export readiness.

## Project structure

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
  index.html
  admin.css
  admin.js
  deck-store.js
  server.js

shared/
  schema/
  examples/
  validation/
```

## Local development

The viewer loads deck JSON with `fetch`, so serve the project from a local web server instead of opening files directly:

```bash
python3 -m http.server 8000
```

Open the viewer at:

```text
http://localhost:8000
```

The root page redirects to `viewer/`.

## Admin tool

The admin tool runs as a separate local service because it writes to deck JSON files:

```bash
node admin/server.js
```

Open the admin UI at:

```text
http://localhost:8787
```

The admin service reads and writes deck data under `viewer/data/`.

Current admin areas include:

- Dashboard
- Decks
- Card Editor
- Import / Export
- Validate
- Settings

## Deck data

Deck metadata is stored in:

```text
viewer/data/deck-index.json
```

Deck files are stored in:

```text
viewer/data/decks/
```

Keep card IDs stable after publishing. Viewer progress is stored in browser `localStorage` under:

```text
flashcards.progress.<deck-id>
```

## Deployment

The public viewer is deployed with GitHub Pages:

```text
https://rdediana.github.io/flashcards/
```

The admin tool is local-only and is not part of the public site.
