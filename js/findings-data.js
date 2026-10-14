/*
 * findings-data.js - this bench's own findings and how bench-kit's Findings (kit/findings.js)
 * shows them: the list, its categories and its texts. Loaded before the kit. The finding
 * here is the template's example: replace it with your own.
 */
(function (root) {
  'use strict';
  var B = root.SW.BENCH;

  // Evidence is a line, found by pattern in a version's text (so it survives renumbering),
  // or a view (tab, b: Compare's other version).
  B.findings = [
    { no: 'F1', kind: 'Revision', cat: 'versions', level: 'key', title: 'Version 2 moves the reading of words into a module of its own',
      text: 'Version 1 reads words with a loop over characters inside wordfreq.py. Version 2 moves the reading to textutil.py and replaces the loop with a regular expression, which also keeps apostrophes inside words: “don’t” is one word in version 2 and two in version 1.',
      ev: [{ v: 'v1', re: /^def read_words/, label: 'the loop, in version 1' }, { v: 'v2', re: /^WORD = re\.compile/, label: 'the expression, in version 2' }, { v: 'v1', tab: 'compare', b: 'v2', label: 'Compare' }] }
  ];
  // A category is found from the words of a finding (the one with most matches), unless a cat: tag sets it
  B.findingCats = [
    ['text', 'The text', /\b(comments?|spellings?|transcri\w*|typos?|damage\w*)\b/gi],
    ['program', 'The program', /\b(routines?|functions?|loops?|expressions?|modules?|reads?|counts?)\b/gi],
    ['versions', 'Versions and genealogy', /\b(versions?|copies|copy|collat\w*|moves?|replaces?)\b/gi]
  ];
  B.findingsTitle = 'Findings';
  B.findingsSubtitle = 'What the sources and their comparison show';
  B.findingsIntro = 'What the group and the bench have established, each with its evidence one click away. Crew: the group’s findings, by member. Bench: the bench’s own, with its checks run afresh.';
  B.findingsSide = 'bench';
  B.findingsRecheck = 'Run the checks again, and fetch the group’s findings';
})(typeof window !== 'undefined' ? window : globalThis);
