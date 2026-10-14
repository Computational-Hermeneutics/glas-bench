# Changelog: Glas Bench

Changes to the bench. The bench keeps its own version numbers, raised by 0.0.1 with each change (the `?v=` on every script and stylesheet in `index.html`); this file records the versions published, newest first.

## 0.2.11 (2026-10-14)

- Post-its rest folded, as a small tab showing their first words, just above the text they belong to; a click opens one to read or write. Insert places the tab above the start of its passage. An open post-it folds when it is accepted (✓, Esc, or Cmd/Ctrl-Enter), when the reader clicks elsewhere, or when its column is scrolled; accepting saves it and hands the keyboard back to the column. A post-it accepted with nothing written is removed. Tabs and open cards can both be dragged.

## 0.2.10 (2026-10-14)

- The Pair view's hint says what can now be done: highlight, join, post-its.

## 0.2.9 (2026-10-14)

- Post-its: comments on small cards floating on a page. ✎ in a column's head drops a free one on the page in view; Insert, in a highlight's editor, puts one beside that passage with a strip in its colour. A post-it is dragged by its top edge, folded by a double-click there, and removed with ×; its place is kept as a fraction of the page, so it holds through zoom and reload and follows its document between the columns. Kept in this browser under `glasbench.postits` (`js/postits.js`). This replaces the earlier insert, which carried a passage into the other column; inserts made that way are left in storage but no longer shown.
- Fixed: a selection dragged past the end of a column's text ran on into the other column. While selecting, only the text layer the selection began in can be selected, and each page has PDF.js's end-of-content block.

## 0.2.8 (2026-10-14)

- The site map is removed: its link in the top bar, its entry in the Help menu (`sitemap: false` in `config.js`) and the page itself.

## 0.2.7 (2026-10-14)

- A judas is drawn in its highlights' colours: one colour when both passages share it, shading from one to the other when they differ, with each end's dot in its own colour. An insert card's edge takes its source passage's colour. Both follow a highlight when it is recoloured.
- Each document's zoom is kept, so it survives a reload and goes with the document from one column to the other.

## 0.2.6 (2026-10-14)

- The tabs move up into the top bar beside the brand, saving a row. The light colour themes (Listing paper, Paper, Sepia) take Glas's colours, warm paper and dark ink with an ochre gold, in place of the kit's Spacewar blue bar and magenta accent; the ground the PDF pages sit on follows each theme. A new icon: two columns with a judas across the gutter. The About box's Sources row is removed. The kit's code size (Settings, and A− and A+ in the top bar) now sizes the bench's own text over the documents, the insert cards, the editors and the list of links elsewhere; `js/textsize.js` relabels that part of Settings and hides the controls that only apply to code listings.

## 0.2.5 (2026-10-14)

- The bench moves to the root of the repository and is published on GitHub Pages at https://computational-hermeneutics.github.io/glas-bench/. Everything that was under `research/` is now at the root; the kit submodule is at `kit/`; the placeholder sources under `source/` are read from beside the bench; `config.js` takes the new base address; the tests run with `--dir .`. A Pages workflow publishes the repository with the kit checked out. The README carries the link.

## 0.2.4 (2026-10-14)

- Phase 2 complete: the judas insert. From a highlighted passage, choose Insert and then a point in the other column, and the passage is shown there as a card anchored at that point, with the source named and a note of its own. The card re-anchors by quoted text when the page is drawn again and moves with the scroll; it is removed from its own card or when its source highlight is deleted. Inserts also appear in the "Links elsewhere" margin list when their other document is not shown. The highlight editor now offers Join and Insert side by side. `js/links.js` gains the insert; `js/highlights.js` exposes the quote-selector anchoring (`rangeInPage`, `selectorForRange`) that both the insert and the joins reuse.

## 0.2.3 (2026-10-14)

- Phase 2 continues: the judas, links across the gutter. Join a highlighted passage in one column to a highlighted passage in the other, with a note; the link is drawn as a curve across the gutter from one passage to the other, kept aligned as the columns are scrolled and zoomed, and clicking the curve opens its note. A link whose other end is a document not now shown is listed above the columns under "Links elsewhere", a click away from swapping that document into view. A link references two highlights by id, so it holds across a swap and can join passages across sessions; links are kept in this browser under `glasbench.links`, and deleting a highlight removes any judas on it. New bench-only module `js/links.js`, with a Join control and a passage's links added to the highlight editor. The insert variant (a passage shown inside the other column) comes next.

## 0.2.2 (2026-10-14)

- Phase 2 begins: the highlight layer. Select text in either column to highlight it over the PDF text layer, in one of five colours, with tags and a note; a small colour bar is raised on a selection, and clicking a highlight reopens its editor. Each highlight is anchored by a W3C TextQuoteSelector (the quoted text with a little either side as prefix and suffix) and the page number as a fallback, so it re-anchors when a page is drawn again and follows its document from one column to the other. Highlights are keyed to the document and kept in this browser under `glasbench.highlights`; nothing is sent anywhere. New bench-only module `js/highlights.js`, with `js/pair.js` emitting `pair:page` and `pair:open` for it to paint against. The judas links that join two highlights across the gutter come next.

## 0.2.1 (2026-10-14)

- Phase 1: the Pair view. Two documents side by side, a column each, rendered with PDF.js and a selectable text layer, lazily by page; each column has its own document picker, zoom and scroll; Swap sides. The programme and its sessions are data (`js/programme.js`), with Session 1 built in full (Song et al. against Sohn-Rethel, Benjamin & Lacis, Bloch) and the 14 session dates. A document's PDF is drawn from the paratext library when a token is set, from a copy committed under `research/lib/` otherwise (this private research space holds the shrunk source PDFs), or from an open URL. Pair is the opening view; Read is kept for one document on its own.

## 0.1.0 (2026-10-14)

- Started from bench-template 0.1.82 on bench-kit 0.60.0. The skeleton: the frame, Read, About, Findings, My notes and Paratexts. The genealogy half of the kit is switched off (Text lenses, Functional overview, Compare, Genealogy, SWHIDs), through `js/config.js` and `js/main.js`, with the kit left unchanged. Rebranded to Glas Bench, with a dark and gold theme. The placeholder example under `source/` is kept until the two-column Pair reader lands. The plan and data model are in `PLAN.md`.
