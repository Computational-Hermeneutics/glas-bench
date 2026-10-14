# Glas Bench

**Open the bench:** https://computational-hermeneutics.github.io/glas-bench/

**Author:** David M. Berry
**Version:** 0.2.5 (on bench-kit 0.60.0; the first instance of hermes-kit, in preparation)

A bench for reading two documents side by side, in two columns of equal standing, after Jacques Derrida's *Glas* (1974; English translation by John P. Leavey Jr. and Richard Rand, University of Nebraska Press, 1986). Neither column is the commentary on the other. Its case is a technical document on AI set beside a text from the critical tradition, read against each other. Links across the gutter, which Derrida calls *judas* (the spy-hole in a door), are the bench's main data.

It is a static site, plain HTML, CSS and JavaScript, with no build step and nothing to install. Glas Bench is the first instance of [hermes-kit](https://github.com/Computational-Hermeneutics/hermes-kit), a kit for building comparative hermeneutic tools, which is being drawn out of it (see [`PLAN.md`](PLAN.md)). For now it runs on [bench-kit](https://github.com/critical-code-studies/bench-kit).

## What it does now

- Reads two documents at once, a document in each column, each chosen from a session's pool, with its own zoom and scroll. Swap sides, or swap one document while keeping the other in place.
- Highlights passages in either column, in a colour, with tags and a note, anchored by quoted text so a highlight survives the page being drawn again and follows its document between the columns.
- Joins a passage in one column to a passage in the other with a note, the judas, drawn as a curve across the gutter.
- Inserts a passage from one column into the other, shown as a card at a chosen point.
- Lists links to documents not now shown, a click away from swapping them in.

Highlights and links are kept in the reader's own browser. Nothing is sent anywhere.

## What comes next

Threads of links followed across the sessions of a reading programme, as a list or a graph; a Sessions view; search; export of a pair, a thread or the bibliography; and a Glas view of two documents as facing columns for print. The phases are set out in [`PLAN.md`](PLAN.md).

The bench does not score, rank or suggest matches between the columns. Every link is made by a reader.

## Running it locally

The bench reads its sources over HTTP, so serve the folder rather than opening the file. From the repository's root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## The kit

`kit/` is a git submodule of bench-kit, pinned at v0.60.0. Clone with the kit:

```
git clone --recurse-submodules https://github.com/Computational-Hermeneutics/glas-bench
```

To take a newer kit: `git submodule update --remote kit`, test, and commit the new pointer. Changes to the shared modules are made in the kit itself, not inside `kit/`.

## Licence

GNU General Public License v3.0: see [`LICENSE`](LICENSE). Glas Bench is a work based on bench-template and is distributed under the same licence. The kit in `kit/` is under the same licence.
