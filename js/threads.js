/*
 * threads.js - Phase 3, threads: named, tagged, ordered sets of joins, read across sessions.
 *
 * A thread gathers joins (links.js) under a name, with tags and a note of its own, in an order
 * the reader sets. A join is added to a thread from its note (click the curve), and a join can
 * belong to more than one thread. The Threads view lists the threads; open one and its joins read
 * as a sequence of excerpts, each pair of passages with its documents, pages and sessions, to be
 * reordered, annotated or followed: Open goes to the pair, with both passages brought into view.
 *
 * Threads are kept in this browser under glasbench.threads; nothing is sent anywhere. Bench-only
 * for now; a hermes-kit module once settled.
 */
(function (root) {
  'use strict';
  var SW = root.SW, el = SW.el, esc = SW.esc;

  var KEY = 'threads';
  function all() { return SW.store.get(KEY, []); }
  function saveAll(a) { SW.store.set(KEY, a); SW.emit('threads:changed', a); }
  function get(id) { return all().filter(function (t) { return t.id === id; })[0] || null; }
  function put(t) { var a = all(), i = a.map(function (x) { return x.id; }).indexOf(t.id); if (i >= 0) a[i] = t; else a.push(t); saveAll(a); }
  function uid() { return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function L() { return SW.links; }
  function H() { return SW.highlights; }
  function P() { return SW.PROGRAMME; }
  function joinOf(id) { return L() && L().get(id); }
  function threadsOf(lid) { return all().filter(function (t) { return t.links.indexOf(lid) >= 0; }); }

  function create(name) {
    var t = { id: uid(), name: name || 'A thread', tags: [], links: [], note: '', by: SW.me().initials || '', created: new Date().toISOString() };
    put(t); return t;
  }
  function addLink(tid, lid) { var t = get(tid); if (t && t.links.indexOf(lid) < 0) { t.links.push(lid); put(t); } }
  function removeLink(tid, lid) { var t = get(tid); if (t) { t.links = t.links.filter(function (x) { return x !== lid; }); put(t); } }
  function move(tid, lid, d) {
    var t = get(tid); if (!t) return; var i = t.links.indexOf(lid), j = i + d;
    if (i < 0 || j < 0 || j >= t.links.length) return;
    t.links.splice(j, 0, t.links.splice(i, 1)[0]); put(t);
  }

  // ---- where a passage sits: document, page, the session it is read in ----
  function sessionWith(a, b) {
    var cur = SW.pair && SW.pair.state.session, ss = P().sessions;
    function has(s, d) { return (s.pool || []).indexOf(d) >= 0; }
    var c = P().session(cur);
    if (c && has(c, a) && (!b || has(c, b))) return c;
    return ss.filter(function (s) { return has(s, a) && (!b || has(s, b)); })[0] || null;
  }
  function citeOf(hid) {
    var h = H().get(hid); if (!h) return '';
    var d = P().doc(h.doc), s = sessionWith(h.doc);
    return (d && d.short ? d.short : h.doc) + (h.page ? ', p. ' + h.page : '') + (s ? ' · Session ' + s.no : '');
  }

  // follow a join: open its two documents (technical on the left, where the roles differ) and bring
  // both passages into view
  function openJoin(lid) {
    var l = joinOf(lid); if (!l) return;
    var ha = H().get(l.a), hb = H().get(l.b); if (!ha || !hb) return;
    var left = l.a, right = l.b, da = P().doc(ha.doc), db = P().doc(hb.doc);
    if (da && db && da.role === 'critical' && db.role === 'technical') { left = l.b; right = l.a; }
    var dl = H().get(left).doc, dr = H().get(right).doc;
    var s = sessionWith(dl, dr) || sessionWith(dl) || sessionWith(dr);
    SW.pair.openPair(s && s.id, dl, dr);
    H().reveal(left); H().reveal(right);
  }

  // ---- in a join's note: the threads it is in, and adding it to one ----
  SW.on('link:editor', function (d) {
    var pop = d.pop, l = d.l;
    var sec = el('div', { class: 'thr-in' });
    function draw() {
      var mine = threadsOf(l.id), others = all().filter(function (t) { return mine.indexOf(t) < 0; });
      sec.innerHTML = '<div class="thr-in-label">Threads</div><div class="thr-chips">' +
        mine.map(function (t) { return '<span class="thr-chip">' + esc(t.name) + ' <button data-rm="' + esc(t.id) + '" title="Take this join out of the thread" aria-label="Remove">×</button></span>'; }).join('') +
        '<select class="thr-add" aria-label="Add to a thread"><option value="">＋ Add to a thread…</option>' +
        others.map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>'; }).join('') +
        '<option value="_new">New thread…</option></select></div>';
      sec.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { removeLink(b.dataset.rm, l.id); draw(); }; });
      sec.querySelector('.thr-add').onchange = function (ev) {
        var v = ev.target.value; if (!v) return;
        if (v === '_new') { var n = window.prompt('A name for the new thread'); if (!n) { draw(); return; } v = create(n.trim()).id; }
        addLink(v, l.id); draw();
      };
    }
    draw();
    pop.insertBefore(sec, pop.querySelector('.hl-acts'));
  });

  // a join deleted: it leaves its threads
  SW.on('links:changed', function (links) {
    var ids = {}; (links || []).forEach(function (l) { ids[l.id] = 1; });
    var a = all(), changed = false;
    a.forEach(function (t) { var n = t.links.filter(function (x) { return ids[x]; }); if (n.length !== t.links.length) { t.links = n; changed = true; } });
    if (changed) saveAll(a);
  });

  // ---- the Threads view ----
  var SEL = 'threads.sel';
  function show() {
    var host = SW.$('#view-threads'); if (!host) return;
    var ts = all(), sel = get(SW.store.get(SEL, '')) || ts[0] || null;
    host.innerHTML = '';
    var wrap = el('div', { class: 'thr' });
    var list = el('aside', { class: 'thr-list' });
    list.innerHTML = '<div class="thr-list-head"><h2>Threads</h2><button class="btn" data-act="new">＋ New thread</button></div>' +
      (ts.length ? ts.map(function (t) {
        return '<button class="thr-item' + (sel && t.id === sel.id ? ' on' : '') + '" data-id="' + esc(t.id) + '"><b>' + esc(t.name) + '</b>' +
          '<span class="hint">' + t.links.length + ' join' + (t.links.length === 1 ? '' : 's') + (t.tags.length ? ' · ' + esc(t.tags.join(', ')) : '') + '</span></button>';
      }).join('') : '<p class="hint">No threads yet. Make one here, or from a join: click its curve across the gutter, then Add to a thread.</p>');
    var body = el('section', { class: 'thr-body' });
    wrap.append(list, body);
    host.append(wrap);
    list.querySelector('[data-act="new"]').onclick = function () {
      var n = window.prompt('A name for the new thread'); if (!n) return;
      SW.store.set(SEL, create(n.trim()).id); show();
    };
    list.querySelectorAll('.thr-item').forEach(function (b) { b.onclick = function () { SW.store.set(SEL, b.dataset.id); show(); }; });
    // List or Graph; the graph shows the open thread, or every join
    var mode = SW.store.get('threads.mode', 'list'), every = !!SW.store.get('threads.graphAll', false) || !sel;
    var bar = el('div', { class: 'thr-mode' },
      '<span class="thr-seg"><button data-m="list"' + (mode === 'list' ? ' class="on"' : '') + '>List</button><button data-m="graph"' + (mode === 'graph' ? ' class="on"' : '') + '>Graph</button></span>' +
      (mode === 'graph' && sel ? '<label class="thr-every"><input type="checkbox"' + (every ? ' checked' : '') + '> All joins</label>' : ''));
    var inner = el('div', { class: 'thr-inner' });
    body.append(bar, inner);
    bar.querySelectorAll('[data-m]').forEach(function (b) { b.onclick = function () { SW.store.set('threads.mode', b.dataset.m); show(); }; });
    var ev = bar.querySelector('.thr-every input'); if (ev) ev.onchange = function () { SW.store.set('threads.graphAll', ev.checked); show(); };
    if (mode === 'graph') drawGraph(inner, every ? null : sel);
    else if (sel) drawThread(inner, sel);
    else inner.innerHTML = '<div class="pad hint">A thread gathers joins across the gutter, in any session, under a name, to be read in order as a sequence of excerpts.</div>';
  }

  // ---- the graph: sessions as bands, technical documents on the left and critical on the right,
  //      joins as curves across the middle, numbered in the thread's order ----
  var NS = 'http://www.w3.org/2000/svg';
  function drawGraph(host, t) {
    var joins = L() ? L().joins() : [], byId = {};
    joins.forEach(function (l) { byId[l.id] = l; });
    var ids = (t ? t.links : joins.map(function (l) { return l.id; })).filter(function (id) { var l = byId[id]; return l && H().get(l.a) && H().get(l.b); });
    if (!ids.length) { host.innerHTML = '<p class="hint thr-empty">' + (t ? 'No joins in this thread yet.' : 'No joins yet.') + '</p>'; return; }
    // the documents each join touches, placed in the session that holds them
    var rows = {}, order = [];
    function place(docId) {
      var s = sessionWith(docId), sid = s ? s.id : '_', d = P().doc(docId);
      if (!rows[sid]) { rows[sid] = { s: s, left: [], right: [] }; order.push(sid); }
      var lane = d && d.role === 'critical' ? 'right' : 'left';
      if (rows[sid][lane].indexOf(docId) < 0) rows[sid][lane].push(docId);
      return { sid: sid, lane: lane };
    }
    var edges = ids.map(function (id, i) { var l = byId[id]; return { l: l, n: i + 1, a: place(H().get(l.a).doc), b: place(H().get(l.b).doc), da: H().get(l.a).doc, db: H().get(l.b).doc }; });
    order.sort(function (x, y) { return (rows[x].s ? rows[x].s.no : 99) - (rows[y].s ? rows[y].s.no : 99); });
    // layout
    var W = Math.max(520, Math.min(host.clientWidth || 860, 900)), NW = Math.min(220, W * 0.3), NH = 34, GAP = 14, PAD = 30, y = 0, pos = {};
    order.forEach(function (sid) {
      var r = rows[sid], n = Math.max(r.left.length, r.right.length, 1);
      r.top = y; r.h = PAD + n * (NH + GAP) + 6;
      ['left', 'right'].forEach(function (lane) {
        r[lane].forEach(function (docId, i) { pos[sid + '|' + docId] = { x: lane === 'left' ? 8 : W - NW - 8, y: y + PAD + i * (NH + GAP), lane: lane, sid: sid, doc: docId }; });
      });
      y += r.h;
    });
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'thr-graph'); svg.setAttribute('width', W); svg.setAttribute('height', y + 4); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (y + 4));
    var out = '';
    order.forEach(function (sid, i) {
      var r = rows[sid];
      out += '<rect class="tg-band' + (i % 2 ? ' odd' : '') + '" x="0" y="' + r.top + '" width="' + W + '" height="' + r.h + '"/>' +
        '<text class="tg-session" x="10" y="' + (r.top + 18) + '">' + esc(r.s ? 'Session ' + r.s.no + ' · ' + SW.fmtDate(r.s.date) : 'Not in a session') + '</text>';
    });
    // edges, spread when several join the same two documents
    var seen = {};
    edges.forEach(function (e) {
      var A = pos[e.a.sid + '|' + e.da], B = pos[e.b.sid + '|' + e.db]; if (!A || !B) return;
      if (A.lane === 'right' && B.lane === 'left') { var t0 = A; A = B; B = t0; }
      var key = [A.sid + A.doc, B.sid + B.doc].sort().join('~'), k = seen[key] = (seen[key] || 0) + 1, off = ((k % 2 ? 1 : -1) * Math.floor(k / 2)) * 6;
      var x1, y1 = A.y + NH / 2 + off, x2, y2 = B.y + NH / 2 + off, d;
      if (A.lane !== B.lane) { x1 = A.x + NW; x2 = B.x; var mx = (x1 + x2) / 2; d = 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2; }
      else { var side = A.lane === 'left', bx = side ? A.x + NW : A.x, bulge = side ? 70 + 10 * k : -70 - 10 * k; x1 = bx; x2 = bx; d = 'M' + x1 + ' ' + y1 + ' C' + (x1 + bulge) + ' ' + y1 + ' ' + (x2 + bulge) + ' ' + y2 + ' ' + x2 + ' ' + y2; }
      var ink = L().inkOf(e.l.a), mxp = A.lane !== B.lane ? (x1 + x2) / 2 : x1 + (A.lane === 'left' ? 52 + 7.5 * k : -52 - 7.5 * k), myp = (y1 + y2) / 2;
      out += '<g class="tg-edge" data-id="' + esc(e.l.id) + '"><title>' + esc(e.n + '. ' + L().quoteOf(e.l.a).slice(0, 60) + ' ⤫ ' + L().quoteOf(e.l.b).slice(0, 60) + (e.l.note ? ' (' + e.l.note + ')' : '')) + '</title>' +
        '<path class="tg-hit" d="' + d + '"/><path class="tg-line" d="' + d + '" style="stroke:' + ink + '"/>' +
        '<circle class="tg-num" cx="' + mxp + '" cy="' + myp + '" r="9" style="stroke:' + ink + '"/><text class="tg-numt" x="' + mxp + '" y="' + (myp + 3.5) + '">' + e.n + '</text></g>';
    });
    Object.keys(pos).forEach(function (k) {
      var q = pos[k], d = P().doc(q.doc), lab = d && d.short ? d.short : q.doc;
      out += '<g class="tg-node ' + q.lane + '" data-sid="' + esc(q.sid) + '" data-doc="' + esc(q.doc) + '"><title>' + esc((d && d.csl && d.csl.title) || lab) + '</title>' +
        '<rect x="' + q.x + '" y="' + q.y + '" width="' + NW + '" height="' + NH + '" rx="5"/>' +
        '<text x="' + (q.x + 10) + '" y="' + (q.y + NH / 2 + 4) + '">' + esc(lab) + '</text></g>';
    });
    svg.innerHTML = out;
    host.innerHTML = '<p class="hint thr-ghint">' + (t ? 'The thread “' + esc(t.name) + '”' : 'Every join') + ': technical documents on the left, critical on the right, a band for each session. Click a curve to open that join, a document to open it.</p>';
    host.append(svg);
    svg.querySelectorAll('.tg-edge').forEach(function (g) { g.onclick = function () { openJoin(g.dataset.id); }; });
    svg.querySelectorAll('.tg-node').forEach(function (g) { g.onclick = function () { if (SW.sessions) SW.sessions.openIn(g.dataset.sid === '_' ? null : g.dataset.sid, g.dataset.doc); }; });
  }

  function drawThread(body, t) {
    var joins = (L() ? L().joins() : []), byId = {};
    joins.forEach(function (l) { byId[l.id] = l; });
    var items = t.links.filter(function (id) { return byId[id]; });
    var rest = joins.filter(function (l) { return items.indexOf(l.id) < 0; });
    body.innerHTML =
      '<div class="thr-meta">' +
      '<input class="thr-name" value="' + esc(t.name) + '" aria-label="Thread name">' +
      '<input class="thr-tags" value="' + esc(t.tags.join(', ')) + '" placeholder="tags, comma separated" aria-label="Tags">' +
      '<textarea class="thr-note" rows="2" placeholder="A note on the thread…" aria-label="Note">' + esc(t.note || '') + '</textarea>' +
      '<div class="thr-meta-acts"><span class="hint">' + esc(t.by || '') + (t.created ? ' · ' + esc(SW.fmtDate(t.created)) : '') + '</span>' +
      '<button class="btn ghost" data-act="del">Delete thread</button></div></div>' +
      (items.length ? '<ol class="thr-xs">' + items.map(function (id, i) {
        var l = byId[id];
        return '<li class="thr-x" data-id="' + esc(id) + '"><div class="thr-n">' + (i + 1) + '</div><div class="thr-pair">' +
          '<blockquote style="border-color:' + L().inkOf(l.a) + '">' + esc(L().quoteOf(l.a)) + '</blockquote><div class="thr-cite">' + esc(citeOf(l.a)) + '</div>' +
          '<div class="thr-judas" aria-hidden="true">⤫</div>' +
          '<blockquote style="border-color:' + L().inkOf(l.b) + '">' + esc(L().quoteOf(l.b)) + '</blockquote><div class="thr-cite">' + esc(citeOf(l.b)) + '</div>' +
          (l.note ? '<div class="thr-jnote">' + esc(l.note) + '</div>' : '') + '</div>' +
          '<div class="thr-acts"><button class="icon-btn" data-act="up" title="Earlier"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button class="icon-btn" data-act="down" title="Later"' + (i === items.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '<button class="btn" data-act="open" title="Go to this pair, with both passages in view">Open</button>' +
          '<button class="icon-btn" data-act="out" title="Take it out of the thread">×</button></div></li>';
      }).join('') + '</ol>' : '<p class="hint thr-empty">No joins in this thread yet.</p>') +
      (rest.length ? '<div class="thr-addrow"><select class="thr-addjoin" aria-label="Add a join"><option value="">＋ Add a join…</option>' +
        rest.map(function (l) { return '<option value="' + esc(l.id) + '">' + esc(L().quoteOf(l.a).slice(0, 36)) + ' ⤫ ' + esc(L().quoteOf(l.b).slice(0, 36)) + '</option>'; }).join('') +
        '</select></div>' : '');
    function keep(f) { var x = get(t.id); if (!x) return; f(x); put(x); }
    body.querySelector('.thr-name').onchange = function (e) { keep(function (x) { x.name = e.target.value.trim() || x.name; }); show(); };
    body.querySelector('.thr-tags').onchange = function (e) { keep(function (x) { x.tags = e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); }); show(); };
    body.querySelector('.thr-note').onchange = function (e) { keep(function (x) { x.note = e.target.value; }); };
    body.querySelector('[data-act="del"]').onclick = function () {
      if (!window.confirm('Delete the thread “' + t.name + '”? Its joins stay.')) return;
      saveAll(all().filter(function (x) { return x.id !== t.id; })); SW.store.set(SEL, ''); show();
    };
    body.querySelectorAll('.thr-x').forEach(function (li) {
      var id = li.dataset.id;
      li.querySelector('[data-act="up"]').onclick = function () { move(t.id, id, -1); show(); };
      li.querySelector('[data-act="down"]').onclick = function () { move(t.id, id, 1); show(); };
      li.querySelector('[data-act="out"]').onclick = function () { removeLink(t.id, id); show(); };
      li.querySelector('[data-act="open"]').onclick = function () { openJoin(id); };
    });
    var add = body.querySelector('.thr-addjoin');
    if (add) add.onchange = function () { if (add.value) { addLink(t.id, add.value); show(); } };
  }

  SW.views.threads = { show: show, enter: show, hide: function () {} };
  SW.threads = { all: all, get: get, create: create, addLink: addLink, removeLink: removeLink, threadsOf: threadsOf, openJoin: openJoin };
})(typeof window !== 'undefined' ? window : globalThis);
