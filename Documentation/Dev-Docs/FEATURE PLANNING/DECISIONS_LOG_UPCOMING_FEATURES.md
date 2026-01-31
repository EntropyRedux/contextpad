# Decisions Log: Upcoming Features

**Date:** January 25, 2026
**Status:** Research & Planning Phase
**Next Action:** Further research, then implementation

---

## Executive Summary

This document captures architectural decisions for three major upcoming features in ContextPad v1.6.0+:

1. **AI Blueprints** — Export documents as AI-optimized context packages (`.cntxt`)
2. **HTML Live Preview** — Real-time HTML rendering with hot reload
3. **Code Block Parameter Arrays** — Enhanced metadata support for AI tagging

---

## 1. AI Blueprints & The `.cntxt` File Format

### Concept

AI Blueprints are **machine-readable, AI-optimized representations** of documents. Unlike simple exports, these are specifically designed for:
- RAG (Retrieval-Augmented Generation) pipelines
- Direct LLM consumption
- Embedding generation
- Semantic chunking

### The `.cntxt` File Extension

**Decision:** Introduce a custom `.cntxt` (context) file extension.

| Aspect | Detail |
|--------|--------|
| **Extension** | `.cntxt` |
| **Meaning** | "Context" — AI-optimized context package |
| **Internal Format** | JSON (initially), YAML (later) |
| **Exclusivity** | Opens only in ContextPad |
| **Purpose** | Brand identity + signals AI optimization |

**Why `.cntxt`?**
> "A `.cntxt` file isn't just a document — it's pre-processed context ready for AI consumption, with semantic chunking, metadata tags, and optimized structure."

The custom extension represents the research and engineering effort put into making these files truly AI-optimized, not just simple exports.

### File Structure (Proposed)

```
CNTXT:json:1.0
{
  "meta": {
    "version": "1.0",
    "created": "2026-01-25T12:00:00Z",
    "source": "document.md",
    "app": "ContextPad"
  },
  "config": {
    "model": "gpt-4",
    "chunk_size": 512,
    "overlap": 50
  },
  "chunks": [
    {
      "id": "chunk-001",
      "type": "header",
      "level": 1,
      "content": "Introduction",
      "tokens": 45,
      "tags": ["overview", "intro"],
      "parent": null
    },
    {
      "id": "chunk-002",
      "type": "paragraph",
      "content": "This document describes...",
      "tokens": 128,
      "tags": ["description"],
      "parent": "chunk-001"
    }
  ]
}
```

### Format Detection

The first line identifies the internal format:
```
CNTXT:json:1.0   → JSON format, schema version 1.0
CNTXT:yaml:1.0   → YAML format, schema version 1.0
CNTXT:md:1.0     → Enhanced Markdown with frontmatter
```

### Research Areas for AI Optimization

| Area | Questions to Answer |
|------|---------------------|
| **Chunking** | Optimal chunk sizes for different embedding models (512 vs 1024 tokens)? |
| **Metadata** | What context helps LLMs? (source, date, author, semantic tags) |
| **Structure** | Hierarchical vs flat organization? Parent-child relationships? |
| **Formatting** | XML tags vs JSON vs Markdown for prompt injection? |
| **Token Efficiency** | When to strip vs preserve whitespace/formatting? |
| **Semantic Boundaries** | Split on headers vs paragraphs vs sentences? |

---

## 2. Export Format Decision

### Decision: JSON First, YAML Later

| Phase | Format | Rationale |
|-------|--------|-----------|
| **Phase 1** | JSON | Simple, universal, JS-native, no extra dependencies |
| **Phase 2** | YAML | Human-readable, LLM-friendly, industry standard for AI configs |

### Metadata Flow

**Decision:** Parse code block params → Convert to structured metadata on export

```
┌─────────────────────────────────────┐
│ Editor (Markdown)                   │
│                                     │
│ ```python {tags="rag,core", lock}   │
│ def process():                      │
│     pass                            │
│ ```                                 │
└─────────────────────────────────────┘
                 │
                 ▼ Export
┌─────────────────────────────────────┐
│ .cntxt File                         │
│                                     │
│ {                                   │
│   "chunks": [{                      │
│     "type": "code",                 │
│     "language": "python",           │
│     "tags": ["rag", "core"],        │
│     "locked": true,                 │
│     "content": "def process()..."   │
│   }]                                │
│ }                                   │
└─────────────────────────────────────┘
```

---

## 3. Code Block Parameter Arrays

### Decision: Implement Proper Array Support

**Rejected Alternative:** Comma-separated strings (`tags="rag,core"`)

**Reason:** Limited expressiveness, can't handle complex nested metadata needed for AI tagging.

### Proposed Syntax

```markdown
```python {tags=["rag", "core"], model="gpt-4", exclude=["comments"]}
# code here
```
```

### Implementation Scope

| Change | File | Description |
|--------|------|-------------|
| Type definition | `codeBlockParams.ts` | Add array type support |
| Parser update | `codeBlockParams.ts` | Parse `[...]` syntax |
| KNOWN_PARAMS | `codeBlockParams.ts` | Add `tags`, `model`, etc. |

