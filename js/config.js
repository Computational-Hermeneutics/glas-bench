/* config.js - Glas Bench's settings for bench-kit (kit/). Loaded after kit/base.js,
 * before the rest of the kit and the bench's own scripts. The kit's README lists every setting.
 *
 * Glas Bench reads two documents side by side, after Derrida's Glas (1974). This is the
 * skeleton (v0.1.0): the bench's identity and the views it keeps are set here; the document
 * model, the two-column reader and the judas links come in the phases that follow. The
 * placeholder data under source/ is the template's example, kept until the Pair view lands.
 */
(function (root) {
  'use strict';
  root.SW.BENCH = {
    name: 'Glas',
    title: 'Glas Bench',
    slug: 'glas',
    store: 'glasbench.',                                   // unique prefix for this bench's keys in the browser
    base: 'https://computational-hermeneutics.github.io/glas-bench/',
    repo: 'https://github.com/Computational-Hermeneutics/glas-bench',
    refs: { names: { v1: 'EX1', v2: 'EX2' }, prefix: 'EX-', dir: 'source' },   // placeholder, until documents land
    forks: [['main', 'Documents']],
    start: 'v2',
    // placeholder language settings for the example text (replaced by the document model in Phase 1)
    lang: 'plain',
    comment: '#',
    routine: '^\\s*(?:def|class)\\s+(\\w+)',
    caseFold: false,
    entry: 'main',
    about: {
      icon: '<img src="img/icon.svg" alt="" width="40" height="40">',
      author: 'David M. Berry', citeAuthor: 'Berry, D. M.',
      purpose: 'A bench for reading two documents side by side, in two columns of equal standing, after Jacques Derrida’s <i>Glas</i> (1974). Neither column is the commentary on the other. Its case is a technical document on AI set beside a text from the critical tradition, read against each other. Links across the gutter, which Derrida calls <i>judas</i>, are the bench’s main data.',
      inside: 'Two documents at a time, each chosen from a pool, rendered as held and read against each other. Highlights, links and notes are the reader’s own.',
      code: 'https://github.com/Computational-Hermeneutics/glas-bench',
      catalogue: { skip: [], held: 'held as source' }
    },
    theme: { label: 'Glas', note: 'light text on a dark ground (the default)' },
    accent: { dark: '#c9a227', light: '#8a6d1f' },
    hands: [],
    group: '',                                             // the Hypothesis group's ID, once one is made
    relation: 'Glas, ',
    topShare: false,
    settings: {
      tour: 'A few stops through reading two documents side by side; about a minute.',
      groupHint: 'Highlights and links are shared through a Hypothesis group: paste its link or ID, and a personal API token (hypothes.is/account/developer). Without them, your work is kept in this browser and can be exported or published later.',
      groupPlaceholder: 'https://hypothes.is/groups/…',
      themeHint: 'The colours of the whole bench. The ◐ button in the top bar switches between your last light and dark themes.'
    },
    tag: 'bk:',
    tagsHint: 'e.g. breakdown, reliability',
    joinCard: '',
    annoHelp: {
      manual: 'https://www.w3.org/TR/annotation-model/', manualName: 'W3C Web Annotation Data Model',
      start: 'a passage to highlight', search: 'breakdown',
      refA: 'a passage in the technical document', refB: 'a passage in the critical text',
      noteA: 'A note on this passage…', noteB: 'The passage it is read against…', quoteA: 'A note on this passage…',
      boxA: 'Technical document, a passage', boxB: 'Critical text, a passage',
      tryText: 'The judas joins these two passages', code: 'judas',
      caption: 'A link from a passage in one column to a passage in the other'
    },
    // genealogy/compare config kept as inert data for the placeholder example; the views are off
    compare: { comment: '#', normalised: false, reading: 'Reading',
               supplied: ['support files', 'Include the support files'] },
    comparePrefix: 'Glas: ',
    genealogy: { set: ['v1', 'v2'], line: 'main', lineNames: { main: 'The main line' } },
    figureNum: { print: '#8a6d1f', paper: '#8a6d1f', phosphor: '#c9a227' },
    paratexts: { org: 'Computational-Hermeneutics', repo: 'glas_paratexts', cache: 'glas-paratexts' },
    examples: { date: 'e.g. 2025, or 2026-10-14', archive: 'e.g. arXiv', versions: 'e.g. a session',
                refs: '', publisher: 'e.g. University of Nebraska Press', finding: 'F1' },
    stemma: { root: 'v0', lostBetween: {}, skip: [], lostOnTrunk: true },
    edition: {
      built: function () { return ['Read as', 'Document text']; },
      layout: function (raw) { return String(raw).replace(/\t/g, '        '); },
      words: false,
      files: ['all files', 'Include the support and documentation files']
    },
    // the Versions menu is reduced to the About box for the skeleton (no compare/genealogy)
    menus: { versions: [['about', 'About the bench', 'Version, sources, citation']] },
    sitemap: true,
    reading: {
      intro: 'Where to begin on reading a technical document and a critical text against each other.',
      menu: 'Reading the two columns',
      groups: [
        ['The two-column form', [
          'Derrida, J. (1986) <i>Glas</i>. Translated by J. P. Leavey Jr. and R. Rand. Lincoln: University of Nebraska Press.',
          'Berry, D. M. (2011) <i>The Philosophy of Software: Code and Mediation in the Digital Age</i>. Basingstoke: Palgrave Macmillan.']]
      ]
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
