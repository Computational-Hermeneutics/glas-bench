/*
 * highlights.js - Phase 2, the highlight layer over the Pair reader's PDF text layer.
 *
 * Select text in either column to highlight it, in a colour and with tags and a note. A
 * highlight is anchored by a W3C TextQuoteSelector (exact, with a little text either side as
 * prefix and suffix) and the page number as a fallback, so it survives a page being rendered
 * again and follows its document from one column to the other. Highlights are the reader's own
 * and are kept in this browser under the bench's store (glasbench.highlights); nothing is sent
 * anywhere. The judas links that join two highlights across the gutter are built on top of this
 * (links.js, the next step).
 *
 * A highlight is drawn as a set of rectangles on an overlay below the text layer, so the text
 * stays selectable through it. Clicking a highlight opens its editor; selecting fresh text
 * raises a small colour bar to make one.
 *
 * Bench-only code for now. The quote-selector anchoring is a kit-first candidate (PLAN.md).
 */
(function (root) {
  'use strict';
  var SW = root.SW, el = SW.el, esc = SW.esc;

  // the reader's palette: a key kept with each highlight, drawn as the rgba below
  var COLOURS = [
    { key: 'gold',  paint: 'rgba(201, 162, 39, 0.33)',  label: 'Gold' },
    { key: 'rose',  paint: 'rgba(229, 139, 224, 0.30)', label: 'Rose' },
    { key: 'green', paint: 'rgba(87, 192, 138, 0.30)',  label: 'Green' },
    { key: 'blue',  paint: 'rgba(77, 146, 224, 0.30)',  label: 'Blue' },
    { key: 'red',   paint: 'rgba(226, 81, 65, 0.30)',   label: 'Red' }
  ];
  function paintOf(key) { var c = COLOURS.filter(function (x) { return x.key === key; })[0]; return (c || COLOURS[0]).paint; }

  function uid() { return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function by() { return SW.me().initials || ''; }

  // ---- store (per document, so highlights follow a document between the columns) ----
  var KEY = 'highlights';
  function all() { return SW.store.get(KEY, []); }
  function saveAll(a) { SW.store.set(KEY, a); SW.emit('highlights:changed', a); }
  function forDoc(docId) { return all().filter(function (h) { return h.doc === docId; }); }
  function get(id) { return all().filter(function (h) { return h.id === id; })[0] || null; }

  // ---- the page text, and offsets within it ----
  // The text layer holds only the PDF's text, each run in an absolutely-positioned span and no
  // whitespace text nodes between them, so a range's toString() over the layer is a stable string
  // to anchor against: the same at capture and when the page is drawn again.
  function layerOf(pageEl) { return pageEl.querySelector('.textLayer'); }
  function pageText(tl) { var r = document.createRange(); r.selectNodeContents(tl); return r.toString(); }
  function preLen(tl, node, offset) {
    var r = document.createRange();
    r.setStart(tl, 0);
    try { r.setEnd(node, offset); } catch (e) { return 0; }
    return r.toString().length;
  }
  // a [start, end] span of the page text back to a DOM range, for painting
  function rangeOf(tl, start, end) {
    var w = document.createTreeWalker(tl, NodeFilter.SHOW_TEXT, null), n, acc = 0, r = document.createRange(), set = false, last = null, lastEnd = 0;
    while ((n = w.nextNode())) {
      var next = acc + n.nodeValue.length;
      if (!set && start <= next) { r.setStart(n, Math.max(0, start - acc)); set = true; }
      if (set && end <= next) { r.setEnd(n, Math.max(0, end - acc)); return r; }
      acc = next; last = n; lastEnd = n.nodeValue.length;
    }
    if (set && last) { r.setEnd(last, lastEnd); return r; }
    return null;
  }

  var PAD = 36;   // how much text to keep either side as prefix/suffix
  function selectorFrom(tl, range) {
    var text = pageText(tl);
    var s = preLen(tl, range.startContainer, range.startOffset);
    var e = preLen(tl, range.endContainer, range.endOffset);
    if (e < s) { var t = s; s = e; e = t; }
    if (e <= s) return null;
    return {
      exact: text.slice(s, e),
      prefix: text.slice(Math.max(0, s - PAD), s),
      suffix: text.slice(e, e + PAD)
    };
  }
  // find the stored quote in the page text, best match by the text either side
  function locate(tl, sel) {
    var text = pageText(tl), hits = [], i = -1;
    if (!sel || !sel.exact) return null;
    while ((i = text.indexOf(sel.exact, i + 1)) >= 0) hits.push(i);
    if (!hits.length) return null;
    if (hits.length === 1) return { start: hits[0], end: hits[0] + sel.exact.length };
    var best = hits[0], score = -1;
    hits.forEach(function (h) {
      var pre = text.slice(Math.max(0, h - PAD), h), suf = text.slice(h + sel.exact.length, h + sel.exact.length + PAD);
      var sc = common(pre, sel.prefix || '', true) + common(suf, sel.suffix || '', false);
      if (sc > score) { score = sc; best = h; }
    });
    return { start: best, end: best + sel.exact.length };
  }
  function common(a, b, fromEnd) {
    var n = Math.min(a.length, b.length), c = 0;
    for (var i = 0; i < n; i++) { var x = fromEnd ? a[a.length - 1 - i] : a[i], y = fromEnd ? b[b.length - 1 - i] : b[i]; if (x === y) c++; else break; }
    return c;
  }

  // ---- painting ----
  function overlay(pageEl) {
    var o = pageEl.querySelector('.hl-layer');
    if (!o) { o = el('div', { class: 'hl-layer', 'aria-hidden': 'true' }); pageEl.insertBefore(o, layerOf(pageEl)); }
    return o;
  }
  function paintPage(side, docId, pageEl, n) {
    var tl = layerOf(pageEl); if (!tl) return;
    var o = overlay(pageEl); o.innerHTML = '';
    var pageRect = pageEl.getBoundingClientRect();
    forDoc(docId).filter(function (h) { return !h.page || h.page === n; }).forEach(function (h) {
      var loc = locate(tl, h.selector);
      if (!loc) return;
      var r = rangeOf(tl, loc.start, loc.end); if (!r) return;
      var rects = r.getClientRects();
      for (var i = 0; i < rects.length; i++) {
        var rc = rects[i]; if (rc.width < 1 || rc.height < 1) continue;
        var m = el('div', { class: 'hl-rect', 'data-id': h.id });
        m.style.left = (rc.left - pageRect.left) + 'px';
        m.style.top = (rc.top - pageRect.top) + 'px';
        m.style.width = rc.width + 'px';
        m.style.height = rc.height + 'px';
        m.style.background = paintOf(h.colour);
        o.append(m);
      }
    });
  }
  // repaint every currently rendered page of a document in whichever column shows it
  function repaintDoc(docId) {
    var COL = SW.pair && SW.pair.col; if (!COL) return;
    ['left', 'right'].forEach(function (side) {
      var c = COL[side]; if (!c || c.docId !== docId) return;
      c.pages.querySelectorAll('.pdf-page').forEach(function (pg) {
        if (layerOf(pg)) paintPage(side, docId, pg, +pg.dataset.n);
      });
    });
  }

  // ---- the colour bar raised on a fresh selection ----
  var bar = null;
  function hideBar() { if (bar) { bar.remove(); bar = null; } }
  function showBar(x, y, make) {
    hideBar();
    bar = el('div', { class: 'hl-bar' });
    COLOURS.forEach(function (c) {
      var b = el('button', { class: 'hl-swatch', title: c.label, style: 'background:' + c.paint.replace(/[\d.]+\)$/, '0.85)') });
      b.onmousedown = function (ev) { ev.preventDefault(); };
      b.onclick = function () { make(c.key); };
      bar.append(b);
    });
    document.body.append(bar);
    place(bar, x, y);
  }
  function place(node, x, y) {
    var r = node.getBoundingClientRect();
    var left = Math.max(6, Math.min(x, window.innerWidth - r.width - 6));
    var top = Math.max(6, Math.min(y, window.innerHeight - r.height - 6));
    node.style.left = left + 'px';
    node.style.top = top + 'px';
  }

  function sideOf(node) {
    var col = node && node.closest ? node.closest('.pair-col') : null;
    return col ? col.getAttribute('data-side') : null;
  }
  function colObj(side) { return SW.pair && SW.pair.col ? SW.pair.col[side] : null; }

  document.addEventListener('mouseup', function (ev) {
    if (ev.target && ev.target.closest && (ev.target.closest('.hl-bar') || ev.target.closest('.hl-pop'))) return;
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) { hideBar(); return; }
    var range = sel.getRangeAt(0);
    var tl = range.startContainer.parentNode && range.startContainer.parentNode.closest ? range.startContainer.parentNode.closest('.textLayer') : null;
    if (!tl || !tl.contains(range.endContainer)) { hideBar(); return; }
    var side = sideOf(tl); var c = side && colObj(side); if (!c || !c.docId) { hideBar(); return; }
    var pageEl = tl.closest('.pdf-page'); var n = pageEl ? +pageEl.dataset.n : 0;
    var selector = selectorFrom(tl, range);
    if (!selector) { hideBar(); return; }
    var display = sel.toString().replace(/\s+/g, ' ').trim();
    showBar(ev.clientX + 4, ev.clientY + 10, function (colour) {
      var h = { id: uid(), doc: c.docId, selector: selector, page: n, colour: colour, tags: [], note: '', by: by(), created: new Date().toISOString() };
      var a = all(); a.push(h); saveAll(a);
      window.getSelection().removeAllRanges();
      hideBar();
      repaintDoc(c.docId);
      openEditor(h.id, ev.clientX, ev.clientY);
    });
  });

  // ---- open a highlight by clicking it (the rects do not take the pointer, so hit-test) ----
  document.addEventListener('click', function (ev) {
    if (ev.target.closest && (ev.target.closest('.hl-bar') || ev.target.closest('.hl-pop'))) return;
    var pageEl = ev.target.closest && ev.target.closest('.pdf-page'); if (!pageEl) { return; }
    if (!window.getSelection().isCollapsed) return;   // a drag, not a click
    var hit = null;
    pageEl.querySelectorAll('.hl-rect').forEach(function (m) {
      var r = m.getBoundingClientRect();
      if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) hit = m.dataset.id;
    });
    if (hit) { ev.stopPropagation(); openEditor(hit, ev.clientX, ev.clientY); }
  });

  // ---- the editor popover: colour, tags, a note, delete ----
  var pop = null;
  function closeEditor() { if (pop) { pop.remove(); pop = null; } }
  function openEditor(id, x, y) {
    closeEditor();
    var h = get(id); if (!h) return;
    pop = el('div', { class: 'hl-pop' });
    var sw = COLOURS.map(function (c) {
      return '<button class="hl-swatch' + (c.key === h.colour ? ' on' : '') + '" data-colour="' + c.key + '" title="' + c.label + '" style="background:' + c.paint.replace(/[\d.]+\)$/, '0.85)') + '"></button>';
    }).join('');
    pop.innerHTML =
      '<div class="hl-quote">' + esc((h.selector.exact || '').replace(/\s+/g, ' ').trim().slice(0, 200)) + '</div>' +
      '<div class="hl-swatches">' + sw + '</div>' +
      '<input class="hl-tags" type="text" placeholder="' + esc(SW.BENCH.tagsHint || 'tags, comma separated') + '" value="' + esc((h.tags || []).join(', ')) + '">' +
      '<textarea class="hl-note" rows="2" placeholder="A note on this passage…">' + esc(h.note || '') + '</textarea>' +
      '<div class="hl-acts"><button class="btn ghost" data-act="delete">Delete</button>' +
      '<span class="hl-by hint">' + esc(h.by || '') + '</span>' +
      '<button class="btn" data-act="done">Done</button></div>';
    document.body.append(pop);
    place(pop, Math.min(x, window.innerWidth - 300), y + 8);

    pop.querySelectorAll('[data-colour]').forEach(function (b) {
      b.onclick = function () {
        h.colour = b.dataset.colour; save(h);
        pop.querySelectorAll('[data-colour]').forEach(function (o) { o.classList.toggle('on', o === b); });
        repaintDoc(h.doc);
      };
    });
    function commit() {
      h.tags = pop.querySelector('.hl-tags').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      h.note = pop.querySelector('.hl-note').value;
      save(h);
    }
    pop.querySelector('[data-act="done"]').onclick = function () { commit(); closeEditor(); };
    pop.querySelector('[data-act="delete"]').onclick = function () {
      commit();
      saveAll(all().filter(function (x) { return x.id !== id; }));
      closeEditor();
      repaintDoc(h.doc);
      SW.toast('Highlight removed');
    };
    pop.querySelector('.hl-tags').onchange = commit;
    pop.querySelector('.hl-note').onchange = commit;
  }
  function save(h) {
    var a = all(), i = a.map(function (x) { return x.id; }).indexOf(h.id);
    if (i >= 0) a[i] = h; else a.push(h);
    saveAll(a);
  }

  // close the popover or bar on an outside click or Escape
  document.addEventListener('mousedown', function (ev) {
    if (pop && !ev.target.closest('.hl-pop') && !ev.target.closest('.hl-rect')) closeEditor();
    if (bar && !ev.target.closest('.hl-bar')) hideBar();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { closeEditor(); hideBar(); } });

  // ---- hooks from the Pair reader ----
  SW.on('pair:page', function (d) { if (d && d.pageEl) paintPage(d.side, d.docId, d.pageEl, d.n); });
  SW.on('pair:open', function () { closeEditor(); hideBar(); });

  SW.highlights = {
    all: all, forDoc: forDoc, get: get, paintPage: paintPage, repaintDoc: repaintDoc,
    colours: COLOURS, paintOf: paintOf, openEditor: openEditor
  };
})(typeof window !== 'undefined' ? window : globalThis);