---

## 4. HTML Live Preview

### Decision: Browser + Local Server Architecture

**Confirmed Approach:** Offload rendering to user's default browser with internet dependencies.

```
┌─────────────────┐         WebSocket          ┌─────────────────────┐
│   ContextPad    │ ◄─────────────────────────▶│  Default Browser    │
│                 │        (hot reload)        │                     │
│  ┌───────────┐  │                            │  localhost:PORT     │
│  │  Editor   │  │                            │  ┌───────────────┐  │
│  │ (Markdown)│  │ ──── HTTP GET ────────────▶│  │ Live Preview  │  │
│  └───────────┘  │                            │  │ - Full CSS    │  │
│                 │                            │  │ - CDN libs    │  │
│  ┌───────────┐  │                            │  │ - Tailwind    │  │
│  │ Rust HTTP │  │                            │  │ - Bootstrap   │  │
│  │  Server   │  │                            │  └───────────────┘  │
│  └───────────┘  │                            │                     │
└─────────────────┘                            └─────────────────────┘
```

### Why This Architecture?

| Benefit | Explanation |
|---------|-------------|
| **Full CSS Support** | Browser handles all rendering complexity |
| **CDN Dependencies** | Tailwind, Bootstrap, Google Fonts just work |
| **Security** | Sandboxed, no access to app internals |
| **Hot Reload** | WebSocket push on editor change |
| **No Webview Limits** | Full browser engine, not limited webview |

### Implementation Requirements

| Component | Technology | Purpose |
|-----------|------------|---------|
| HTTP Server | Rust (`axum` or `tiny_http`) | Serve compiled HTML |
| WebSocket | Rust (`tokio-tungstenite`) | Push live updates |
| MD → HTML | Rust (`pulldown-cmark`) or JS | Convert Markdown |
| Browser Launch | Tauri `shell` API | Open default browser |

---

## 5. Implementation Priority

### Confirmed Order

```
1. [ENABLER]  Code Block Array Params
              └── Prerequisite for AI tagging

2. [CORE]     AI Blueprint Export (JSON)
              └── Core differentiating feature

3. [UTILITY]  Token Saver Export
              └── Quick win, low complexity

4. [COMPLEX]  HTML Live Preview
              └── High value but requires Rust HTTP server

5. [DEFER]    Attention Mechanism
              └── Niche feature, evaluate later
```

### Complexity Assessment

| Feature | Complexity | Files Affected |
|---------|------------|----------------|
| Array Params | Low | 1 file (`codeBlockParams.ts`) |
| Blueprint Export | Medium | 2-3 files (new exporter + UI) |
| Token Saver | Low | 1 file (utility function) |
| HTML Preview | High | 3+ files (Rust server + hooks + UI) |

---

## 6. File Association Updates

### Add `.cntxt` to Tauri Config

**File:** `src-tauri/tauri.conf.json`

```json
{
  "bundle": {
    "fileAssociations": [
      {
        "ext": ["cntxt"],
        "name": "ContextPad AI Blueprint",
        "description": "AI-optimized context package",
        "role": "Editor",
        "mimeType": "application/x-cntxt"
      }
      // ... existing associations
    ]
  }
}
```

---

## 7. Open Questions for Further Research

### AI Blueprints
- [ ] What embedding models to optimize for? (OpenAI ada-002, Cohere, local models?)
- [ ] Should chunks include pre-computed embeddings or just text?
- [ ] How to handle code blocks differently from prose?
- [ ] What metadata do RAG systems actually use?

### HTML Preview
- [ ] Which Rust HTTP framework is lightest? (`axum` vs `tiny_http` vs `actix-web`)
- [ ] How to handle WebSocket reconnection gracefully?
- [ ] Should preview support custom CSS injection?
- [ ] Debounce interval for hot reload? (100ms? 300ms?)

### .cntxt Format
- [ ] Should the format be versioned for backwards compatibility?
- [ ] Include source document hash for change detection?
- [ ] Support incremental updates or always full export?

---

## 8. Summary Table

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Export format | JSON first | Simple, no dependencies |
| Metadata location | Code block params → structured export | Best of both worlds |
| Array params | Implement properly | Future-proof, no limitations |
| HTML preview | Browser + local server | Full rendering, CDN support |
| Custom extension | `.cntxt` | Brand identity, AI optimization signal |
| Priority | Arrays → Blueprint → Preview | Logical dependency chain |

---

## 9. Next Steps

1. **Research Phase** (Current)
   - Investigate AI/RAG best practices for context formatting
   - Evaluate Rust HTTP server options
   - Design `.cntxt` schema specification

2. **Implementation Phase** (Upcoming)
   - Refactor `codeBlockParams.ts` for array support
   - Build Blueprint export pipeline
   - Prototype HTML preview server

3. **Validation Phase**
   - Test `.cntxt` files with actual LLM/RAG systems
   - Measure token efficiency improvements
   - User feedback on HTML preview UX

---

**Document Created:** January 25, 2026
**Author:** Planning Session with AI Assistant
**Status:** Research & Planning — Development Paused

*"ContextPad: For planning before coding."*
