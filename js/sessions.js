/*
 * sessions.js - Phase 3, the Sessions view: the programme session by session.
 *
 * Each session shows its date and its pool of documents, technical and critical, with what the
 * reader has made on each (highlights, post-its); the joins made within the session and those
 * that reach into other sessions; and the threads that pass through it. Read opens the session in
 * Pair; a document opens in its column (technical on the left, critical on the right). Sessions
 * whose pools are not yet filled say so.
 *
 * It reads the programme (programme.js) and the reader's own work (highlights.js, postits.js,
 * links.js, threads.js), all kept in this browser. Bench-only for now; a hermes-kit module once
 * settled.
 */
(function (root) {
  'use strict';
  var SW = root.SW, el = SW.el, esc = SW.esc;
  function P() { return SW.PROGRAMME; }

  function count(list, key) { var c = {}; (list || []).forEach(function (x) { c[x[key]] = (c[x[key]] || 0) + 1; }); return c; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function cite(d) {
    var c = d.csl || {}, a = (c.author || [])[0], who = a ? (a.literal || a.family || '') : '';
    var yr = c.issued && c.issued['date-parts'] ? c.issued['date-parts'][0][0] : '';
    return [who + (c.author && c.author.length > 1 ? ' et al.' : ''), yr].filter(Boolean).join(' ');
  }

  // open a session in Pair, optionally with one document placed in its column
  function openIn(sid, docId) {
    var s = P().session(sid); if (!s || !s.pool.length) return;
    var op = s.open || { left: s.pool[0], right: s.pool[1] || s.pool[0] };
    var left = op.left, right = op.right, d = docId && P().doc(docId);
    if (d) { if (d.role === 'technical') left = docId; else right = docId; }
    if (left === right) { var other = s.pool.filter(function (x) { return x !== left; })[0]; if (other) right = other; }
    SW.pair.openPair(sid, left, right);
  }

  function show() {
    var host = SW.$('#view-sessions'); if (!host) return;
    var hs = SW.highlights ? SW.highlights.all() : [], ps = SW.postits ? SW.postits.all() : [];
    var hlBy = count(hs, 'doc'), pitBy = count(ps, 'doc');
    var docOfH = {}; hs.forEach(function (h) { docOfH[h.id] = h.doc; });
    var joins = SW.links ? SW.links.joins() : [], threads = SW.threads ? SW.threads.all() : [];
    var cur = SW.pair && SW.pair.state.session;
    var prog = P();
    var html = '<div class="ses"><header class="ses-head"><h2>' + esc(prog.title) + '</h2>' +
      (prog.note ? '<p class="hint">' + esc(prog.note) + '</p>' : '') + '</header><ol class="ses-list">';
    prog.sessions.forEach(function (s) {
      var pool = s.pool || [], inPool = function (d) { return pool.indexOf(d) >= 0; };
      var within = 0, reach = 0;
      joins.forEach(function (l) {
        var a = inPool(docOfH[l.a]), b = inPool(docOfH[l.b]);
        if (a && b) within++; else if (a || b) reach++;
      });
      var ths = threads.filter(function (t) {
        return t.links.some(function (id) { var l = SW.links.get(id); return l && (inPool(docOfH[l.a]) || inPool(docOfH[l.b])); });
      });
      html += '<li class="ses-item' + (s.id === cur ? ' on' : '') + (pool.length ? '' : ' empty') + '" data-sid="' + esc(s.id) + '">' +
        '<div class="ses-when"><b>Session ' + s.no + '</b><span>' + esc(SW.fmtDate(s.date)) + '</span>' +
        (pool.length ? '<button class="btn" data-act="read">Read</button>' : '') + '</div>';
      if (!pool.length) { html += '<div class="ses-docs hint">Documents to come.</div></li>'; return; }
      html += '<div class="ses-docs">' + ['technical', 'critical'].map(function (role) {
        var ds = pool.filter(function (id) { var d = prog.doc(id); return d && d.role === role; });
        if (!ds.length) return '';
        return '<div class="ses-role"><div class="ses-role-h">' + (role === 'technical' ? 'Technical' : 'Critical') + '</div>' +
          ds.map(function (id) {
            var d = prog.doc(id), made = [];
            if (hlBy[id]) made.push(plural(hlBy[id], 'highlight'));
            if (pitBy[id]) made.push(plural(pitBy[id], 'post-it'));
            return '<button class="ses-doc" data-doc="' + esc(id) + '" title="Open in its column"><span class="ses-cite">' + esc(d.short || cite(d)) + '</span>' +
              '<span class="ses-title">' + esc(d.csl && d.csl.title || '') + '</span>' +
              (made.length ? '<span class="ses-made">' + esc(made.join(' · ')) + '</span>' : '') + '</button>';
          }).join('') + '</div>';
      }).join('') + '</div>' +
        '<div class="ses-work hint">' + [plural(within, 'join') + ' within', reach ? plural(reach, 'join') + ' to other sessions' : '']
          .filter(Boolean).join(' · ') +
        (ths.length ? ' · Threads: ' + ths.map(function (t) { return '<a href="#" data-thread="' + esc(t.id) + '">' + esc(t.name) + '</a>'; }).join(', ') : '') + '</div></li>';
    });
    html += '</ol></div>';
    host.innerHTML = html;
    host.querySelectorAll('.ses-item').forEach(function (li) {
      var sid = li.dataset.sid;
      var r = li.querySelector('[data-act="read"]'); if (r) r.onclick = function () { openIn(sid); };
      li.querySelectorAll('.ses-doc').forEach(function (b) { b.onclick = function () { openIn(sid, b.dataset.doc); }; });
      li.querySelectorAll('[data-thread]').forEach(function (a) {
        a.onclick = function (ev) { ev.preventDefault(); SW.store.set('threads.sel', a.dataset.thread); SW.setTab('threads'); };
      });
    });
  }

  SW.views.sessions = { show: show, enter: show, hide: function () {} };
  SW.sessions = { show: show, openIn: openIn };
})(typeof window !== 'undefined' ? window : globalThis);
