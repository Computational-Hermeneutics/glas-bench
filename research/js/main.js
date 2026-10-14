/*
 * main.js - this bench's parts of the frame (bench-kit's kit/shell.js, loaded after it is set):
 * its views, in the order of the tabs. The picker's groups and the version shown first are in
 * js/config.js (forks, start). A bench adds here the language shown beside the picker (lang),
 * links of its own (query), its Help items (help) and the rest (the kit's README).
 */
(function (root) {
  'use strict';
  root.SW.BENCH.shell = {
    // Glas keeps Read, Findings, My notes and Paratexts for now; the genealogy half
    // (Text/analyse, Functional, Compare, Genealogy) is switched off. The Pair, Sessions
    // and Threads views are added in the phases that follow. About is reached through Help.
    views: ['read', 'about', 'findings', 'notes', 'paratexts']
  };
})(this);
