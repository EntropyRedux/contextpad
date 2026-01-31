# Core Logic & Services Documentation

## Overview
This document covers the business logic and background services that power ContextPad's automation and data integrity.

---

## 1. Automation Engines

### Formula Parser (`src/services/formulaParser.ts`)
**Purpose:** A recursive descent parser for Excel-like text transformation syntax.

- **Tokenizer:** Breaks formula strings into function tokens and arguments.
- **Registry:** Maps function names (e.g., `UPPER`, `CAMEL`, `CSVTABLE`) to JavaScript implementations.
- **Context Awareness:** Functions like `LINE()` or `POS()` access the `EditorContext` to retrieve real-time editor state.
- **Nesting:** Supports deeply nested calls like `BOLD(TRIM(UPPER(selection)))`.

### Action Executor (`src/utils/actionExecutor.ts`)
**Purpose:** Executes user-defined logic against the current editor document.

- **Dual-Mode Execution:** 
    - **Formula Mode:** Direct execution via the Formula Parser.
    - **JavaScript Mode:** Execution via a sandboxed `Function` constructor with access to a restricted `helpers` API.
- **Action Exclusion:** Implements the `getFilteredText()` logic. If a code block is marked with `exclude="action:ID"`, the executor "redacts" that block (replaces content with spaces while preserving newlines) before passing the document text to the script. This prevents scripts from processing sensitive data or their own configurations.

---

## 2. Persistence Strategy (`src/services/storage`)

ContextPad utilizes a **Multi-Tiered Persistence** model to ensure performance and reliability.

### IndexedDB Storage (`IndexedDBStorage.ts`)
- **Role:** Primary storage for document content.
- **Rationale:** Bypasses the 5MB-10MB limits of `localStorage`, allowing for large context windows and thousands of drafting tabs.
- **Behavior:** Content saving is **debounced** (default 2 seconds) to prevent excessive disk I/O during rapid typing.

### LocalStorage Bridge
- **Role:** Storage for high-frequency, low-weight metadata.
- **Content:** UI state (collapsed categories, active tab ID), user settings, and recent file lists.

---

## 3. Intelligence Services

### Token Estimator (`src/services/tokenEstimator`)
- **Local Estimator:** Uses `js-tiktoken` for zero-latency, offline-compatible GPT-4o token counts.
- **Remote Estimators:** Provides adapters for Anthropic and Google Gemini APIs for precise billing-grade counting.
- **Cost Projection:** Calculates estimated USD costs based on real-time document length and selected model pricing.

### Code Block Parser (`src/utils/codeBlockParams.ts`)
- **Purpose:** Standardized parser for fenced code block metadata.
- **Syntax:** Handles `{key=value, flag, "quoted key"="quoted value"}` patterns.
- **Reliability:** Decoupled from line indices; uses string-based parsing to avoid position drift during document mutations.
