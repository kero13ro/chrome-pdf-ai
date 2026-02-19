# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Extension (Manifest V3) that automates sending YouTube video transcripts and PDF documents to AI assistants (Claude or ChatGPT) for analysis. Pure vanilla JavaScript — no frameworks, no npm dependencies, no build tools beyond Make.

## Build & Release Commands

```bash
make build     # Creates dist/ directory
make zip       # Packages extension into timestamped zip (excludes .git, .claude, markdown files, etc.)
make release   # Full build + zip with size display
make clean     # Removes generated zip files
make test      # Validates required files exist (manifest.json, background.js, popup.html, popup.js)
```

Version is sourced from `manifest.json` — update it there for releases.

## Architecture

The extension follows Chrome's Manifest V3 content script architecture with message passing between components:

```
popup.js → background.js → content script → AI platform tab
```

### Core Components

- **`manifest.json`** — Extension config. Declares three content scripts with domain-specific matching and different run timings (`document_start` for YouTube, `document_idle` for Claude/ChatGPT).
- **`background.js`** — Service worker. Handles PDF detection (URL extension, Content-Type header, magic bytes), PDF download/base64 conversion, YouTube transcript routing, and message dispatch. Stores temporary data in `chrome.storage.local` with a 5-minute auto-cleanup TTL.
- **`popup.html` / `popup.js`** — Extension popup UI. Detects current page type (YouTube vs PDF), manages user settings (prompt text, AI platform choice), and triggers processing. Default prompts are in Traditional Chinese.
- **`content-youtube.js`** — YouTube transcript extraction with two fallback methods: (1) transcript panel UI scraping, (2) `ytInitialPlayerResponse` parsing with caption track fetching. Prioritizes English captions.
- **`content-claude.js`** — Claude.ai page integration. Uploads PDFs via DataTransfer API, inserts prompts into contenteditable div, auto-clicks send.
- **`content-chatgpt.js`** — ChatGPT page integration. Same pattern as Claude but with more complex button detection heuristics (grid area detection, rightmost button fallback).

### Data Flow

1. Popup detects page type and sends message to background service worker
2. Background either downloads PDF (converts to base64) or requests YouTube transcript from content script
3. Data stored temporarily in `chrome.storage.local`
4. New tab opens to selected AI platform (claude.ai or chatgpt.com)
5. Platform-specific content script auto-uploads file and submits prompt
6. Temporary data auto-expires after 5 minutes

### Key Patterns

- **DOM element waiting** uses `MutationObserver` with configurable timeouts via `waitForElement()` (present in all content scripts)
- **Multi-strategy detection** — both AI platform content scripts use cascading selector strategies with fallbacks to find file inputs and send buttons
- **Message passing** uses `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` throughout
- **No external servers** — all processing happens locally on the user's device
