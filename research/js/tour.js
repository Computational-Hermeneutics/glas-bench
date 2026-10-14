/*
 * tour.js - this bench's guided tour: its stops, and the offer made on a first visit. The
 * tour itself is bench-kit's (kit/tours.js), which reads them from SW.BENCH. A stop: title,
 * text, and where to go: v (version), tab, find (a pattern for the line to select in Read),
 * b (Compare's other version), focus (a selector to outline).
 */
(function (root) {
  'use strict';
  var B = root.SW.BENCH;
  B.tourOffer = 'A short tour shows how to read, compare and annotate the sources (five stops, about a minute).';
  B.tours = {
    welcome: { title: 'Welcome to the bench', stops: [
      { title: 'Welcome to the bench', v: 'v2', tab: 'read', focus: '#pick-a',
        text: 'The bench holds the versions of a program: choose one here. Lost versions are listed too, with what is known of them.' },
      { title: 'Reading a listing', v: 'v2', tab: 'read', find: /^def words_of/, focus: '.ln.sel',
        text: 'Each version’s files, line by line, as held. Click a line to select it (shift-click for a range); the bar below offers Annotate, Copy citation and the rest.' },
      { title: 'Annotating together', v: 'v2', tab: 'read', find: /^def words_of/, focus: '#rd-selbar',
        text: 'Annotations are signed with your initials and dated, and shared with the group through Hypothesis. Set your initials and the group under ⚙ Settings.' },
      { title: 'Compare two versions', v: 'v1', tab: 'compare', b: 'v2', focus: '#tabs [data-menu="versions"]',
        text: 'Compare sets two versions side by side, as text or as the routines that differ. Genealogy shows how the versions descend.' },
      { title: 'Findings and My notes', v: 'v2', tab: 'findings', focus: '#tabs [data-tab="notes"]',
        text: 'Findings gathers what the group and the bench have established, each with its evidence. My notes is your own tray for writing: figures, excerpts and findings, exported to Word or Markdown.' }
    ] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
