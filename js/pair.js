/*
 * pair.js - the Pair view: two documents side by side, a column each, read against each other
 * after Derrida's Glas. Two columns of equal standing, each with its own document, scroll and
 * zoom; either can lead. A document is chosen from the session's pool; the sides can be swapped.
 *
 * This is the reader (Phase 1). Highlights, the judas links across the gutter and threads come
 * in the phases that follow. PDFs render with PDF.js and its text layer, so text can be selected.
 *
 * Bench-only code. The two-column reader and the quote-selector anchoring are the kit-first
 * candidates set out in PLAN.md; they move to bench-kit once they settle here.
 */
(function (root) {
  'use strict';
  var SW = root.SW, el = SW.el, esc = SW.esc;

  // ---- PDF.js, the kit's version and global (cdnjs, fetched the first time a PDF opens) ----
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/', pdfjsP = null;
  function pdfjs() {
    if (!pdfjsP) pdfjsP = new Promise(function (ok, no) {
      if (root.pdfjsLib) { ok(root.pdfjsLib); return; }
      var sc = document.createElement('script');
      sc.src = PDFJS + 'pdf.min.js';
      sc.onload = function () { root.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(root.pdfjsLib); };
      sc.onerror = function () { pdfjsP = null; no(new Error('PDF.js could not be fetched')); };
      document.head.appendChild(sc);
    });
    return pdfjsP;
  }

  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  function PROG() { return SW.PROGRAMME; }
  function doc(id) { return PROG() ? PROG().doc(id) : null; }

  // the author line and year, short, from CSL
  function cite(d) {
    if (!d) return '';
    var c = d.csl || {}, a = (c.author || [])[0], who = a ? (a.literal || a.family || '') : '';
    var yr = c.issued && c.issued['date-parts'] ? c.issued['date-parts'][0][0] : '';
    return [who + (c.author && c.author.length > 1 ? ' et al.' : ''), yr].filter(Boolean).join(' ');
  }
  function title(d) { return d && d.csl ? d.csl.title : ''; }

  // A document's PDF is drawn from the paratext library (the private repository the kit reads
  // with each member's token) when a token is set, then from a copy under lib/, then (an open
  // item) from its URL.
  // sources(d) resolves to a list of URLs to try in order.
  function paratextURL(code) {
    var P = SW.paratexts, BP = SW.BENCH.paratexts;
    if (!P || !P.configured || !P.configured() || !code) return Promise.resolve(null);
    return P.load().then(function (cat) {
      var it = ((cat && cat.items) || []).filter(function (x) { return x.code === code && !x.withdrawn; })[0];
      if (!it || !it.file) return null;
      var api = 'https://api.github.com/repos/' + BP.org + '/' + BP.repo + '/contents/' +
        it.file.split('/').map(encodeURIComponent).join('/');
      return fetch(api, { headers: { Authorization: 'Bearer ' + String(SW.store.get('gh.token', '')).trim(),
        Accept: 'application/vnd.github.raw', 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('paratext ' + r.status); return r.blob(); })
        .then(function (b) { var m = it.mime || 'application/pdf'; if (b.type !== m) b = b.slice(0, b.size, m); return URL.createObjectURL(b); });
    }).catch(function () { return null; });
  }
  function sources(d) {
    var list = [], src = d.source || {};
    // the copy held under lib/ in this repository, loaded same-origin
    var libUrl = 'lib/' + d.id + '.pdf';
    if (src.kind === 'url' && src.url) { list.push(libUrl); list.push(src.url); return Promise.resolve(list); }
    // a paratext (copyrighted) document: the kit's paratext library first (when a token is set),
    // then the library copy in this repository
    return paratextURL(src.paratext).then(function (u) {
      if (u) list.push(u);
      list.push(libUrl);
      return list;
    });
  }

  // ---- state ----
  var ST = { session: null, side: { left: null, right: null } };
  var COL = { left: null, right: null };   // live column objects

  function keyBase() { return 'pair.'; }
  function saveState() {
    try {
      SW.store.set(keyBase() + 'session', ST.session || '');
      SW.store.set(keyBase() + 'left', ST.side.left || '');
      SW.store.set(keyBase() + 'right', ST.side.right || '');
    } catch (e) { /* storage off */ }
  }

  // ---- view scaffold ----
  var root_el = null;
  // size the two-column area to fill the space below the top bar and tabs
  function fit() {
    if (!root_el) return;
    var w = SW.$('.pair-wrap', root_el); if (!w) return;
    var top = w.getBoundingClientRect().top;
    w.style.height = Math.max(240, window.innerHeight - top - 6) + 'px';
  }
  function build() {
    var host = SW.$('#view-pair');
    host.innerHTML = '';
    var bar = el('div', { class: 'pair-bar' },
      '<label class="pair-sesh">Session <select id="pair-session" aria-label="Session"></select></label>' +
      '<button class="btn" id="pair-swap" title="Swap the two columns">⇄ Swap sides</button>' +
      '<span class="pair-hint hint">Select text in a column to highlight it. Joining passages across the gutter arrives next.</span>');
    var wrap = el('div', { class: 'pair-wrap' });
    var left = columnEl('left'), gutter = el('div', { class: 'pair-gutter', 'aria-hidden': 'true' }), right = columnEl('right');
    wrap.append(left.el, gutter, right.el);
    host.append(bar, wrap);
    COL.left = left; COL.right = right;
    root_el = host;
    fit();
    if (!build.wired) { build.wired = true; window.addEventListener('resize', fit); }

    // session picker
    var sel = SW.$('#pair-session', host);
    PROG().sessions.forEach(function (s) {
      var full = s.pool && s.pool.length;
      sel.append(el('option', { value: s.id, disabled: full ? null : 'disabled' },
        'Session ' + s.no + ' · ' + SW.fmtDate(s.date) + (full ? '' : ' (to come)')));
    });
    sel.value = ST.session;
    sel.onchange = function () { openSession(sel.value); };
    SW.$('#pair-swap', host).onclick = swap;
  }

  function columnEl(side) {
    var head = el('div', { class: 'pair-head' },
      '<select class="pair-pick" aria-label="Document in this column"></select>' +
      '<span class="pair-zoom"><button class="icon-btn" data-z="out" title="Smaller">−</button>' +
      '<button class="icon-btn" data-z="in" title="Larger">+</button></span>');
    var scroll = el('div', { class: 'pair-scroll' });
    var pages = el('div', { class: 'pair-pages' });
    scroll.append(pages);
    var box = el('div', { class: 'pair-col', 'data-side': side });
    box.append(head, scroll);
    var o = { el: box, side: side, head: head, scroll: scroll, pages: pages, pick: head.querySelector('.pair-pick'),
              docId: null, pdf: null, zoom: 1, io: null };
    o.pick.onchange = function () { open(side, o.pick.value); };
    head.querySelectorAll('[data-z]').forEach(function (b) {
      b.onclick = function () { o.zoom *= (b.dataset.z === 'in' ? 1.15 : 1 / 1.15); if (o.docId) open(side, o.docId); };
    });
    return o;
  }

  function fillPicks() {
    var s = PROG().session(ST.session), pool = (s && s.pool) || [];
    ['left', 'right'].forEach(function (side) {
      var o = COL[side], sel = o.pick; sel.innerHTML = '';
      pool.forEach(function (id) {
        var d = doc(id);
        sel.append(el('option', { value: id }, (d.role === 'technical' ? 'T · ' : 'C · ') + cite(d)));
      });
      sel.value = ST.side[side] || '';
    });
  }

  // ---- open a session, a side, a document ----
  function openSession(sid) {
    var s = PROG().session(sid); if (!s || !s.pool.length) return;
    ST.session = sid;
    var op = s.open || { left: s.pool[0], right: s.pool[1] || s.pool[0] };
    ST.side.left = op.left; ST.side.right = op.right;
    fillPicks(); saveState();
    open('left', ST.side.left); open('right', ST.side.right);
  }

  function swap() {
    var l = ST.side.left; ST.side.left = ST.side.right; ST.side.right = l;
    fillPicks(); saveState();
    open('left', ST.side.left); open('right', ST.side.right);
  }

  function open(side, docId) {
    var o = COL[side], d = doc(docId); if (!d) return;
    ST.side[side] = docId; o.docId = docId; o.pick.value = docId; saveState();
    SW.emit('pair:open', { side: side, docId: docId });
    if (o.io) { o.io.disconnect(); o.io = null; }
    o.pages.innerHTML = '<div class="pair-load hint">Opening ' + esc(cite(d)) + '…</div>';
    Promise.all([pdfjs(), sources(d)]).then(function (r) {
      var lib = r[0], tries = r[1], i = 0;
      (function next() {
        if (o.docId !== docId) return;                 // the column moved on
        if (i >= tries.length) { noPdf(o, d); return; }
        lib.getDocument({ url: tries[i++], isEvalSupported: false }).promise.then(function (pdf) {
          if (o.docId !== docId) return;
          o.pdf = pdf; renderPdf(o, d, pdf);
        }, function () { next(); });
      })();
    }, function (e) { o.pages.innerHTML = '<p class="badge err">' + esc(e.message) + '</p>'; });
  }

  // no PDF to be had (a copyrighted text with no local copy and no open URL): offer to open one
  function noPdf(o, d) {
    o.pages.innerHTML = '';
    var where = d.source && d.source.kind === 'paratext' ? 'This text is in copyright; it is not held in the repository.' :
      'This document could not be loaded from its source.';
    var card = el('div', { class: 'pair-open' },
      '<p>' + esc(title(d)) + '</p><p class="hint">' + esc(where) + ' Open a PDF from your computer to read it here.</p>');
    var inp = el('input', { type: 'file', accept: 'application/pdf', class: 'pair-file' });
    var btn = el('button', { class: 'btn' }, 'Open a PDF…');
    btn.onclick = function () { inp.click(); };
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var u = URL.createObjectURL(f);
      pdfjs().then(function (lib) { return lib.getDocument({ url: u, isEvalSupported: false }).promise; })
        .then(function (pdf) { o.pdf = pdf; renderPdf(o, d, pdf); }, function (e) { o.pages.innerHTML = '<p class="badge err">' + esc(e.message) + '</p>'; });
    };
    card.append(btn, inp);
    o.pages.append(card);
  }

  // ---- render a PDF into a column, pages rendered lazily as they are scrolled into view ----
  function renderPdf(o, d, pdf) {
    o.pages.innerHTML = '';
    pdf.getPage(1).then(function (p1) {
      var base = p1.getViewport({ scale: 1 });
      var avail = o.scroll.clientWidth - 24;             // column width less padding
      var fit = avail > 0 ? avail / base.width : 1;
      var scale = Math.max(0.2, fit * (o.zoom || 1));
      o.scale = scale;
      var vw = base.width * scale, vh = base.height * scale;
      for (var n = 1; n <= pdf.numPages; n++) {
        var pg = el('div', { class: 'pdf-page', 'data-n': n });
        pg.style.width = vw + 'px'; pg.style.height = vh + 'px';   // placeholder, corrected on render
        o.pages.append(pg);
      }
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) {
          if (!e.isIntersecting) return;
          var pg = e.target; if (pg.dataset.done) return; pg.dataset.done = '1';
          renderPage(o, pdf, +pg.dataset.n, scale, pg);
        });
      }, { root: o.scroll, rootMargin: '400px 0px' });
      o.io = io;
      o.pages.querySelectorAll('.pdf-page').forEach(function (pg) { io.observe(pg); });
    });
  }

  function renderPage(o, pdf, n, scale, pg) {
    pdf.getPage(n).then(function (page) {
      var vp = page.getViewport({ scale: scale });
      pg.style.width = vp.width + 'px'; pg.style.height = vp.height + 'px';
      var dpr = window.devicePixelRatio || 1;
      var cv = document.createElement('canvas');
      cv.className = 'pdf-canvas';
      cv.width = Math.floor(vp.width * dpr); cv.height = Math.floor(vp.height * dpr);
      cv.style.width = vp.width + 'px'; cv.style.height = vp.height + 'px';
      pg.append(cv);
      var ctx = cv.getContext('2d');
      page.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
      // the text layer, over the canvas, so text can be selected
      page.getTextContent().then(function (tc) {
        var tl = el('div', { class: 'textLayer' });
        tl.style.width = vp.width + 'px'; tl.style.height = vp.height + 'px';
        tl.style.setProperty('--scale-factor', scale);
        pg.append(tl);
        var task = root.pdfjsLib.renderTextLayer({ textContentSource: tc, container: tl, viewport: vp, textDivs: [] });
        var done = task && task.promise ? task.promise : Promise.resolve();
        done.then(function () { SW.emit('pair:page', { side: o.side, docId: o.docId, pageEl: pg, n: n }); }, function () {});
      });
    });
  }

  // ---- the view's hooks for the shell ----
  function show() {
    if (!PROG()) { SW.$('#view-pair').innerHTML = '<div class="pad hint">No programme is loaded.</div>'; return; }
    if (!ST.session) {
      ST.session = SW.store.get(keyBase() + 'session', '') || firstFull();
      ST.side.left = SW.store.get(keyBase() + 'left', '') || null;
      ST.side.right = SW.store.get(keyBase() + 'right', '') || null;
    }
    build();
    var s = PROG().session(ST.session);
    if (ST.side.left && ST.side.right && s && s.pool.indexOf(ST.side.left) >= 0 && s.pool.indexOf(ST.side.right) >= 0) {
      fillPicks(); open('left', ST.side.left); open('right', ST.side.right);
    } else {
      openSession(ST.session);
    }
  }
  function firstFull() { var s = PROG().sessions.filter(function (x) { return x.pool && x.pool.length; })[0]; return s ? s.id : PROG().sessions[0].id; }

  SW.views.pair = { show: show, hide: function () {}, enter: function () {} };
  SW.pair = { open: open, swap: swap, openSession: openSession, state: ST, col: COL };
})(typeof window !== 'undefined' ? window : globalThis);
