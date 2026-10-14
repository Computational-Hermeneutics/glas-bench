# Glas Bench: handoff and current state

Written 2026-10-14 to continue the build in another session (including on cloud credits).
Read this with [`PLAN.md`](PLAN.md) (the data model and phasing) and `CHANGELOG.md`.

## What it is

A static research bench that reads two documents side by side, a column each, after Derrida's
*Glas*. The case: a technical document on AI against a text from the critical tradition, read
against each other. Links across the gutter (the *judas*) are the main data. Built on bench-kit
(`kit`, a submodule pinned at v0.60.0). No build step.

## Where the build is now

- **Phase 0 (skeleton): done.** Rebranded from bench-template to Glas Bench, dark/gold theme,
  genealogy half of the kit switched off (Compare, Genealogy, Text lenses, Functional, SWHIDs)
  through `js/config.js` and `js/main.js`, kit left unchanged.
- **Phase 1 (two-column Pair reader): working.** The **Pair** view renders two PDFs side by
  side with PDF.js and a selectable text layer, lazily by page, each column with its own
  document picker, zoom and scroll; Swap sides. Session 1 opens on Song et al. (technical, left)
  against Sohn-Rethel (critical, right); the other two critical texts swap into the right column.
  Verified: 8 canvases rendered, 661 text spans, text layer selectable.

- **Phase 2 (highlights and the judas): done** (0.2.2 to 0.2.4). `js/highlights.js`: select text
  to highlight it (colour, tags, note), anchored by a W3C TextQuoteSelector with page fallback,
  keyed to the document, stored under `glasbench.highlights`. `js/links.js`: the judas, a join
  (two highlights across the gutter, drawn as a curve that tracks scroll and zoom) and an insert
  (a passage shown as a card at a chosen point in the other column), stored under
  `glasbench.links`; "Links elsewhere" lists links to documents not shown, with swap-in.

**Direction (2026-10-14): hermes-kit.** Glas is the first instance of a new, fully standalone
kit, `Computational-Hermeneutics/hermes-kit` (currently empty, GPL-3), for comparative
hermeneutic tools. Finish Phase 3 here, then extract the reusable modules into hermes-kit and swap
the submodule. (The bench already sits at the repo root, since 0.2.5.) See PLAN.md, Direction. Note: a
cloud session needs the Claude GitHub App installed on hermes-kit to push to it.

Not yet built (next): threads and cross-session links, the Sessions and Threads views, search,
exports and the Glas print view. See **What is next** below.

**Verifying headless in a cloud session:** serve from the repo root. The cloud
network policy blocks cdnjs, so feed Playwright the PDF.js 3.11.174 build from npm
(`npm pack pdfjs-dist@3.11.174`) by routing the cdnjs URLs to it.

## Run it

```
cd glas-bench
python3 -m http.server 8000
# open http://localhost:8000/   (opens on the Pair view)
# live: https://computational-hermeneutics.github.io/glas-bench/
```

Clone fresh (the kit is a submodule, the source PDFs are committed in this private repo):

```
git clone --recurse-submodules https://github.com/Computational-Hermeneutics/glas-bench
```

In a cloud session the committed `lib/` PDFs travel with the repo, so the Pair reader
renders with no token and no extra setup.

## Repository

- **Computational-Hermeneutics/glas-bench**, private. Author commits as
  `David M. Berry <1429428+dmberry@users.noreply.github.com>`, no co-author trailer, `gh` CLI.
- Kit submodule at `kit`, pinned v0.60.0 (`159f252`). Never edit files under
  `kit`; kit changes go to bench-kit itself (see kit-first below).
- Public, served on GitHub Pages by `.github/workflows/pages.yml` (Pages source: GitHub Actions).
  The bench sits at the repository root (moved from `research/` in 0.2.5).

## How the pieces fit

- **Document = build.** A document maps onto the kit's idea of a build (one text fetched). The
  Pair reader (`js/pair.js`) drives PDF.js itself and does not use the kit's version
  machinery; the kit's version picker in the top bar is hidden by CSS.
- **Views** (`js/main.js`, `SW.BENCH.shell.views`): `pair` (default), `read` (one document, the
  kit's, still on the placeholder example), `about`, `findings`, `notes`, `paratexts`. The
  opening tab is forced to `pair` in the `query` hook.
- **Source resolution** (`pair.js` `sources()`), in order:
  1. The kit's **paratext library** (the private paratexts repo it reads with each member's
     token) when a token is set and the document has a `paratext` P-code. This is the designed
     home; `glas_paratexts` is not populated yet.
  2. **`lib/<id>.pdf`**, a copy committed in this private repo, loaded same-origin. This
     is what renders today in dev and in the cloud.
  3. The open **URL** (arXiv) for open items. Note: arXiv sends no CORS header, so an in-browser
     fetch of the arXiv PDF is blocked; `lib/` is why Song renders. A proxy or the library is
     needed for URL loading in production.

