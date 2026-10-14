/*
 * links.js - Phase 2, the judas: links across the gutter, built on the highlight layer.
 *
 * A judas joins a highlighted passage in one column to a highlighted passage in the other, with
 * a note. Derrida's word for the link is the judas, the spy-hole in a door through which one text
 * watches the other. A link is drawn as a curve across the gutter from one passage to the other,
 * kept aligned as the columns are scrolled and zoomed; clicking the curve opens the link's note.
 * Links whose other end is a document not currently shown are listed above the columns, each a
 * click away from being swapped into view.
 *
 * A link references two highlights by id (highlights.js), so it keeps its hold whichever column
 * each document is read in, and can join passages across sessions as well as across a pair. Links
 * are the reader's own and kept in this browser under glasbench.links; nothing is sent anywhere.
 *
 * The insert variant (a passage from one column shown inside the other at a point) is noted in
 * PLAN.md and comes next. Bench-only code; a kit-first candidate once settled.
 */
(function (root) {
  'use strict';
  var SW = root.SW, el = SW.el, esc = SW.esc, NS = 'http://www.w3.org/2000/svg';

  function H() { return SW.highlights; }
  function uid() { return 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function by() { return SW.me().initials || ''; }

  var KEY = 'links';
  function all() { return SW.store.get(KEY, []); }
  function saveAll(a) { SW.store.set(KEY, a); SW.emit('links:changed', a); }
  function get(id) { return all().filter(function (l) { return l.id === id; })[0] || null; }
  function quoteOf(hid) { var h = H() && H().get(hid); return h ? (h.selector.exact || '').replace(/\s+/g, ' ').trim() : ''; }
  function docOf(hid) { var h = H() && H().get(hid); return h ? h.doc : null; }
  // a highlight's colour as solid ink, for the curves, their end dots and the insert cards' edges
  function inkOf(hid) { var h = H() && H().get(hid); return H().paintOf(h && h.colour).replace(/[\d.]+\)$/, '0.95)'); }
  // the two documents a link touches: for a join both highlights' docs; for an insert the source's doc and the target doc
  function linkDocs(l) { return [docOf(l.a), l.kind === 'insert' ? (l.insertAt && l.insertAt.doc) : docOf(l.b)]; }

  // ---- geometry: a highlight's painted rectangles, and its inner edge toward the gutter ----
  function rectsOf(id) { return [].slice.call(document.querySelectorAll('.pair-col .hl-rect[data-id="' + id + '"]')); }
  function sideOf(id) { var r = rectsOf(id)[0]; if (!r) return null; var c = r.closest('.pair-col'); return c ? c.getAttribute('data-side') : null; }
  function boxOf(id) {
    var rs = rectsOf(id); if (!rs.length) return null;
    var L = 1e9, T = 1e9, R = -1e9, B = -1e9;
    rs.forEach(function (m) { var b = m.getBoundingClientRect(); L = Math.min(L, b.left); T = Math.min(T, b.top); R = Math.max(R, b.right); B = Math.max(B, b.bottom); });
    return { left: L, top: T, right: R, bottom: B, cy: (T + B) / 2 };
  }

  // ---- making a join ----
  var pending = null;    // { id, side }
  function startJoin(id) {
    var side = sideOf(id);
    if (!side) { SW.toast('Open the passage in a column first'); return; }
    pending = { id: id, side: side };
    if (H()) H().closeEditor();
    document.body.classList.add('judas-linking');
    SW.toast('Now click a passage in the ' + (side === 'left' ? 'right' : 'left') + ' column to join them', 4500);
  }
  function cancelJoin() { pending = null; document.body.classList.remove('judas-linking'); }
  // highlights.js hands a clicked highlight here first; true means the click was consumed
  function claimClick(id, ev) {
    if (!pending) return false;
    if (id === pending.id) { cancelJoin(); SW.toast('Join cancelled'); return true; }
    var side = sideOf(id);
    if (side && side === pending.side) { SW.toast('Pick a passage in the other column'); return true; }
    var link = { id: uid(), a: pending.id, b: id, kind: 'join', note: '', by: by(), created: new Date().toISOString() };
    var a = all(); a.push(link); saveAll(a);
    cancelJoin();
    scheduleDraw();
    openLink(link.id, ev.clientX, ev.clientY);
    return true;
  }

  // ---- making an insert: a passage shown inside the other column at a chosen point ----
  var inserting = null;    // { sourceHid, targetSide, targetDoc }
  function startInsert(sourceHid) {
    var side = sideOf(sourceHid);
    if (!side) { SW.toast('Open the passage in a column first'); return; }
    var target = side === 'left' ? 'right' : 'left';
    var COL = SW.pair && SW.pair.col;
    var targetDoc = COL && COL[target] && COL[target].docId;
    if (!targetDoc) { SW.toast('Open a document in the other column first'); return; }
    inserting = { sourceHid: sourceHid, targetSide: target, targetDoc: targetDoc };
    if (H()) H().closeEditor();
    document.body.classList.add('judas-inserting');
    SW.toast('Now click a point in the ' + target + ' column where the passage should appear', 5000);
  }
  function cancelInsert() { inserting = null; document.body.classList.remove('judas-inserting'); }
  // place the insert where the reader clicks in the target column (capture, ahead of the highlight layer)
  document.addEventListener('click', function (ev) {
    if (!inserting) return;
    var span = ev.target.closest && ev.target.closest('.pair-col[data-side="' + inserting.targetSide + '"] .textLayer span');
    if (!span || !span.firstChild) return;
    ev.stopPropagation();
    var pageEl = span.closest('.pdf-page'); if (!pageEl) { cancelInsert(); return; }
    var r = document.createRange();
    r.setStart(span.firstChild, 0);
    r.setEnd(span.firstChild, Math.min(24, span.firstChild.length));
    var selector = H().selectorForRange(pageEl, r);
    if (!selector) { SW.toast('Could not anchor there; try another point'); return; }
    var link = { id: uid(), a: inserting.sourceHid, kind: 'insert',
      insertAt: { doc: inserting.targetDoc, selector: selector, page: +pageEl.dataset.n },
      note: '', by: by(), created: new Date().toISOString() };
    var a = all(); a.push(link); saveAll(a);
    var td = inserting.targetDoc; cancelInsert();
    repaintInsertsDoc(td);
    openLink(link.id, ev.clientX, ev.clientY);
  }, true);

  // ---- painting insert cards into the target column ----
  function srcCite(hid) { var h = H() && H().get(hid); if (!h) return ''; var d = SW.PROGRAMME && SW.PROGRAMME.doc(h.doc); return d && d.short ? d.short : h.doc; }
  function insDocLabel(l) { var d = SW.PROGRAMME && SW.PROGRAMME.doc(l.insertAt && l.insertAt.doc); return d && d.short ? d.short : (l.insertAt ? l.insertAt.doc : ''); }
  function insLayer(pageEl) {
    var o = pageEl.querySelector('.ins-layer');
    if (!o) { o = el('div', { class: 'ins-layer' }); pageEl.appendChild(o); }
    return o;
  }
  function paintInserts(side, docId, pageEl, n) {
    var o = insLayer(pageEl); o.innerHTML = '';
    var pageRect = pageEl.getBoundingClientRect();
    var edge = side === 'left' ? 'right' : 'left';   // the card hugs the gutter edge of the page
    all().filter(function (l) { return l.kind === 'insert' && l.insertAt && l.insertAt.doc === docId && (!l.insertAt.page || l.insertAt.page === n); }).forEach(function (l) {
      var range = H().rangeInPage(pageEl, l.insertAt.selector);
      var top = 6;
      if (range) { var rc = range.getBoundingClientRect(); top = rc.top - pageRect.top; }
      var card = el('div', { class: 'ins-card', 'data-id': l.id });
      card.style.top = Math.max(2, top) + 'px';
      card.style[edge] = '6px';
      card.style.borderColor = inkOf(l.a);   // the card's edge in its source passage's colour
      card.innerHTML = '<div class="ins-head">↳ ' + esc(srcCite(l.a)) + '</div>' +
        '<div class="ins-quote">' + esc(quoteOf(l.a).slice(0, 240)) + '</div>' +
        (l.note ? '<div class="ins-note">' + esc(l.note) + '</div>' : '');
      card.onclick = function (ev) { ev.stopPropagation(); openLink(l.id, ev.clientX, ev.clientY); };
      o.append(card);
    });
  }
  function repaintInsertsDoc(docId) {
    var COL = SW.pair && SW.pair.col; if (!COL) return;
    ['left', 'right'].forEach(function (side) {
      var c = COL[side]; if (!c || c.docId !== docId) return;
      c.pages.querySelectorAll('.pdf-page').forEach(function (pg) { if (pg.querySelector('.textLayer')) paintInserts(side, docId, pg, +pg.dataset.n); });
    });
  }
  function repaintInsertsShown() {
    var COL = SW.pair && SW.pair.col; if (!COL) return;
    ['left', 'right'].forEach(function (s) { if (COL[s] && COL[s].docId) repaintInsertsDoc(COL[s].docId); });
  }

  // ---- drawing the curves across the gutter ----
  function wrapEl() { return document.querySelector('.pair-wrap'); }
  function layer() {
    var w = wrapEl(); if (!w) return null;
    var svg = w.querySelector('svg.judas-layer');
    if (!svg) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'judas-layer'); w.appendChild(svg); }
    return svg;
  }
  function bands() {
    var COL = SW.pair && SW.pair.col, b = {};
    ['left', 'right'].forEach(function (s) { var c = COL && COL[s]; if (c && c.scroll) { var r = c.scroll.getBoundingClientRect(); b[s] = { top: r.top, bottom: r.bottom }; } });
    return b;
  }
  var raf = null;
  function scheduleDraw() { if (raf) return; raf = requestAnimationFrame(function () { raf = null; draw(); }); }
  function draw() {
    var w = wrapEl(), svg = layer(); if (!w || !svg) return;
    var wr = w.getBoundingClientRect();
    svg.setAttribute('width', wr.width); svg.setAttribute('height', wr.height);
    svg.setAttribute('viewBox', '0 0 ' + wr.width + ' ' + wr.height);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var band = bands();
    function clamp(y, s) { var bd = band[s]; if (!bd) return { y: y, off: false }; if (y < bd.top) return { y: bd.top, off: true }; if (y > bd.bottom) return { y: bd.bottom, off: true }; return { y: y, off: false }; }
    all().forEach(function (l) {
      if (l.kind === 'insert') return;                     // an insert is a card, not a curve
      var sa = sideOf(l.a), sb = sideOf(l.b);
      if (!sa || !sb || sa === sb) return;                 // not both shown in opposite columns now
      var leftId = sa === 'left' ? l.a : l.b, rightId = sa === 'left' ? l.b : l.a;
      var lb = boxOf(leftId), rb = boxOf(rightId); if (!lb || !rb) return;
      var ly = clamp(lb.cy, 'left'), ry = clamp(rb.cy, 'right');
      var x1 = lb.right - wr.left, y1 = ly.y - wr.top, x2 = rb.left - wr.left, y2 = ry.y - wr.top;
      var mx = (x1 + x2) / 2;
      var d = 'M ' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2;
      var hit = document.createElementNS(NS, 'path'); hit.setAttribute('d', d); hit.setAttribute('class', 'judas-hit'); hit.setAttribute('data-id', l.id);
      var line = document.createElementNS(NS, 'path'); line.setAttribute('d', d);
      line.setAttribute('class', 'judas-line' + (ly.off || ry.off ? ' off' : '') + (l.note ? ' noted' : ''));
      // the curve takes its highlights' colours: one colour, or shading from one end to the other
      var lc = inkOf(leftId), rc = inkOf(rightId);
      if (lc === rc) line.style.stroke = lc;
      else {
        var g = document.createElementNS(NS, 'linearGradient'), gid = 'jg-' + l.id;
        g.setAttribute('id', gid); g.setAttribute('gradientUnits', 'userSpaceOnUse');
        g.setAttribute('x1', x1); g.setAttribute('y1', y1); g.setAttribute('x2', x2); g.setAttribute('y2', y2);
        g.innerHTML = '<stop offset="0" stop-color="' + lc + '"/><stop offset="1" stop-color="' + rc + '"/>';
        svg.appendChild(g);
        line.style.stroke = 'url(#' + gid + ')';
      }
      svg.appendChild(hit); svg.appendChild(line);
      [[x1, y1, lc], [x2, y2, rc]].forEach(function (p) {
        var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', 3.5); c.setAttribute('class', 'judas-dot'); c.style.fill = p[2]; svg.appendChild(c);
      });
    });
  }
  // a click on a curve opens its link
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t && t.getAttribute && t.getAttribute('class') === 'judas-hit') { ev.stopPropagation(); openLink(t.getAttribute('data-id'), ev.clientX, ev.clientY); }
  });

  // ---- the link's note, opened from its curve ----
  var pop = null;
  function closeLink() { if (pop) { pop.remove(); pop = null; } }
  function openLink(id, x, y) {
    closeLink();
    var l = get(id); if (!l) return;
    var isIns = l.kind === 'insert';
    pop = el('div', { class: 'hl-pop judas-pop' });
    var ends = isIns
      ? '<div class="hl-quote">' + esc(quoteOf(l.a).slice(0, 200)) + '</div>' +
        '<div class="judas-join" aria-hidden="true">↳ shown inside ' + esc(insDocLabel(l)) + '</div>'
      : '<div class="hl-quote">' + esc(quoteOf(l.a).slice(0, 160)) + '</div>' +
        '<div class="judas-join" aria-hidden="true">⤫ the judas</div>' +
        '<div class="hl-quote">' + esc(quoteOf(l.b).slice(0, 160)) + '</div>';
    pop.innerHTML =
      '<div class="judas-ends">' + ends + '</div>' +
      '<textarea class="hl-note" rows="2" placeholder="' + (isIns ? 'A note on this insert…' : 'A note on what joins these two passages…') + '">' + esc(l.note || '') + '</textarea>' +
      '<div class="hl-acts"><button class="btn ghost" data-act="delete">Delete</button>' +
      '<span class="hl-by hint">' + esc(l.by || '') + '</span>' +
      '<button class="btn" data-act="done">Done</button></div>';
    document.body.append(pop);
    var r = pop.getBoundingClientRect();
    pop.style.left = Math.max(6, Math.min(x, window.innerWidth - r.width - 6)) + 'px';
    pop.style.top = Math.max(6, Math.min(y + 8, window.innerHeight - r.height - 6)) + 'px';
    function commit() { l.note = pop.querySelector('.hl-note').value; var a = all(), i = a.map(function (z) { return z.id; }).indexOf(l.id); if (i >= 0) { a[i] = l; saveAll(a); } if (isIns) repaintInsertsShown(); }
    pop.querySelector('[data-act="done"]').onclick = function () { commit(); closeLink(); };
    pop.querySelector('.hl-note').onchange = commit;
    pop.querySelector('[data-act="delete"]').onclick = function () {
      saveAll(all().filter(function (z) { return z.id !== id; }));
      closeLink(); scheduleDraw(); repaintInsertsShown();
      SW.toast(isIns ? 'Insert removed' : 'Judas removed');
    };
  }

  // ---- the highlight editor's judas section: a Join button and this passage's links ----
  SW.on('highlight:editor', function (d) {
    var pop = d.pop, h = d.h;
    var sec = el('div', { class: 'hl-links' });
    var mine = all().filter(function (l) { return l.a === h.id || l.b === h.id; });
    var listHtml = mine.map(function (l) {
      if (l.kind === 'insert') {
        return '<button class="judas-row" data-id="' + esc(l.id) + '" title="Open this insert">↳ shown inside ' + esc(insDocLabel(l)) + (l.note ? ' · <i>noted</i>' : '') + '</button>';
      }
      var other = l.a === h.id ? l.b : l.a;
      return '<button class="judas-row" data-id="' + esc(l.id) + '" title="Open this judas">⤫ ' + esc(quoteOf(other).slice(0, 48) || 'a passage') + (l.note ? ' · <i>noted</i>' : '') + '</button>';
    }).join('');
    sec.innerHTML = '<div class="judas-btns"><button class="btn judas-start" data-act="join">⤫ Join</button>' +
      '<button class="btn judas-start" data-act="insert">↳ Insert</button></div>' +
      (mine.length ? '<div class="judas-list">' + listHtml + '</div>' : '');
    var acts = pop.querySelector('.hl-acts');
    pop.insertBefore(sec, acts);
    sec.querySelector('[data-act="join"]').onclick = function () { startJoin(h.id); };
    sec.querySelector('[data-act="insert"]').onclick = function () { startInsert(h.id); };
    sec.querySelectorAll('.judas-row').forEach(function (b) {
      b.onclick = function () { var rc = b.getBoundingClientRect(); H().closeEditor(); openLink(b.dataset.id, rc.left, rc.bottom); };
    });
  });

  // ---- the margin list: links whose other end is a document not now shown, with swap-in ----
  function ensureMarginBtn() {
    var bar = document.querySelector('.pair-bar'); if (!bar) return null;
    var btn = bar.querySelector('#judas-absent');
    if (!btn) {
      btn = el('button', { class: 'btn judas-absent', id: 'judas-absent', title: 'Links to documents not now shown' }, 'Links elsewhere');
      var swap = bar.querySelector('#pair-swap');
      bar.insertBefore(btn, swap ? swap.nextSibling : null);
      btn.onclick = function (ev) { ev.stopPropagation(); toggleMargin(btn); };
    }
    return btn;
  }
  function absentLinks() {
    var COL = SW.pair && SW.pair.col; if (!COL) return [];
    var shown = [COL.left && COL.left.docId, COL.right && COL.right.docId].filter(Boolean);
    var sess = SW.PROGRAMME && SW.PROGRAMME.session(SW.pair.state.session);
    var pool = (sess && sess.pool) || [];
    var out = [];
    all().forEach(function (l) {
      var ds = linkDocs(l), da = ds[0], db = ds[1]; if (!da || !db) return;
      var aShown = shown.indexOf(da) >= 0, bShown = shown.indexOf(db) >= 0;
      if (aShown === bShown) return;                       // need exactly one end shown
      var shownDoc = aShown ? da : db, hiddenDoc = aShown ? db : da;
      if (pool.indexOf(hiddenDoc) < 0) return;             // only swappable (same session) for now
      var shownHid = docOf(l.a) === shownDoc ? l.a : (l.b || l.a);
      out.push({ link: l, shownDoc: shownDoc, hiddenDoc: hiddenDoc, shownHid: shownHid });
    });
    return out;
  }
  function updateMargin() {
    var btn = ensureMarginBtn(); if (!btn) return;
    var list = absentLinks();
    btn.style.display = list.length ? '' : 'none';
    btn.textContent = 'Links elsewhere (' + list.length + ')';
    var menu = document.querySelector('.judas-menu');
    if (menu && menu.dataset.open === '1') drawMenu(btn);   // refresh if open
  }
  function toggleMargin(btn) {
    var menu = document.querySelector('.judas-menu');
    if (menu && menu.dataset.open === '1') { menu.remove(); return; }
    drawMenu(btn);
  }
  function drawMenu(btn) {
    var old = document.querySelector('.judas-menu'); if (old) old.remove();
    var list = absentLinks();
    var menu = el('div', { class: 'judas-menu' });
    menu.dataset.open = '1';
    menu.innerHTML = list.length ? list.map(function (x, i) {
      var hd = SW.PROGRAMME.doc(x.hiddenDoc);
      var who = hd && hd.short ? hd.short : x.hiddenDoc;
      var snippet = x.link.note || quoteOf(x.shownHid);
      return '<button class="judas-mrow" data-i="' + i + '">Swap in <b>' + esc(who) + '</b>' +
        (snippet ? '<span class="hint"> · ' + esc(snippet.slice(0, 40)) + '</span>' : '') + '</button>';
    }).join('') : '<p class="hint" style="padding:6px 8px">No links to other documents in this session.</p>';
    document.body.append(menu);
    var r = btn.getBoundingClientRect();
    menu.style.left = Math.min(r.left, window.innerWidth - menu.getBoundingClientRect().width - 6) + 'px';
    menu.style.top = (r.bottom + 4) + 'px';
    menu.querySelectorAll('.judas-mrow').forEach(function (b) {
      b.onclick = function () {
        var x = list[+b.dataset.i];
        var COL = SW.pair.col;
        var partnerSide = COL.left && COL.left.docId === x.shownDoc ? 'left' : 'right';
        var target = partnerSide === 'left' ? 'right' : 'left';
        SW.pair.open(target, x.hiddenDoc);
        menu.remove();
      };
    });
  }

  // ---- redraw and refresh on the reader's events ----
  SW.on('pair:page', function (d) { scheduleDraw(); if (d && d.pageEl) paintInserts(d.side, d.docId, d.pageEl, d.n); });
  SW.on('pair:open', function () { cancelJoin(); cancelInsert(); scheduleDraw(); updateMargin(); repaintInsertsShown(); });
  SW.on('highlights:changed', function () { scheduleDraw(); updateMargin(); repaintInsertsShown(); });
  SW.on('links:changed', function () { scheduleDraw(); updateMargin(); repaintInsertsShown(); });
  SW.on('highlight:removed', function (id) {
    var a = all(), n = a.filter(function (l) { return l.a !== id && l.b !== id; });
    if (n.length !== a.length) saveAll(n);
  });
  document.addEventListener('scroll', scheduleDraw, true);
  window.addEventListener('resize', scheduleDraw);
  document.addEventListener('mousedown', function (ev) {
    if (pop && !ev.target.closest('.judas-pop')) closeLink();
    var menu = document.querySelector('.judas-menu');
    if (menu && !ev.target.closest('.judas-menu') && !ev.target.closest('#judas-absent')) menu.remove();
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { closeLink(); cancelJoin(); cancelInsert(); var m = document.querySelector('.judas-menu'); if (m) m.remove(); } });

  SW.links = { all: all, get: get, claimClick: claimClick, startJoin: startJoin, startInsert: startInsert, draw: scheduleDraw, openLink: openLink };
})(typeof window !== 'undefined' ? window : globalThis);
