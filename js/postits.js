/*
 * postits.js - comments as post-it notes, floating on a page of either column.
 *
 * A post-it is the reader's own text on a small card laid over a page. Insert, in a highlight's
 * editor, puts one beside that passage, with a strip in the highlight's colour; ✎ in a column's
 * head drops a free one on the page in view. A post-it is dragged by its top edge, folded to its
 * top edge by a double-click there (so it need not hide the text), and removed with ×. Its place
 * is kept as a fraction of the page, so it stays put through zoom and reload, and it follows its
 * document from one column to the other.
 *
 * Post-its are kept in this browser under glasbench.postits; nothing is sent anywhere. Their text
 * is sized by the kit's code size (Settings, A− and A+; see textsize.js). Bench-only for now; a
 * hermes-kit module once settled.
 */
(function (root) {
  'use strict';
  var SW = root.SW, el = SW.el, esc = SW.esc;

  var KEY = 'postits';
  function all() { return SW.store.get(KEY, []); }
  function saveAll(a) { SW.store.set(KEY, a); }
  function get(id) { return all().filter(function (p) { return p.id === id; })[0] || null; }
  function put(p) { var a = all(), i = a.map(function (x) { return x.id; }).indexOf(p.id); if (i >= 0) a[i] = p; else a.push(p); saveAll(a); }
  function drop(id) { saveAll(all().filter(function (p) { return p.id !== id; })); }
  function uid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function H() { return SW.highlights; }
  function COL() { return SW.pair && SW.pair.col; }
  function clamp01(v) { return Math.max(0, Math.min(0.97, v)); }

  // ---- painting: each post-it on its page, in a layer above the text ----
  function layerOf(pageEl) {
    var o = pageEl.querySelector('.pit-layer');
    if (!o) { o = el('div', { class: 'pit-layer' }); pageEl.appendChild(o); }
    return o;
  }
  function paintPage(docId, pageEl, n) {
    var o = layerOf(pageEl); o.innerHTML = '';
    all().filter(function (p) { return p.doc === docId && p.page === n; }).forEach(function (p) { o.append(card(p, pageEl)); });
  }
  function repaintDoc(docId) {
    var C = COL(); if (!C) return;
    ['left', 'right'].forEach(function (s) {
      var c = C[s]; if (!c || c.docId !== docId) return;
      c.pages.querySelectorAll('.pdf-page').forEach(function (pg) { if (pg.querySelector('.textLayer')) paintPage(docId, pg, +pg.dataset.n); });
    });
  }
  function stripOf(p) {
    var h = p.hl && H() && H().get(p.hl);
    return h ? H().paintOf(h.colour).replace(/[\d.]+\)$/, '0.95)') : '';
  }
  function card(p, pageEl) {
    var c = el('div', { class: 'pit' + (p.folded ? ' folded' : ''), 'data-id': p.id });
    c.style.left = (p.x * 100) + '%';
    c.style.top = (p.y * 100) + '%';
    var strip = stripOf(p);
    if (strip) c.style.borderTopColor = strip;
    var quote = p.hl && H() && H().get(p.hl) ? (H().get(p.hl).selector.exact || '').replace(/\s+/g, ' ').trim() : '';
    c.innerHTML =
      '<div class="pit-head" title="Drag to move; double-click to fold">' +
      '<span class="pit-by">' + esc(p.by || '') + (quote ? ' · on “' + esc(quote.slice(0, 28)) + (quote.length > 28 ? '…' : '') + '”' : '') + '</span>' +
      '<button class="pit-x" title="Delete this post-it" aria-label="Delete">×</button></div>' +
      '<textarea class="pit-text" rows="3" placeholder="A comment…" aria-label="Comment">' + esc(p.text || '') + '</textarea>';
    var ta = c.querySelector('.pit-text'), timer = null;
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 320) + 'px'; }
    setTimeout(grow, 0);
    ta.addEventListener('input', function () {
      grow();
      clearTimeout(timer);
      timer = setTimeout(function () { var q = get(p.id); if (q) { q.text = ta.value; q.updated = new Date().toISOString(); put(q); } }, 300);
    });
    ta.addEventListener('blur', function () { var q = get(p.id); if (q && q.text !== ta.value) { q.text = ta.value; put(q); } });
    // keep the reader's clicks inside the card from reaching the highlight layer
    ['mousedown', 'mouseup', 'click'].forEach(function (t) { c.addEventListener(t, function (ev) { ev.stopPropagation(); }); });
    c.querySelector('.pit-x').onclick = function () {
      var q = get(p.id); if (q && q.text && !window.confirm('Delete this post-it?')) return;
      drop(p.id); c.remove(); SW.toast('Post-it removed');
    };
    var head = c.querySelector('.pit-head');
    head.addEventListener('dblclick', function (ev) {
      if (ev.target.closest('.pit-x')) return;
      var q = get(p.id); if (!q) return;
      q.folded = !q.folded; put(q); c.classList.toggle('folded', q.folded);
    });
    // drag by the top edge, within the page
    head.addEventListener('pointerdown', function (ev) {
      if (ev.button !== 0 || ev.target.closest('.pit-x')) return;
      ev.preventDefault();
      head.setPointerCapture(ev.pointerId);
      var pr = pageEl.getBoundingClientRect(), cr = c.getBoundingClientRect();
      var dx = ev.clientX - cr.left, dy = ev.clientY - cr.top, moved = false;
      c.classList.add('dragging');
      function mv(e) {
        moved = true;
        var nx = clamp01((e.clientX - dx - pr.left) / pr.width), ny = clamp01((e.clientY - dy - pr.top) / pr.height);
        c.style.left = (nx * 100) + '%'; c.style.top = (ny * 100) + '%';
        c.dataset.nx = nx; c.dataset.ny = ny;
      }
      function up() {
        head.removeEventListener('pointermove', mv); head.removeEventListener('pointerup', up);
        c.classList.remove('dragging');
        if (!moved) return;
        var q = get(p.id); if (q) { q.x = +c.dataset.nx; q.y = +c.dataset.ny; put(q); }
      }
      head.addEventListener('pointermove', mv); head.addEventListener('pointerup', up);
    });
    return c;
  }

  // ---- making one ----
  function make(docId, pageEl, x, y, hl) {
    var p = { id: uid(), doc: docId, page: +pageEl.dataset.n, x: clamp01(x), y: clamp01(y), text: '', hl: hl || null,
              folded: false, by: SW.me().initials || '', created: new Date().toISOString() };
    put(p);
    paintPage(docId, pageEl, p.page);
    var ta = pageEl.querySelector('.pit[data-id="' + p.id + '"] .pit-text');
    if (ta) ta.focus();
    return p;
  }
  // Insert, from a highlight's editor: beside that passage, on the gutter side if there is room
  function addFor(hid) {
    var rects = [].slice.call(document.querySelectorAll('.pair-col .hl-rect[data-id="' + hid + '"]'));
    var h = H() && H().get(hid);
    if (!rects.length || !h) { SW.toast('Open the passage in a column first'); return; }
    if (H().closeEditor) H().closeEditor();
    var pageEl = rects[0].closest('.pdf-page'), pr = pageEl.getBoundingClientRect();
    var R = -1e9, T = 1e9, L = 1e9;
    rects.forEach(function (m) { var b = m.getBoundingClientRect(); R = Math.max(R, b.right); T = Math.min(T, b.top); L = Math.min(L, b.left); });
    var w = 200 / pr.width;   // about a card's width, as a fraction of the page
    var x = (R - pr.left) / pr.width + 0.01;
    if (x + w > 0.98) x = Math.max(0.01, (L - pr.left) / pr.width - w - 0.01);
    make(h.doc, pageEl, x, (T - pr.top) / pr.height, hid);
  }
  // ✎ in a column's head: a free post-it on the page in view, near the middle of the column
  function addFree(side) {
    var c = COL() && COL()[side]; if (!c || !c.docId) return;
    var sr = c.scroll.getBoundingClientRect(), cx = sr.left + sr.width / 2, cy = sr.top + Math.min(160, sr.height / 3);
    var pageEl = [].slice.call(c.pages.querySelectorAll('.pdf-page')).filter(function (pg) {
      var r = pg.getBoundingClientRect(); return r.top <= cy && r.bottom >= cy && pg.querySelector('.textLayer');
    })[0];
    if (!pageEl) { SW.toast('Wait for the page to open, then try again'); return; }
    var pr = pageEl.getBoundingClientRect();
    make(c.docId, pageEl, (cx - pr.left) / pr.width - 0.1, (cy - pr.top) / pr.height);
  }

  // the ✎ button in each column's head, beside the zoom
  function ensureButtons() {
    var C = COL(); if (!C) return;
    ['left', 'right'].forEach(function (side) {
      var c = C[side]; if (!c || !c.head || c.head.querySelector('.pit-add')) return;
      var b = el('button', { class: 'icon-btn pit-add', title: 'Drop a post-it comment on this page' }, '✎');
      b.onclick = function () { addFree(side); };
      var z = c.head.querySelector('.pair-zoom');
      c.head.insertBefore(b, z || null);
    });
  }

  SW.on('pair:page', function (d) { if (d && d.pageEl) paintPage(d.docId, d.pageEl, d.n); });
  SW.on('pair:open', ensureButtons);
  // a highlight recoloured or removed: its post-its' strips follow (a removed one's post-its stay, free)
  SW.on('highlights:changed', function () { var C = COL(); if (C) ['left', 'right'].forEach(function (s) { if (C[s] && C[s].docId) repaintDoc(C[s].docId); }); });

  SW.postits = { all: all, addFor: addFor, addFree: addFree, repaintDoc: repaintDoc };
})(typeof window !== 'undefined' ? window : globalThis);
