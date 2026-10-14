/*
 * textsize.js - the kit's code size, given a meaning in Glas. Glas shows no code listings, so the
 * size set in Settings (and by A− and A+ in the top bar) becomes the size of the bench's own text
 * laid over the documents: post-its, the highlight and judas editors, the list of links
 * elsewhere (css/research.css, var(--code-size)). The documents themselves are enlarged with
 * each column's − and +.
 *
 * The Settings dialog's wording is the kit's, written for code; this relabels it when the dialog
 * is opened and hides the controls that only apply to listings. Bench-only; the wording moves
 * into hermes-kit when the kit is drawn out of Glas.
 */
(function (root) {
  'use strict';
  function labelOf(id) { var i = document.getElementById(id); return i ? i.closest('label') : null; }
  function patch() {
    var size = document.getElementById('set-size');
    if (!size || size.dataset.glas) return;
    size.dataset.glas = '1';
    var h = [].slice.call(document.querySelectorAll('h2')).filter(function (x) { return x.textContent.trim() === 'Reading code'; })[0];
    if (h) {
      h.textContent = 'Text over the documents';
      var p = h.nextElementSibling;
      if (p && p.classList.contains('hint')) p.textContent = 'The size of the bench’s own text laid over the documents: post-its, the highlight and judas editors, the list of links elsewhere. The A− and A+ buttons in the top bar change it too. To enlarge a document, use its column’s − and +.';
    }
    ['set-font', 'set-noteshade'].forEach(function (id) { var l = labelOf(id); if (l) l.style.display = 'none'; });
    var sl = labelOf('set-size');
    if (sl && sl.firstChild && sl.firstChild.nodeType === 3) sl.firstChild.nodeValue = 'Text size ';
  }
  new MutationObserver(patch).observe(document.documentElement, { childList: true, subtree: true });
})(typeof window !== 'undefined' ? window : globalThis);
