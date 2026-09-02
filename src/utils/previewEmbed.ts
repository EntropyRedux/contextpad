/**
 * Standalone runner for exported HTML documents. Exported files must be
 * self-contained (they are opened from disk, not served by the preview
 * server), so this script is inlined instead of referencing /preview.js.
 * It contains only client-side interactivity (TOC toggle + scroll spy) and
 * never contacts the preview WebSocket.
 */
export const STANDALONE_PREVIEW_SCRIPT = `
(function () {
  'use strict';
  function initPreview() {
    var toggleBtn = document.getElementById('toc-toggle');
    var layout = document.getElementById('layout');
    if (toggleBtn && layout) {
      toggleBtn.onclick = function () {
        layout.classList.toggle('sidebar-expanded');
      };
    }
    var observer = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var id = entries[i].target.getAttribute('id');
        if (entries[i].isIntersecting && id) {
          var links = document.querySelectorAll('.toc-sidebar a');
          for (var j = 0; j < links.length; j++) {
            links[j].classList.toggle('active', links[j].getAttribute('href') === '#' + id);
          }
        }
      }
    }, { rootMargin: '-20% 0px -80% 0px' });
    var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (var k = 0; k < headings.length; k++) {
      if (headings[k].id) observer.observe(headings[k]);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreview);
  } else {
    initPreview();
  }
})();
`