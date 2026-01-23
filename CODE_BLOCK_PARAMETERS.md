# Unified Block Metadata System (Code Block Parameters)

**Status:** Planned  
**Philosophy:** Unified logic for flexibility and extensibility.

---

## 1. Concept
A single, standardized parser for fenced code block metadata. This system allows users to attach arbitrary attributes to code blocks, which can then be interpreted by various subsystems (Actions, HTML Renderer, AI Exporter).

This approach unifies:
1.  **Action Manager Ignore Flags**: Preventing specific blocks from being processed by automation.
2.  **HTML Rendering Options**: Controlling how blocks appear in documentation exports.
3.  **AI Blueprint Context**: Tagging blocks with semantic meaning for LLMs.

---

## 2. Proposed Syntax
We will adopt the **R Markdown / Pandoc** attribute style for its compactness and readability.

```markdown
```language {key=value, boolean_flag, "quoted key"="value"}
code here...
```
```

### Examples

**1. Ignoring a block in Action Manager automation:**
```python {ignore=true}
# This code will not be touched by "Run All" scripts
print("Safe")
```

**2. Configuring HTML Export rendering:**
```javascript {render="interactive", line_numbers=true}
// This block might become an interactive runner in the HTML output
console.log("Hello");
```

**3. AI Blueprint Context:**
```json {ai_role="system_prompt", context_window="high_priority"}
{
  "role": "You are a helpful assistant..."
}
```

---

## 3. Implementation Plan

### Phase 1: The Parser
*   **Goal**: Create a robust regex or AST-based parser that extracts the metadata string `{...}` from the opening fence.
*   **Output**: A structured object:
    ```json
    {
      "ignore": true,
      "render": "interactive",
      "ai_role": "system_prompt"
    }
    ```

### Phase 2: System Integration
*   **Action Manager**: Update `actionExecutor.ts` to check for `{ignore=true}` before processing a block.
*   **HTML Renderer**: Pass these parameters to the Markdown-to-HTML converter (e.g., adding CSS classes or data attributes).
*   **Editor UI**: Visual indicators (badges) in the editor to show active parameters without cluttering the view.

---

## 4. Why this matters?
This feature prevents "feature creep" by providing a **single extension point** for all future block-level features. Instead of building a "Locking System" and a separate "Rendering System", we build one "Parameter System" that handles both.
