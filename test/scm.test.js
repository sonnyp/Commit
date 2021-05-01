import Gio from "gi://Gio";
import { parse, getType } from "../src/scm.js";

const { byteArray } = imports;

export class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = "AssertionError";
  }
}

export function assert(value, message = "") {
  if (!value) throw new AssertionError(message);
}

export function is(actual, expected, message) {
  if (!Object.is(actual, expected)) {
    throw new AssertionError(
      message || `Expected "${actual}" to be "${expected}".`,
    );
  }
}

is(getType("/foo/bar/addp-hunk-edit.diff"), "add -p");
is(getType("/foo/bar/COMMIT_EDITMSG"), "commit");
is(getType("/foo/bar/rebase-merge/git-rebase-todo"), "rebase");
is(getType("/foo/bar/MERGE_MSG"), "merge");
is(getType("/foo/bar/TAG_EDITMSG"), "tag");
is(getType("/foo/bar/hg-editor-foo.commit.hg.txt"), "hg");

function readTest(name) {
  const file = Gio.File.new_for_uri(import.meta.url);
  const data = file.get_parent().resolve_relative_path(`${name}`);
  const [, contents] = data.load_contents(null);
  return byteArray.toString(contents);
}

is(
  parse(readTest("addp-hunk-edit.diff"), "add -p").body,
  `@@ -1,3 +1,4 @@
 d
 b
 c
+e`,
);
is(
  parse(readTest("addp-hunk-edit.diff"), "add -p").detail,
  `Manual hunk edit mode -- see bottom for a quick guide.`,
);
is(
  parse(readTest("addp-hunk-edit.diff"), "add -p").comment,
  `
# ---
# To remove '-' lines, make them ' ' lines (context).
# To remove '+' lines, delete them.
# Lines starting with # will be removed.
#
# If the patch applies cleanly, the edited hunk will immediately be
# marked for staging.
# If it does not apply cleanly, you will be given an opportunity to
# edit again.  If all lines of the hunk are removed, then the edit is
# aborted and the hunk is left unchanged.`,
);
is(parse(readTest("addp-hunk-edit.diff"), "add -p").comment_prefix, "#");
is(parse(readTest("addp-hunk-edit.diff"), "add -p").comment_separator, "\n#");

is(parse(readTest("MERGE_MSG"), "merge").body, `Merge branch 'test'`);
is(parse(readTest("MERGE_MSG"), "merge").detail, `branch test`);
is(
  parse(readTest("MERGE_MSG"), "merge").comment,
  `
# Please enter a commit message to explain why this merge is necessary,
# especially if it merges an updated upstream into a topic branch.
#
# Lines starting with '#' will be ignored, and an empty message aborts
# the commit.`,
);

is(
  parse(readTest("with-body/COMMIT_EDITMSG"), "commit").body,
  `Merge branch 'master' of source.small-tech.org:gnome/gnomit

This is another line.`,
);
is(parse(readTest("with-body/COMMIT_EDITMSG"), "commit").detail, `master`);
is(
  parse(readTest("with-body/COMMIT_EDITMSG"), "commit").comment,
  `
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch master
# Your branch is up-to-date with 'origin/master'.
#
# Changes to be committed:
#	modified:   README.md
#`,
);

is(
  parse(readTest("with-octohorpe/COMMIT_EDITMSG"), "commit").body,
  `Implement awesome new feature

Closes #123`,
);
is(parse(readTest("with-octohorpe/COMMIT_EDITMSG"), "commit").detail, `master`);
is(
  parse(readTest("with-octohorpe/COMMIT_EDITMSG"), "commit").comment,
  `
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch master
#
# Initial commit
#
# Changes to be committed:
#	new file:   a.txt
#`,
);

is(parse(readTest("without-body/COMMIT_EDITMSG"), "commit").body, ``);
is(parse(readTest("without-body/COMMIT_EDITMSG"), "commit").detail, `master`);
is(
  parse(readTest("without-body/COMMIT_EDITMSG"), "commit").comment,
  `
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch master
#
# Initial commit
#
# Changes to be committed:
#	new file:   a.txt
#`,
);

is(
  parse(readTest("rebase-merge/git-rebase-todo"), "rebase").body,
  `pick a7ad46b Latest changes`,
);
is(
  parse(readTest("rebase-merge/git-rebase-todo"), "rebase").detail,
  `df3db1d..a7ad46b → df3db1d`,
);
is(
  parse(readTest("rebase-merge/git-rebase-todo"), "rebase").comment,
  `
# Rebase df3db1d..a7ad46b onto df3db1d (1 command)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]
# .       create a merge commit using the original merge commit's
# .       message (or the oneline, if no original merge commit was
# .       specified). Use -c <commit> to reword the commit message.
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
#	However, if you remove everything, the rebase will be aborted.
#
#
# Note that empty commits are commented out`,
);

is(parse(readTest("TAG_EDITMSG"), "tag").body, ``);
is(parse(readTest("TAG_EDITMSG"), "tag").detail, `1.0.0`);
is(
  parse(readTest("TAG_EDITMSG"), "tag").comment,
  `
#
# Write a message for tag:
#   1.0.0
# Lines starting with '#' will be ignored.`,
);

is(parse(readTest("hg-editor-without_body.commit.hg.txt"), "hg").body, ``);
is(
  parse(readTest("hg-editor-without_body.commit.hg.txt"), "hg").detail,
  "default",
);
is(
  parse(readTest("hg-editor-without_body.commit.hg.txt"), "hg").comment,
  `
HG: Enter commit message.  Lines beginning with 'HG:' are removed.
HG: Leave message empty to abort commit.
HG: --
HG: user: Sonny Piers <sonny@fastmail.net>
HG: branch 'default'
HG: added foobar
`,
);
is(
  parse(readTest("hg-editor-without_body.commit.hg.txt"), "hg").comment_prefix,
  "HG:",
);
is(
  parse(readTest("hg-editor-without_body.commit.hg.txt"), "hg")
    .comment_separator,
  "\nHG:",
);

is(
  parse(readTest("hg-editor-with_body.commit.hg.txt"), "hg").body,
  `foo this is great

hello`,
);
is(
  parse(readTest("hg-editor-with_body.commit.hg.txt"), "hg").detail,
  "default",
);
is(
  parse(readTest("hg-editor-with_body.commit.hg.txt"), "hg").comment,
  `
HG: Enter commit message.  Lines beginning with 'HG:' are removed.
HG: Leave message empty to abort commit.
HG: --
HG: user: Sonny Piers <sonny@fastmail.net>
HG: branch 'default'
HG: added foobar
`,
);
