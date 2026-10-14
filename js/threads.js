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
    if (sel) drawThread(body, sel);
    else body.innerHTML = '<div class="pad hint">A thread gathers joins across the gutter, in any session, under a name, to be read in order as a sequence of excerpts.</div>';
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
