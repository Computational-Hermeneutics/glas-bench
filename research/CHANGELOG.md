# Changelog: Glas Bench

Changes to the bench (`research/`). The bench keeps its own version numbers, raised by 0.0.1 with each change (the `?v=` on every script and stylesheet in `index.html`); this file records the versions published, newest first.

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
