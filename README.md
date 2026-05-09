# CCNP Flashcards

A static, mobile-friendly CCNP ENCOR flashcard MVP.

## Run locally

Because the app loads JSON with `fetch`, use a tiny local server instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Run the admin importer

The admin MVP is a separate local web service that can write to deck JSON files:

```bash
node admin/server.js
```

Then open `http://localhost:8787`.

Current admin functions:

- Pick an existing deck from `data/deck-index.json`.
- Paste JSON shaped as `{ "cards": [...] }`, or paste a raw card array.
- Import new cards into the selected deck.
- Optionally replace cards that already have the same `id`.
- Create a new deck and add it to the deck index.

## Edit cards

Update cards in:

```text
data/decks/ccnp-encor-350-401-v1.2.json
```

Decks are listed in:

```text
data/deck-index.json
```

Progress is saved in browser `localStorage` under `flashcards.progress.<deck-id>`, so keep card IDs stable once added.
