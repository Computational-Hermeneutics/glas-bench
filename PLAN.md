# Glas Bench: plan

**Author:** David M. Berry
**Status:** approved 2026-10-14; Phase 0 (skeleton) done, Phase 1 next
**Built on:** bench-kit 0.60.0, from bench-template 0.1.82

Glas Bench reads two documents side by side in two columns of equal standing, after Derrida's *Glas* (1974). Its case is a technical AI document set beside a text from the critical tradition, read against each other. Links across the gutter, which Derrida calls *judas*, are the main data. It is a static site on GitHub Pages, built on bench-kit, with no build step.

## 1. What transfers from the kit, and what switches off

The template is built around versions of one program. Glas reads pairs of documents. A document maps onto the kit's idea of a *build* (one text fetched and divided into lines), so the fetching, reference and paratext machinery transfer. The descent machinery switches off.

**Kept (used as is, through configuration):**

- `base.js`, `md.js`, `themes.js`, `shell.js` frame (tabs, side panel, popovers, dialogs, address bar, Developer mode), `menus.js`, `settings.js`.
- `builds.js` and `refs.js`: each document is a build. `SW.build(docId)` fetches and caches a document; `refs.js` writes references to it.
- `paratexts.js` and `paratexts.css`: the private GitHub repository of scans and documents, PDF.js with its text layer, CSL-JSON, RIS, oai_dc export, collections. This is directly useful and needs little change.
- `tray.js` (My notes), `findings.js`, `export.js` (Word, Markdown), `guides.js`, `helppages.js`, `about.js`, `tours.js`, `initials.js`.
- `notes.js` and `readnotes.js`: annotation sharing through a Hypothesis group, adapted from line anchors to quote-selector anchors (see section 4).

**Switched off (omitted from `SW.BENCH.shell.views`, or not loaded):**

- `genealogy.js`, `compare.js`, `stemma.js`: no descent between documents.
- `version.js` (This version, variorum), the descent fields of `versionlist.js` (parent, witness, also, influence, LINES).
- `swhid.js` and `tools/swhid.sh`: no SWHIDs for sources (documents are cited by CSL, not by content hash of a source tree).
- `functional.js`, `lenses.js` (routines and comments), `catalogue.js`, `layers.js`, `kintsugi.js`, `edition.js`, `tracings.js`, the `lang-*.js` adapters.

The shell's version picker (one open version, `SW.state.v`) is replaced by Glas's own navigator (programme to session to pairing). Each document is still a kit build, so the picker is hidden and Glas drives `SW.build` for the two columns itself.

## 2. The data model

Held as data in the repository (`research/js/programme.js`), not hard-coded into views. No organiser, institution or seminar title anywhere.

```
Programme   { id, title, note, sessions: [sessionId] }
              title: "Example programme: technical and critical readings on AI, 2026-27"

Session     { id, no, date, pool: [docId], note }
              14 fortnightly sessions, 14 Oct 2026 to 2 Jun 2027.
              pool: the documents available that week. One or more technical, one or more critical.

Document    { id, role, csl, source, lang, short }
              role:   'technical' | 'critical'   (drives the default column; either side can lead)
              csl:    CSL-JSON (from or to Zotero): author, title, container-title, issued, DOI, URL, page
              source: { kind: 'url' | 'paratext' | 'local', url?, p?, pages? }
                      url      open-access (arXiv, open web): linked or loaded from the URL
                      paratext a P-code in the private paratexts repository (copyrighted texts)
                      local    a file the reader opens in the browser (never uploaded)
              lang:   'pdf' | 'text' | 'html'   how it renders
              short:  a short label for the margin and references

Pairing     { id, session, left: docId, right: docId }
              one document per column, chosen from the session pool.
              Work (highlights, links, notes) is keyed to the pair id, so it stays with the
              pair when a document is swapped out and returns.

Highlight   { id, doc, selector, page?, colour, tags: [], note?, by, created }
              selector: W3C Web Annotation TextQuoteSelector { exact, prefix, suffix }
              page: fallback anchor for PDFs. Survives re-rendering and different copies.

Link        { id, a: highlightId, b: highlightId, kind, note, thread?, by, created }   // the judas
              kind: 'join'   two highlights joined, same pair or across sessions
                    'insert' a passage from one column shown inside the other at a point
              insertAt?: { doc, selector }   where the inserted passage appears (insert only)

Thread      { id, name, tags: [], links: [linkId], note }
              a named, tagged set of links. Opened as an ordered list of excerpts across
              sessions, or as a graph. Exported to Markdown with citations.
```

Storage: the reader's own highlights, links, notes and threads are kept under the bench's `SW.store` prefix (`glasbench.`), and shared through a Hypothesis group when one is set, with the kit's `bk:` prefix plus Glas tags (`glas:link`, `glas:thread:NAME`). The public repository holds the programme metadata, the reader's own work, and short quotations only. No copyrighted PDF or its extracted text is ever committed.

## 3. Views (tabs)

