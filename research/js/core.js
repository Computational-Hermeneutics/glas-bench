/*
 * core.js - this bench's own part of reading its texts: how a line divides into code and
 * comment, and what each line is. Fetching, the cache of builds, opening a version at a line
 * and an export's details are bench-kit's (kit/builds.js); its references and the files'
 * SWHIDs are kit/refs.js's, set in js/config.js.
 *
 * A "build" is one version fetched and divided into lines: the unit that every view reads
 * from. What a view needs of one: b.v (the version), b.parts (its files: src, role, raw),
 * b.lines[file][line - 1] ({ p, n, raw, norm }), b.errorsAt and b.kind (marks by
 * "file:line"), b.asm (null: a bench that assembles or indexes its texts puts that here, as
 * read gives it to SW.builds).
 */
(function (root) {
  'use strict';

  var SW = root.SW;   // made by kit/base.js
  var B = SW.BENCH;

  // One line divided into code and comment: the comment from the first of the bench's
  // comment marks (SW.BENCH.comment) to the end of the line, the mark included. Both
  // keep their spacing, so the listing shows the line as written.
  SW.parseLine = function (raw) {
    var s = String(raw || '').replace(/\n$/, ''), marks = [].concat(B.comment == null ? '#' : B.comment).filter(Boolean), ci = -1;
    marks.forEach(function (m) { var i = s.indexOf(m); if (i >= 0 && (ci < 0 || i < ci)) ci = i; });
    return { labels: [], loc: '', code: ci >= 0 ? s.slice(0, ci) : s, comment: ci >= 0 ? s.slice(ci) : '' };
  };
  function splitLines(t) { var ls = String(t).replace(/\r\n?/g, '\n').split('\n'); if (ls.length > 1 && ls[ls.length - 1] === '') ls.pop(); return ls; }

  // A build: the files divided into lines and marked (kit/builds.js fetches and caches it)
  SW.builds({
    read: function (v, L) { var b = { v: v, dialect: v.dialect, parts: L.parts, asm: null }; index(b); return b; }
  });

  // What each line is, for the marks in Read: def (a routine begins here, by the bench's
  // pattern, SW.BENCH.routine), com (a line of comment only).
  function index(b) {
    var re = B.routine ? new RegExp(B.routine) : null;
    b.lines = b.parts.map(function (p, pi) {
      return splitLines(p.raw).map(function (r, i) { return { p: pi, n: i + 1, raw: r, norm: r }; });
    });
    b.errorsAt = {}; b.kind = {}; b.sym = {};
    b.lines.forEach(function (ls, pi) {
      if (b.parts[pi].role === 'doc') return;
      ls.forEach(function (L) {
        var k = pi + ':' + L.n, pl = SW.parseLine(L.raw), m = re && re.exec(pl.code);
        if (m) { b.kind[k] = 'def'; var name = (m[1] || m[0]).trim(); if (!b.sym[name]) b.sym[name] = { name: name, p: pi, n: L.n }; }
        else if (!pl.code.trim() && pl.comment.trim()) b.kind[k] = 'com';
      });
    });
  }

  // ---------- ghosts (kit/base.js, SW.ghostMatch) ----------
  // lines as keys: comments, spacing and case set aside; blank lines count for nothing
  SW.lineKey = function (t) { return SW.parseLine(t).code.replace(/\s+/g, ' ').trim().toLowerCase(); };

})(this);
