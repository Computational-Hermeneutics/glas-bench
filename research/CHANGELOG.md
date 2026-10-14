# Changelog: Glas Bench

Changes to the bench (`research/`). The bench keeps its own version numbers, raised by 0.0.1 with each change (the `?v=` on every script and stylesheet in `index.html`); this file records the versions published, newest first.

## 0.2.1 (2026-10-14)

- Phase 1: the Pair view. Two documents side by side, a column each, rendered with PDF.js and a selectable text layer, lazily by page; each column has its own document picker, zoom and scroll; Swap sides. The programme and its sessions are data (`js/programme.js`), with Session 1 built in full (Song et al. against Sohn-Rethel, Benjamin & Lacis, Bloch) and the 14 session dates. A document's PDF is drawn from the paratext library when a token is set, from a copy committed under `research/lib/` otherwise (this private research space holds the shrunk source PDFs), or from an open URL. Pair is the opening view; Read is kept for one document on its own.

## 0.1.0 (2026-10-14)

- Started from bench-template 0.1.82 on bench-kit 0.60.0. The skeleton: the frame, Read, About, Findings, My notes and Paratexts. The genealogy half of the kit is switched off (Text lenses, Functional overview, Compare, Genealogy, SWHIDs), through `js/config.js` and `js/main.js`, with the kit left unchanged. Rebranded to Glas Bench, with a dark and gold theme. The placeholder example under `source/` is kept until the two-column Pair reader lands. The plan and data model are in `PLAN.md`.
