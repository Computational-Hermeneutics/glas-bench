/*
 * main.js - this bench's parts of the frame (bench-kit's kit/shell.js, loaded after it is set):
 * its views, in the order of the tabs. The picker's groups and the version shown first are in
 * js/config.js (forks, start). A bench adds here the language shown beside the picker (lang),
 * links of its own (query), its Help items (help) and the rest (the kit's README).
 */
(function (root) {
  'use strict';
  root.SW.BENCH.shell = {
    // Pair is Glas's main view (two documents side by side). Read is kept for one document on
    // its own. The genealogy half (Text/analyse, Functional, Compare, Genealogy) is switched
    // off. Sessions and Threads are added in the phases that follow; About is reached through Help.
    views: ['pair', 'read', 'about', 'findings', 'notes', 'paratexts'],
    // open on the Pair view unless a link asks for another tab
    query: function (q) { if (!q.tab) q.tab = 'pair'; }
  };
})(this);
