/**
 * GitHub Flavored Markdown (GFM) Styles for Live Preview
 */
export const GFM_STYLES = `
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 { font-size: 2em; border-bottom: 1px solid var(--border); padding-bottom: .3em; }
.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid var(--border); padding-bottom: .3em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1em; }
.markdown-body h5 { font-size: 0.875em; }
.markdown-body h6 { font-size: 0.85em; color: var(--text-secondary); }

.markdown-body p { margin-top: 0; margin-bottom: 16px; }

.markdown-body blockquote {
  padding: 0 1em;
  color: var(--text-secondary);
  border-left: .25em solid var(--border);
  margin: 0 0 16px 0;
}

.markdown-body ul, .markdown-body ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body code {
  padding: .2em .4em;
  margin: 0;
  font-size: 85%;
  white-space: break-spaces;
  background-color: var(--code-bg);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: 16px;
}

.markdown-body pre code {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
}

.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  margin-top: 0;
  margin-bottom: 16px;
  width: 100%;
}

.markdown-body table th, .markdown-body table td {
  padding: 6px 13px;
  border: 1px solid var(--border);
}

.markdown-body table tr {
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border);
}

.markdown-body table tr:nth-child(2n) {
  background-color: var(--bg-secondary);
}

.markdown-body img {
  max-width: 100%;
  box-sizing: content-box;
}

.markdown-body hr {
  height: .25em;
  padding: 0;
  margin: 24px 0;
  background-color: var(--border);
  border: 0;
}

/* Action Button Styles */
.cm-action-button {
  background: rgba(0, 122, 204, 0.15);
  color: #4cc9f0;
  border: 1px solid rgba(0, 122, 204, 0.3);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
  font-weight: 500;
  vertical-align: middle;
}

.cm-action-button::before {
  content: '⚡';
  font-size: 9px;
  opacity: 0.8;
}

.cm-action-button:hover {
  background: rgba(0, 122, 204, 0.25);
  border-color: #4cc9f0;
  color: #ffffff;
}
`;
