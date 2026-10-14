/*
 * versions.js - the versions this bench holds, and how they descend from one another.
 *
 * Each record is a witness: a surviving set of files (build), or a lost version known
 * from the record (no build). Files are under source/ and shown exactly as held.
 * roles: 'program' (the program itself), 'support' (files around it), 'doc'
 * (documentation: shown in Read, never compared).
 *
 * The two versions here are an invented example. Replace them with your own.
 */
(function (root) {
  'use strict';

  var SRC = '../source/';

  // the list's machinery (links, descent, loading) is bench-kit's kit/versionlist.js
  var L = root.SWVersionList || require('../kit/versionlist.js'), files = L.files;

  // fork: the group a version is listed under in the version picker (SW.BENCH.forks)
  // status: 'recovered' (held), 'lost' (known only from the record), 'reconstructed'
  var VERSIONS = [
    { id: 'v0', label: 'The first sketch', date: '2019', sort: 20190000, authors: 'A. Programmer',
      fork: 'main', status: 'lost', medium: null,
      summary: 'A first sketch, mentioned in the README of version 1 but not kept. An example of a lost version: the bench lists it, and annotations can still be kept on its record.' },
    { id: 'v1', label: 'Version 1', date: 'March 2020', sort: 20200300, authors: 'A. Programmer',
      fork: 'main', status: 'recovered', medium: 'Source files',
      summary: 'The first version kept: one Python file that reads a text file, counts its words and prints the ten most frequent.',
      build: files('v1/', ['wordfreq.py', { src: 'README.txt', role: 'doc' }]) },
    { id: 'v2', label: 'Version 2', date: 'June 2021', sort: 20210600, authors: 'A. Programmer and B. Reviewer',
      fork: 'main', status: 'recovered', medium: 'Source files',
      summary: 'The reading of words moved into a module of its own (textutil.py), with a regular expression in place of the loop over characters; common words can be left out, and the number printed chosen.',
      build: files('v2/', ['wordfreq.py', 'textutil.py', { src: 'README.txt', role: 'doc' }]) }
  ];

  // One dialect: the files are read, not run. Kept for the views that ask.
  var DIALECTS = { text: { label: 'Source text (read, not run)', options: {} } };

  VERSIONS.forEach(function (v) {
    v.dialect = 'text';
    v.buildNotes = (v.buildNotes || []).map(function (t) { return { by: 'log', who: 'build log', date: '', text: t }; });
  });

  // ---------- descent ----------
  // parent: the version it was made from. witnessOf: another copy of the same files, not a
  // step of its own. also and influence: other versions it draws on.
  var PARENT = { v1: 'v0', v2: 'v1' };
  var WITNESS = {};
  var ALSO = {};
  var INFLUENCE = {};
  // lines of descent, for the genealogy: each to its last version (tip)
  var LINES = [
    { id: 'main', label: 'The main line (v0 → v2)', tip: 'v2' }
  ];

  var api = L({ versions: VERSIONS, src: SRC, dialects: DIALECTS, lines: LINES,
                 parent: PARENT, witness: WITNESS, also: ALSO, influence: INFLUENCE });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SWVersions = api;
})(this);
