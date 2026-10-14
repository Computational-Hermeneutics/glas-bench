/*
 * analyse.js - lenses on a version, drawn in bench-kit's Analyse view (kit/lenses.js), which
 * gives each its heading, its menu (Text ▾), its modes and its export. Two lenses to begin
 * with, for any language the bench reads (the comment mark and the routine pattern in
 * js/config.js): the comments, and the routines. Each draws cards into the grid it is given and
 * returns a function giving its export; one in `across` reads every version at once. Keep the
 * numbers stable, so that a lens can be named in discussion ("lens 2").
 */
(function (root) {
  'use strict';
  var SW = root.SW, card = SW.lenses.card, wide = SW.lenses.wide, bars = SW.lenses.bars;

  function fileName(b, p) { return b.parts[p].src.split('/').pop(); }
  // a line's place, as a link into Read
  function where(b, p, n) { return { html: '<a href="#" data-go="' + p + ':' + n + '">' + SW.esc(fileName(b, p) + ':' + n) + '</a>', sort: p * 100000 + n, text: fileName(b, p) + ':' + n }; }
  function linkRows(el) {
    el.addEventListener('click', function (e) {
      var a = e.target.closest('[data-go]'); if (!a) return;
      e.preventDefault();
      var x = a.dataset.go.split(':'), p = +x[0], n = +x[1];
      SW.state.sel = { p: p, n0: n, n1: n }; SW.setTab('read'); SW.emit('goto', { p: p, n: n, tab: 'read' });
    });
  }
  function plain(rows) { return rows.map(function (r) { return r.map(function (c) { return c && c.text != null ? c.text : c; }); }); }
  function short(v) { return SW.refOf(v.id) + ' ' + v.label; }

  // ---------- 1 comments ----------
  // every comment of the program files, without its mark
  function commentsOf(b) {
    var out = [];
    b.lines.forEach(function (ls, p) {
      if (b.parts[p].role === 'doc') return;
      ls.forEach(function (L) { var c = SW.parseLine(L.raw).comment.replace(/^[^\w"'“‘(]+/, '').trim(); if (c) out.push({ p: p, n: L.n, c: c }); });
    });
    return out;
  }
  function comments(b, el) {
    var items = commentsOf(b), rows = [];
    var c = wide(card('Comments', items.length + ' comments in this version’s program files. Type to keep only those that contain a word; click a place to read it in Read.'));
    var inp = SW.el('input', { type: 'search', placeholder: 'Find in comments…', value: SW.store.get('an.cq', ''), style: 'width:260px' });
    var out = SW.el('div');
    c.appendChild(inp); c.appendChild(out); el.appendChild(c);
    function draw() {
      var q = inp.value.trim().toLowerCase(); SW.store.set('an.cq', inp.value);
      rows = items.filter(function (x) { return !q || x.c.toLowerCase().indexOf(q) >= 0; }).map(function (x) { return [where(b, x.p, x.n), x.c]; });
      out.innerHTML = '';
      out.appendChild(rows.length ? SW.table(['Where', 'Comment'], rows, { cls: ['mono', ''] }) : SW.el('p', { class: 'hint' }, 'No comment contains “' + inp.value + '”.'));
    }
    inp.addEventListener('input', draw); draw(); linkRows(c);
    // the comments by file: how much each says about itself
    var per = b.parts.map(function (pt, p) { return pt.role === 'doc' ? null : [fileName(b, p), items.filter(function (x) { return x.p === p; }).length]; }).filter(Boolean);
    if (per.length > 1) { var pc = card('Comments by file', 'How much each file says about itself.'); pc.insertAdjacentHTML('beforeend', bars(per)); el.appendChild(pc); }
    return function () { return [SW.tableBlock('Comments' + (inp.value.trim() ? ' containing “' + inp.value.trim() + '”' : ''), ['Where', 'Comment'], plain(rows))]; };
  }
  function commentsAcross(vs, bs, el) {
    var rows = vs.map(function (v, i) {
      var b = bs[i], code = 0, n = commentsOf(b).length;
      b.lines.forEach(function (ls, p) { if (b.parts[p].role !== 'doc') ls.forEach(function (L) { if (SW.parseLine(L.raw).code.trim()) code++; }); });
      return [short(v), n, code, code ? (100 * n / code).toFixed(1) + '%' : '–'];
    });
    var c = wide(card('Comments across the versions', 'How many comments each version carries, against its lines of code.'));
    c.insertAdjacentHTML('beforeend', bars(rows.map(function (r) { return [r[0], r[1]]; })));
    c.appendChild(SW.table(['Version', 'Comments', 'Lines of code', 'Comments per line'], rows, { cls: ['', 'num', 'num', 'num'] }));
    el.appendChild(c);
    return function () { return [SW.tableBlock('Comments across the versions', ['Version', 'Comments', 'Lines of code', 'Comments per line'], rows)]; };
  }

  // ---------- 2 routines ----------
  // the routines a version defines (core.js indexes them by SW.BENCH.routine), and how often
  // each name appears on other lines
  function routinesOf(b) {
    var names = Object.keys(b.sym || {}), used = {};
    names.forEach(function (k) { used[k] = 0; });
    var re = names.length ? new RegExp('\\b(' + names.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'g') : null;
    if (re) b.lines.forEach(function (ls, p) {
      if (b.parts[p].role === 'doc') return;
      ls.forEach(function (L) {
        var code = SW.parseLine(L.raw).code, m;
        while ((m = re.exec(code))) { var s = b.sym[m[1]]; if (!(s.p === p && s.n === L.n)) used[m[1]]++; }
      });
    });
    return names.map(function (k) { return { name: k, p: b.sym[k].p, n: b.sym[k].n, used: used[k] }; }).sort(function (x, y) { return x.p - y.p || x.n - y.n; });
  }
  function routines(b, el) {
    var rs = routinesOf(b);
    var rows = rs.map(function (r) { return [r.name, r.used, where(b, r.p, r.n)]; });
    var c = wide(card('Routines', rs.length + ' routines begin in this version’s files (by the pattern in js/config.js), each with the number of lines elsewhere that name it. Sort by a column; click a place to read it.'));
    c.appendChild(rows.length ? SW.table(['Routine', 'Named elsewhere', 'Defined at'], rows, { cls: ['mono', 'num', 'mono'] }) : SW.el('p', { class: 'hint' }, 'No line matches the routine pattern.'));
    el.appendChild(c); linkRows(c);
    var top = rs.slice().sort(function (x, y) { return y.used - x.used; }).slice(0, 12).filter(function (r) { return r.used; });
    if (top.length) { var tc = card('Most named', 'The routines other lines name most often.'); tc.insertAdjacentHTML('beforeend', bars(top.map(function (r) { return [r.name, r.used]; }))); el.appendChild(tc); }
    return function () { return [SW.tableBlock('Routines', ['Routine', 'Named elsewhere', 'Defined at'], plain(rows))]; };
  }
  // which routines each version has: where one appears, and where it goes
  function routinesAcross(vs, bs, el) {
    var all = {}, order = [];
    bs.forEach(function (b) { Object.keys(b.sym || {}).forEach(function (k) { if (!all[k]) { all[k] = 1; order.push(k); } }); });
    var rows = order.map(function (k) { return [k].concat(bs.map(function (b) { return b.sym && b.sym[k] ? '●' : '–'; })); });
    var head = ['Routine'].concat(vs.map(function (v) { return SW.refOf(v.id); }));
    var c = wide(card('Routines across the versions', order.length + ' routines across ' + vs.length + ' versions: ● where a version defines it, – where it does not.'));
    c.appendChild(SW.table(head, rows, { cls: ['mono'].concat(vs.map(function () { return 'num'; })) }));
    el.appendChild(c);
    return function () { return [SW.tableBlock('Routines across the versions', head, rows)]; };
  }

  // ---------- for kit/lenses.js ----------
  SW.BENCH.lenses = {
    list: [[1, 'Comments', 'Every comment, searchable'],
           [2, 'Routines', 'Every routine the program defines, and how often it is named']],
    menus: { text: [['', [1, 2]]] },
    one: { 1: comments, 2: routines },
    across: { 1: commentsAcross, 2: routinesAcross },
    acrossLabel: 'Across the versions'
  };
})(this);
