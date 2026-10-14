# Glas Bench

**Author:** David M. Berry
**Version:** 0.1.0 (bench-kit 0.60.0)

A bench for reading two documents side by side, in two columns of equal standing, after Jacques Derrida's *Glas* (1974; English translation by John P. Leavey Jr. and Richard Rand, University of Nebraska Press, 1986). Neither column is the commentary on the other. Its case is a technical document on AI set beside a text from the critical tradition, read against each other. Links across the gutter, which Derrida calls *judas* (the spy-hole in a door), are the bench's main data.

Glas Bench is one of the [critical code studies](https://github.com/critical-code-studies) research benches, built on the shared modules of [bench-kit](https://github.com/critical-code-studies/bench-kit). It is a static site: plain HTML, CSS and JavaScript, no build step and nothing to install.

## State

This is an early version. The skeleton is in place: the bench loads on bench-kit with the reading, findings, notes and paratexts views, and the genealogy half of the kit (versions, comparison, descent) switched off. The two-column reader, highlights, the judas links and threads are built in the phases set out in [`PLAN.md`](PLAN.md).

## What it will do

- Read two documents at once, a document in each column, each chosen from a session's pool. Swap sides, and swap a document in or out while keeping the other in place.
- Highlight passages in either column, anchored by quoted text so they survive re-rendering and different copies.
- Join a passage in one column to a passage in the other, with a note: the judas. Links can also be made as an insert, a passage from one column shown inside the other.
- Follow a thread of links across the sessions of a reading programme, as a list or a graph.
- Export a pair, a thread or the bibliography, and a Glas view of the two documents as facing columns for print.

The bench does not score, rank or suggest matches between the columns. Every link is made by a reader.

## Running it locally

The bench reads its sources over HTTP, so serve the folder rather than opening the file:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/research/`.

## The kit

`research/kit` is a git submodule of bench-kit, pinned at v0.60.0. Clone with the kit:

```
git clone --recurse-submodules https://github.com/Computational-Hermeneutics/glas-bench
```

To take a newer kit: `git submodule update --remote research/kit`, test, and commit the new pointer. Changes to the shared modules are made in bench-kit itself, not inside `research/kit`.

## Copyright

Most of the critical texts in the example programme are in copyright. No copyrighted PDF or its extracted text is committed to this repository. Open-access items (arXiv papers, open web pages) are linked or loaded from their URLs. Everything else loads from a private paratexts repository or a file the reader opens locally. This repository holds the programme's metadata, the reader's own highlights, links and notes, and short quotations only.

## Licence

GNU General Public License v3.0: see [`LICENSE`](LICENSE). Glas Bench is a work based on bench-template and is distributed under the same licence. The kit in `research/kit` is under the same licence.
