/*
 * postits.js - comments as post-it notes on a page of either column.
 *
 * A post-it is the reader's own text on a small card laid over a page. It rests folded, as a small
 * tab showing its first words, just above the text it belongs to; a click opens it to read or
 * write. Insert, in a highlight's editor, makes one above that passage, with a strip in the
 * highlight's colour; ✎ in a column's head drops a free one on the page in view. A tab, or an open
 * card by its top edge, can be dragged to move it.
 *
 * An open post-it folds again when it is accepted (✓, Esc, or Cmd/Ctrl-Enter), when the reader
 * clicks elsewhere, or when its column is scrolled; accepting saves it and hands the keyboard back
 * to the column, so the document scrolls again. One accepted with nothing written is removed. Its
 * place is kept as a fraction of the page, so it holds through zoom and reload and follows its
 * document between the columns.
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
  function snippet(t) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > 22 ? t.slice(0, 21) + '…' : t; }

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

  // ---- one post-it: a tab when folded, a card when open ----
  function card(p, pageEl) {
    var c = el('div', { class: 'pit', 'data-id': p.id });
    c.style.left = (p.x * 100) + '%';
    c.style.top = (p.y * 100) + '%';
    var strip = stripOf(p);
    if (strip) c.style.setProperty('--pit-strip', strip);
    var h = p.hl && H() && H().get(p.hl);
    var quote = h ? (h.selector.exact || '').replace(/\s+/g, ' ').trim() : '';
    c.innerHTML =
      '<button class="pit-tab" title="Open this post-it (drag to move)"><span class="pit-tab-ic" aria-hidden="true">✎</span><span class="pit-tab-t"></span></button>' +
      '<div class="pit-card">' +
      '<div class="pit-head" title="Drag to move">' +
      '<span class="pit-by">' + esc(p.by || '') + (quote ? ' · on “' + esc(quote.slice(0, 28)) + (quote.length > 28 ? '…' : '') + '”' : '') + '</span>' +
      '<button class="pit-ok" title="Done (Esc or Cmd-Enter)" aria-label="Done">✓</button>' +
      '<button class="pit-x" title="Delete this post-it" aria-label="Delete">×</button></div>' +
      '<textarea class="pit-text" rows="3" placeholder="A comment…" aria-label="Comment">' + esc(p.text || '') + '</textarea></div>';
    var ta = c.querySelector('.pit-text'), tabT = c.querySelector('.pit-tab-t'), timer = null;
    function showTab() { tabT.textContent = snippet(ta.value) || 'note'; }
    showTab();
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 320) + 'px'; }
    function save() { var q = get(p.id); if (q && q.text !== ta.value) { q.text = ta.value; q.updated = new Date().toISOString(); put(q); } }
    ta.addEventListener('input', function () { grow(); clearTimeout(timer); timer = setTimeout(save, 300); });

    c.open = function (focus) {
      closeAll(c);
      c.classList.add('open'); c.openedAt = Date.now();
      grow();
      if (focus) ta.focus({ preventScroll: true });
    };
    // fold: save, drop it if empty, and (when accepted) hand the keyboard back to the column
    c.fold = function (giveBack) {
      if (!c.classList.contains('open')) return;
      clearTimeout(timer); save();
      c.classList.remove('open');
      if (!ta.value.trim()) { drop(p.id); c.remove(); }
      else showTab();
      if (giveBack) { var sc = pageEl.closest('.pair-scroll'); if (sc) sc.focus({ preventScroll: true }); }
    };
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' || (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey))) { ev.preventDefault(); ev.stopPropagation(); c.fold(true); }
    });
    c.querySelector('.pit-ok').onclick = function () { c.fold(true); };
    c.querySelector('.pit-x').onclick = function () {
      if (ta.value.trim() && !window.confirm('Delete this post-it?')) return;
      drop(p.id); c.remove(); SW.toast('Post-it removed');
      var sc = pageEl.closest('.pair-scroll'); if (sc) sc.focus({ preventScroll: true });
    };
    // the reader's clicks inside a post-it go no further (not to the highlight layer)
    ['mousedown', 'mouseup', 'click'].forEach(function (t) { c.addEventListener(t, function (ev) { ev.stopPropagation(); }); });

    // drag: a tab anywhere, an open card by its top edge; a tab clicked without moving opens
    function dragFrom(handle, onClick) {
      handle.addEventListener('pointerdown', function (ev) {
        if (ev.button !== 0 || ev.target.closest('.pit-x, .pit-ok')) return;
        ev.preventDefault();
        handle.setPointerCapture(ev.pointerId);
        var pr = pageEl.getBoundingClientRect(), cr = c.getBoundingClientRect();
        var dx = ev.clientX - cr.left, dy = ev.clientY - cr.top, x0 = ev.clientX, y0 = ev.clientY, moved = false;
        function mv(e) {
          if (!moved && Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) < 4) return;
          moved = true; c.classList.add('dragging');
          var nx = clamp01((e.clientX - dx - pr.left) / pr.width), ny = clamp01((e.clientY - dy - pr.top) / pr.height);
          c.style.left = (nx * 100) + '%'; c.style.top = (ny * 100) + '%';
          c.dataset.nx = nx; c.dataset.ny = ny;
        }
        function up() {
          handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up);
          c.classList.remove('dragging');
          if (!moved) { if (onClick) onClick(); return; }
          var q = get(p.id); if (q) { q.x = +c.dataset.nx; q.y = +c.dataset.ny; put(q); }
        }
        handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up);
      });
    }
    dragFrom(c.querySelector('.pit-tab'), function () { c.open(false); });
    dragFrom(c.querySelector('.pit-head'), null);
    return c;
  }

  function openCards(scope) { return [].slice.call((scope || document).querySelectorAll('.pit.open')); }
  function closeAll(except) { openCards().forEach(function (c) { if (c !== except) c.fold(false); }); }

  // a click anywhere outside an open post-it accepts and folds it
  document.addEventListener('mousedown', function (ev) {
    if (ev.target.closest && ev.target.closest('.pit')) return;
    closeAll(null);
  }, true);
  // moving the document folds the open post-its in that column (not the scroll an opening causes)
  document.addEventListener('scroll', function (ev) {
    var sc = ev.target; if (!sc || !sc.classList || !sc.classList.contains('pair-scroll')) return;
    openCards(sc).forEach(function (c) { if (Date.now() - (c.openedAt || 0) > 400) c.fold(false); });
  }, true);

  // ---- making one ----
  function make(docId, pageEl, x, y, hl) {
    var p = { id: uid(), doc: docId, page: +pageEl.dataset.n, x: clamp01(x), y: clamp01(y), text: '', hl: hl || null,
              by: SW.me().initials || '', created: new Date().toISOString() };
    put(p);
    paintPage(docId, pageEl, p.page);
    var c = pageEl.querySelector('.pit[data-id="' + p.id + '"]');
    if (c) c.open(true);
    return p;
  }
  // Insert, from a highlight's editor: the tab sits just above the start of that passage
  function addFor(hid) {
    var rects = [].slice.call(document.querySelectorAll('.pair-col .hl-rect[data-id="' + hid + '"]'));
    var h = H() && H().get(hid);
    if (!rects.length || !h) { SW.toast('Open the passage in a column first'); return; }
    if (H().closeEditor) H().closeEditor();
    var first = rects.slice().sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); })[0];
    var pageEl = first.closest('.pdf-page'), pr = pageEl.getBoundingClientRect(), fr = first.getBoundingClientRect();
    var tabH = 22;   // about a folded tab's height, in pixels
    make(h.doc, pageEl, (fr.left - pr.left) / pr.width, (fr.top - pr.top - tabH) / pr.height, hid);
  }
  // ✎ in a column's head: a free post-it on the page in view, near the top middle of the column
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

  // the ✎ button in each column's head, beside the zoom; and the column made focusable, so a
  // post-it can hand the keyboard back to it
  function ensureButtons() {
    var C = COL(); if (!C) return;
    ['left', 'right'].forEach(function (side) {
      var c = C[side]; if (!c || !c.head) return;
      if (c.scroll && !c.scroll.hasAttribute('tabindex')) c.scroll.setAttribute('tabindex', '-1');
      if (c.head.querySelector('.pit-add')) return;
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