- **Pair** (new, the main view): two columns of equal width, a document in each, a gutter between them. A session and pair chooser above. Swap sides, swap a document in from the session pool. Visible connectors across the gutter for links in the current pair; a margin list of links to documents not currently shown, one click to swap that document in.
- **Sessions** (new): the programme as a list of sessions, each with its pool, the pairs read and the links made. Links open a session, a pair, a passage or a thread.
- **Threads** (new): threads as a list or a graph across sessions; name and tag a thread; open it as ordered excerpts; export.
- **Search** (new or kit search extended): across every document in the programme, grouped by session and column.
- **My notes**, **Findings**, **Paratexts**, **About** (kit, as is).

Navigation (`shell.js` query scheme, extended): `?s=` session, `&l=` left document, `&r=` right document, `&a=` a passage (highlight), `&t=` thread.

## 4. The kit-first work (new shared modules)

Per the kit-first rule, anything other benches could use goes in bench-kit, not in the bench. Four new reusable pieces:

1. **A two-column reader.** Two panels of equal standing, either able to lead in scrolling, a gutter, swap. Renders a build as PDF (PDF.js text layer), plain text or HTML.
2. **Quote-selector anchoring.** The W3C TextQuoteSelector (exact, prefix, suffix) over a rendered document, as Hypothesis does, with page number as a fallback for PDFs. This generalises the kit's line-based anchoring so annotations survive re-rendering and different copies of a text.
3. **Cross-document links (judas).** Joining two anchored highlights in different documents, in the same pair or across sessions; the insert variant; gutter connectors and the margin list.
4. **Threads.** Named, tagged sets of cross-document links, as a list and a graph, with export.

These change `~/Projects/bench-kit`, update its CHANGELOG, tag and push; then Glas moves its submodule pointer. Never edit `research/kit` in the bench. Bench-only code (the programme data, the Glas navigator, the worked example) lives in the bench's `research/js/` and `config.js`.

Coordination: other sessions may be working on SHRDLU, Spacewar! and the kit. `git fetch` the kit before changing it; do not pull or check out inside `~/Projects/spacewar`; work in a clone or worktree of the kit.

## 5. Exports

- A pair with its links and notes, as Word and Markdown (kit export).
- A **Glas view**: the two documents' highlighted passages typeset as facing columns with the judas inserts in place, for print or PDF, with a print stylesheet.
- Threads as Markdown with citations.
- Bibliography as CSL-JSON, RIS and BibTeX (kit paratext export).

## 6. The worked example

One real programme as the example data: 14 fortnightly sessions, October 2026 to June 2027, each pairing a technical AI document with critical texts. Full metadata is in Zotero, collection key AGTVX2RZ (the collection's name is not copied into the bench). Local copies are in `knowledge/sources/cpct-2026-27/`, named by session date.

**Session 1 built completely** as the demonstration: Song et al., "Evaluating Large Language Models in Scientific Discovery" (arXiv:2512.15567) in one column; the three critical texts (Sohn-Rethel, Benjamin and Lacis, Bloch) swappable in the other; a handful of example links and one example thread, so the bench opens on a working reading. Song et al. is on arXiv (open access, loaded from URL); the three critical texts are in copyright and load from the paratexts repository or a local file.

## 7. Copyright

Most critical texts are in copyright. Never commit a copyrighted PDF or its extracted text to the public repository. Open-access items (arXiv, open web) are linked or loaded from their URLs. Everything else loads from the private paratexts repository or a file the reader opens locally. The public repository holds metadata, the reader's own highlights, links and notes, and short quotations only.

## 8. Phasing

- **0. Skeleton.** New repo from the template. Strip to a clean shell: switch off genealogy, compare, functional, lenses, SWHIDs. No console errors. v0.1.0, with this PLAN.md and a CHANGELOG.
- **1. Documents and the Pair reader.** The data model files; document-as-build; the two-column reader rendering PDF, text and HTML; session and pair navigation. Session 1 documents load and swap.
- **2. Highlights and the judas.** Quote-selector anchoring with colour and tags; joining highlights across the gutter; the insert; the margin list of links to absent documents, with swap-in.
- **3. Threads and cross-session links.** Named, tagged threads; list and graph; linking across sessions.
- **4. Export, search, sharing.** Pair to Word and Markdown; the Glas view with its print stylesheet; threads to Markdown; bibliography to CSL-JSON, RIS, BibTeX; search across the programme; Hypothesis sharing with `bk:` and `glas:` tags.
- **5. The worked example and the writing.** Session 1 complete with example links and a thread; all 14 sessions as metadata; About, Help, tour and README, plain and factual, British spelling.

Phases 1 to 4 do the kit-first work in bench-kit, then move the Glas submodule pointer.

## 9. Repository and git

- Repository: `Computational-Hermeneutics/glas-bench` (exists, empty, currently **private**). If kept private, GitHub Pages needs a paid org plan; if made public, Pages serves at `https://computational-hermeneutics.github.io/glas-bench/research/` and fetches the public kit submodule on build.
- The repo already exists and is empty, so the template is not applied through **Use this template**. Instead the template's content is seeded into it: copy the template tree, add the kit as a submodule at `research/kit`, and push.
- Author: David M. Berry `<1429428+dmberry@users.noreply.github.com>`. No co-author trailer. `gh` CLI for GitHub.
- Version from 0.1.0, keep a CHANGELOG, set the `bench-date` meta in `research/index.html` on each release.
- Verify in a browser (`python3 -m http.server`, or the headless Chrome driver at `~/.claude/cdp-driver.js`) with no console errors before each release.
