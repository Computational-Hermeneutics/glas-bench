/*
 * read.js - Read: bench-kit's Read view (kit/read.js), with the group's annotations, a search,
 * the file picker, the filters and the export. A bench gives it what is its own: the
 * highlighting for its language (hl), how its files are labelled, a Key, the pop-up on a name,
 * the words a line assembled to, the marks on its repairs (the hooks are listed in
 * kit/read.js). This example gives only the file picker's memory: the kit's highlighting marks
 * numbers and the comment, by SW.BENCH.comment.
 */
(function (root) {
  'use strict';
  root.SW.readView({ files: { remember: true } });
})(this);