## The source PDFs (`lib/`)

This is an academic research space, so the source PDFs are committed here
(David's instruction, 2026-10-14). They are the render copies for the bench. The work-canonical
originals are untouched in `~/Library/CloudStorage/Dropbox/WritingLab/knowledge/sources/cpct-2026-27/`.

Shrinking before committing (method: `~/.local/bin/shrinkpdf`, Ghostscript ebook/150 dpi;
ELIZA's cautions applied): verify page count before trusting a shrunk copy; only shrink large
born-digital files; keep originals for the work. Only Song was worth it here (17 MB to 0.95 MB,
63 pages confirmed); Bloch (a scan), Benjamin and Sohn-Rethel were kept as held. `lib/` is 11 MB.

Files, by document id:
- `song-2025-sci-discovery.pdf` (technical; Zotero CQSC87AI; arXiv:2512.15567)
- `sohn-rethel-broken-down.pdf` (critical; Zotero WIFZBVLT)
- `benjamin-lacis-naples.pdf` (critical; Zotero ZJPWVK44)
- `bloch-italy-porosity.pdf` (critical; Zotero CIRZXCPI)

## The data model (`js/programme.js`)

`SW.PROGRAMME` holds `docs` (keyed by id, each with role technical/critical, CSL-JSON, a Zotero
key, and a source) and `sessions` (14 fortnightly dates, 14 Oct 2026 to 2 Jun 2027). Session 1
is built in full (pool of four, open pairing Song against Sohn-Rethel). Sessions 2 to 14 carry
their dates with empty pools, to be filled. Full metadata for the whole programme is in Zotero,
collection key **AGTVX2RZ** (do not copy the collection's name into the bench).

## What is next (from PLAN.md)

Prototype in the bench first (David's choice), then promote the reusable parts to bench-kit.

- **Phase 2: highlights and the judas.** Select text in a column to highlight it (colour, tags),
  anchored by the W3C TextQuoteSelector (exact/prefix/suffix) with page fallback, over the PDF
  text layer. Join two highlights across the gutter with a note (the judas), and the insert
  variant. Draw connectors across the gutter; list links to documents not shown in the margin,
  one click to swap that document in.
- **Phase 3: threads and cross-session links.** Named, tagged sets of links; a list and a graph
  across sessions; linking across sessions.
- **Phase 4: export, search, sharing.** Pair to Word/Markdown; the **Glas view** (facing columns
  with inserts, a print stylesheet); threads to Markdown; bibliography to CSL-JSON, RIS, BibTeX;
  search across the programme; Hypothesis sharing with `bk:` + `glas:` tags.
- **Phase 5: the worked example and the writing.** Session 1 example links and one thread; all 14
  sessions' pools as metadata; the other documents into `lib/` (and/or the `glas_paratexts`
  library); About, Help, tour and README (plain, British spelling); the bench icon
  (`img/icon.svg` is still the template's).

**Kit-first candidates** to promote to bench-kit once settled: the two-column reader, the
quote-selector anchoring for PDFs, the cross-document (judas) links, and threads. `git fetch`
the kit before changing it; do not pull or check out inside `~/Projects/spacewar`; work in a
clone or worktree of bench-kit. Update its CHANGELOG, tag, push, then move the submodule pointer.

## Loose ends and notes

- The genealogy-half kit scripts are still loaded in `index.html` (harmless, views off);
  trim them when the Pair view fully replaces Read.
- `js/versions.js`, `js/core.js`, `source/` and the Read tab still carry the template's Python
  placeholder. Remove or repurpose when Read is reworked for single documents.
- The welcome tour, About box `inside`/`sources`, and `annoHelp` still read for the old template
  in places; rewrite for Glas in Phase 5.
- `?v=` on scripts/stylesheets is at `0.2.1`; raise it by 0.0.1 on each change so browsers fetch
  fresh copies, and set `bench-date` in `index.html`.
- `glas_paratexts` (the kit's separate paratext library) is referenced in `config.js` but not
  created or populated. The reader already supports it; populating it is optional given `lib/`.

## Key files

```
PLAN.md                     the plan and data model (approved)
HANDOFF.md                  this file
README.md                   plain project README
index.html         the bench: tabs, views, script load order
js/config.js       bench identity and kit settings (genealogy half off)
js/main.js         views + the query hook that opens on Pair
js/programme.js    the programme: documents and sessions (Session 1 full)
js/pair.js         the Pair view: two-column PDF reader, source resolution
css/research.css   Glas gold theme tokens + Pair layout + PDF text-layer CSS
lib/               committed source PDFs (academic research space)
kit/               bench-kit submodule (v0.60.0) - do not edit
```
