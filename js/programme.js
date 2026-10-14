/*
 * programme.js - the reading programme Glas Bench opens on: its sessions, and the documents
 * in each session's pool. Held as data, not hard-coded into the views.
 *
 * A programme has dated sessions; each session has a pool of documents, each marked
 * 'technical' or 'critical'. A document has bibliographic metadata (CSL-JSON, so it can come
 * from or go to Zotero), a role, and a source:
 *   { kind: 'url' }       an open item (arXiv, an open web page), loaded from its URL
 *   { kind: 'paratext' }  a copyrighted text, loaded from the private paratexts repository (P-code)
 *   { kind: 'local' }     a file the reader opens in the browser; never uploaded
 * Copies of the session's PDFs are held under lib/ for reading and testing (see pair.js,
 * sources); the designed home for copyrighted texts is the private paratexts repository.
 *
 * This is the example programme. The organisers, the institution and the seminar's title are
 * not named here. Session 1 is built in full; the later sessions carry their dates and fill in
 * over the phases that follow.
 */
(function (root) {
  'use strict';
  var SW = root.SW || (root.SW = {});

  // ---- documents (keyed by id; a document can appear in more than one session) ----
  var DOCS = {
    'song-2025-sci-discovery': {
      id: 'song-2025-sci-discovery', role: 'technical', short: 'Song et al. 2025', lang: 'pdf',
      zotero: 'CQSC87AI',
      csl: { type: 'article', title: 'Evaluating Large Language Models in Scientific Discovery',
        author: [{ family: 'Song', given: 'Zhangde' }, { family: 'Lu', given: 'Jieyu' }, { literal: 'et al.' }],
        issued: { 'date-parts': [[2025, 12, 17]] }, 'container-title': 'arXiv', number: 'arXiv:2512.15567',
        URL: 'https://arxiv.org/abs/2512.15567' },
      source: { kind: 'url', url: 'https://arxiv.org/pdf/2512.15567' }
    },
    'sohn-rethel-broken-down': {
      id: 'sohn-rethel-broken-down', role: 'critical', short: 'Sohn-Rethel 1926', lang: 'pdf',
      zotero: 'WIFZBVLT',
      csl: { type: 'chapter', title: 'The Ideal of the Broken-Down: On the Neapolitan Approach to Things Technical',
        author: [{ family: 'Sohn-Rethel', given: 'Alfred' }],
        issued: { 'date-parts': [[1926]] }, 'original-date': { 'date-parts': [[1926]] } },
      source: { kind: 'paratext' }
    },
    'benjamin-lacis-naples': {
      id: 'benjamin-lacis-naples', role: 'critical', short: 'Benjamin & Lacis 1925', lang: 'pdf',
      zotero: 'ZJPWVK44',
      csl: { type: 'chapter', title: 'Naples',
        author: [{ family: 'Benjamin', given: 'Walter' }, { family: 'Lacis', given: 'Asja' }],
        issued: { 'date-parts': [[1925]] }, 'container-title': 'Selected Writings, Volume 1: 1913–1926',
        publisher: 'Harvard University Press', 'publisher-place': 'Cambridge, MA', page: '414–421' },
      source: { kind: 'paratext' }
    },
    'bloch-italy-porosity': {
      id: 'bloch-italy-porosity', role: 'critical', short: 'Bloch 1925', lang: 'pdf',
      zotero: 'CIRZXCPI',
      csl: { type: 'chapter', title: 'Italy and Porosity',
        author: [{ family: 'Bloch', given: 'Ernst' }], translator: [{ family: 'Joron', given: 'Andrew' }],
        issued: { 'date-parts': [[1925]] }, 'container-title': 'Literary Essays',
        publisher: 'Stanford University Press', 'publisher-place': 'Stanford, CA', page: '450–457' },
      source: { kind: 'paratext' }
    }
  };

  // ---- sessions (fortnightly, Oct 2026 to Jun 2027). Session 1 built in full; the rest
  //      carry their dates and technical/critical headings, pools filled over later phases. ----
  var SESSIONS = [
    { id: 's1', no: 1, date: '2026-10-14',
      pool: ['song-2025-sci-discovery', 'sohn-rethel-broken-down', 'benjamin-lacis-naples', 'bloch-italy-porosity'],
      open: { left: 'song-2025-sci-discovery', right: 'sohn-rethel-broken-down' } },
    { id: 's2', no: 2, date: '2026-10-28', pool: [] },
    { id: 's3', no: 3, date: '2026-11-11', pool: [] },
    { id: 's4', no: 4, date: '2026-11-25', pool: [] },
    { id: 's5', no: 5, date: '2026-12-09', pool: [] },
    { id: 's6', no: 6, date: '2027-01-13', pool: [] },
    { id: 's7', no: 7, date: '2027-01-27', pool: [] },
    { id: 's8', no: 8, date: '2027-02-10', pool: [] },
    { id: 's9', no: 9, date: '2027-03-03', pool: [] },
    { id: 's10', no: 10, date: '2027-03-17', pool: [] },
    { id: 's11', no: 11, date: '2027-04-21', pool: [] },
    { id: 's12', no: 12, date: '2027-05-05', pool: [] },
    { id: 's13', no: 13, date: '2027-05-19', pool: [] },
    { id: 's14', no: 14, date: '2027-06-02', pool: [] }
  ];

  SW.PROGRAMME = {
    title: 'Example programme: technical and critical readings on AI, 2026–27',
    note: 'A year of fortnightly sessions, each pairing a technical document on AI with texts from the critical tradition.',
    docs: DOCS,
    sessions: SESSIONS,
    doc: function (id) { return DOCS[id] || null; },
    session: function (id) { return SESSIONS.filter(function (s) { return s.id === id; })[0] || null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
