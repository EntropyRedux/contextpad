import { ViewSettings } from '../store/tabStore'
import { slugify } from './markdownRenderer'
import { GFM_STYLES } from './gfmStyles'

export function generateTOC(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let toc = '<ul class="toc-root">';
  let stack = [0];
  let headingCount = 0;

  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headingCount++;
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);
      const currentLevel = stack[stack.length - 1];

      if (level > currentLevel) {
        toc += '<ul>';
        stack.push(level);
      } else if (level < currentLevel) {
        while (stack.length > 1 && stack[stack.length - 1] > level) {
          toc += '</ul>';
          stack.pop();
        }
        if (stack[stack.length - 1] !== level) {
           toc += '<ul>';
           stack.push(level);
        }
      }
      toc += `<li><a href="#${id}">${text}</a></li>`;
    }
  });

  if (headingCount === 0) return '';

  while (stack.length > 1) {
    toc += '</ul>';
    stack.pop();
  }
  toc += '</ul>';
  return toc;
}

export function generateHTML(
  content: string,
  title: string = 'ContextPad Document',
  settings?: Partial<ViewSettings>,
  tocHtml: string = '',
  resolvedTheme: 'light' | 'dark' = 'dark'
): string {
  const maxWidth = settings?.previewMaxWidth || '100%'
  const fontScale = settings?.previewFontScale || 1.0
  const contentMargin = settings?.previewContentMargin || '2rem'
  const showTOC = settings?.previewShowTOC && tocHtml.length > 0

  // Resolve theme tokens from the active CSS custom properties at generation time
  const cs = getComputedStyle(document.documentElement)
  const token = (name: string) => cs.getPropertyValue(name).trim()

  const themeVars = `
    --bg-primary: ${token('--bg-base') || '#1e1e1e'};
    --bg-secondary: ${token('--bg-raised') || '#252526'};
    --bg-tertiary: ${token('--bg-overlay') || '#2d2d30'};
    --border: ${token('--border-default') || '#3e3e42'};
    --text-primary: ${token('--text-primary') || '#cccccc'};
    --text-secondary: ${token('--text-secondary') || '#9d9d9d'};
    --text-link: ${token('--accent') || '#3794ff'};
    --heading-color: ${token('--accent') || '#e6edf3'};
    --code-bg: ${token('--bg-overlay') || '#2d2d2d'};
    --code-fg: #ce9178;
    --scrollbar-track: ${token('--bg-base') || '#1e1e1e'};
    --scrollbar-thumb: ${token('--scrollbar-thumb') || '#424242'};
    --sidebar-width: 280px;
  `

  const libraryLoaderScript = `
    <script>
      window.PreviewLibs = {
        hljs: false,
        mathjax: false,
        mermaid: false,
        tailwind: false,
        loaded: [],
        errors: [],

        highlight: function() {
          if (this.hljs && window.hljs) {
            try {
              document.querySelectorAll('pre code:not(.hljs)').forEach(block => {
                hljs.highlightElement(block);
              });
            } catch (e) { console.warn('Hljs error:', e); }
          }
        },

        renderMermaid: async function(retries = 2) {
          if (this.mermaid && window.mermaid) {
            try {
              document.querySelectorAll('.mermaid[data-processed="true"]').forEach(el => {
                if (el.querySelector('svg') === null || el.innerHTML.includes('Syntax error')) {
                  el.removeAttribute('data-processed');
                }
              });
              const diagrams = document.querySelectorAll('.mermaid:not([data-processed="true"])');
              if (diagrams.length > 0) {
                await window.mermaid.run({ nodes: Array.from(diagrams), suppressErrors: true });
              }
            } catch (e) {
              console.warn('Mermaid error:', e);
              if (retries > 0) setTimeout(() => this.renderMermaid(retries - 1), 100);
            }
          }
        },

        renderAll: async function(contentElement) {
          this.highlight();
          if (this.mathjax && window.MathJax && window.MathJax.typesetPromise) {
            try { await window.MathJax.typesetPromise(contentElement ? [contentElement] : undefined); }
            catch (e) { console.warn('MathJax error:', e); }
          }
          await this.renderMermaid();
        }
      };
    </script>
  `

  const fallbackStyles = `
    <style id="contextpad-theme">
      :root { ${themeVars} }
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: var(--scrollbar-track); }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 5px; }
      * { box-sizing: border-box; }
      body {
        background-color: var(--bg-primary);
        color: var(--text-primary);
        margin: 0; padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: calc(16px * ${fontScale});
        line-height: 1.6;
        overflow-x: hidden;
      }
      .layout-container {
        display: grid;
        grid-template-columns: 0 minmax(0, 1fr);
        gap: 0;
        max-width: ${maxWidth};
        margin: 0 auto;
        padding: 2rem;
        transition: all 0.3s ease;
      }
      .layout-container.sidebar-expanded {
        grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
        gap: 2rem;
      }
      .toc-wrapper {
        position: sticky; top: 2rem;
        height: calc(100vh - 4rem);
        overflow: hidden; transition: opacity 0.2s, width 0.3s;
        opacity: 0; pointer-events: none; width: 0;
      }
      .layout-container.sidebar-expanded .toc-wrapper { opacity: 1; pointer-events: auto; width: auto; }
      .toc-sidebar {
        height: 100%; overflow-y: auto; border-right: 1px solid var(--border);
        padding-right: 1rem; font-size: 0.9em; min-width: 250px;
      }
      .toc-sidebar ul { list-style: none; padding: 0; margin: 0; }
      .toc-sidebar ul ul { padding-left: 1.2em; border-left: 1px solid var(--border); margin: 0.25em 0; }
      .toc-sidebar li { margin-bottom: 0.25em; }
      .toc-sidebar a {
        color: var(--text-secondary); text-decoration: none; display: block;
        padding: 4px 8px; border-radius: 4px; transition: all 0.15s;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .toc-sidebar a:hover { color: var(--text-primary); background: var(--bg-secondary); }
      .toc-sidebar a.active { color: var(--text-link); background: var(--bg-tertiary); font-weight: 500; }

      #toc-toggle {
        position: fixed; top: 20px; left: 20px; width: 40px; height: 40px;
        background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 50%;
        color: var(--text-primary); display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      .markdown-body { padding-left: ${contentMargin}; padding-right: ${contentMargin}; }
      
      ${GFM_STYLES}

      #layout { max-width: ${maxWidth}; }
      #lib-status {
        position: fixed; bottom: 10px; right: 10px; font-size: 11px;
        color: var(--text-secondary); background: var(--bg-secondary);
        padding: 4px 8px; border-radius: 4px; opacity: 0.7; z-index: 1000;
      }
    </style>
    <style id="contextpad-custom-css">${settings?.previewCustomCSS || ''}</style>
  `

  const initScript = `
    <script>
      window.updatePreviewSettings = function(settings) {
         if (!settings) return;
         if (settings.previewFontScale) document.body.style.fontSize = (16 * settings.previewFontScale) + 'px';
         if (settings.previewMaxWidth) {
            const l = document.getElementById('layout');
            if (l) l.style.maxWidth = settings.previewMaxWidth;
         }
         if (settings.previewContentMargin) {
            const mb = document.querySelector('.markdown-body');
            if (mb) { mb.style.paddingLeft = settings.previewContentMargin; mb.style.paddingRight = settings.previewContentMargin; }
         }
         if (settings.previewCustomCSS !== undefined) {
            const c = document.getElementById('contextpad-custom-css');
            if (c) c.textContent = settings.previewCustomCSS;
         }
      };

      function initPreview() {
        const toggleBtn = document.getElementById('toc-toggle');
        const layout = document.getElementById('layout');
        if (toggleBtn && layout) {
          toggleBtn.onclick = () => {
            layout.classList.toggle('sidebar-expanded');
          };
        }
        
        // Simple scroll spy logic
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const id = entry.target.getAttribute('id');
            if (entry.isIntersecting && id) {
              document.querySelectorAll('.toc-sidebar a').forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === '#' + id);
              });
            }
          });
        }, { rootMargin: '-20% 0px -80% 0px' });

        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(section => {
          if (section.id) observer.observe(section);
        });
      }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPreview);
      else initPreview();
    </script>
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${libraryLoaderScript}
    <script src="https://cdn.tailwindcss.com" onload="window.PreviewLibs.tailwind = true;"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${resolvedTheme === 'light' ? 'github' : 'github-dark'}.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" onload="window.PreviewLibs.hljs = true;"></script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script" async onload="window.PreviewLibs.mathjax = true;"></script>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: false, theme: '${resolvedTheme === 'light' ? 'default' : 'dark'}' });
      window.mermaid = mermaid; window.PreviewLibs.mermaid = true;
      window.PreviewLibs.renderMermaid();
    </script>
    ${fallbackStyles}
</head>
<body>
    ${showTOC ? '<button id="toc-toggle">☰</button>' : ''}
    <div id="layout" class="layout-container">
        ${showTOC ? `<div class="toc-wrapper"><nav class="toc-sidebar">${tocHtml}</nav></div>` : ''}
        <div id="content" class="markdown-body">${content}</div>
    </div>
    <div id="lib-status">Ready</div>
    ${initScript}
</body>
</html>`;
}