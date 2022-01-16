import Gio from "gi://Gio";
import { parse, getType, hasCommitMessage } from "../src/scm.js";

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

is(hasCommitMessage("foo\n#hello", "#"), true);
is(hasCommitMessage("foo", "#"), true);
is(hasCommitMessage("# hello\nfoo", "#"), true);
is(hasCommitMessage("", "#"), false);
is(hasCommitMessage("# hello", "#"), false);
is(hasCommitMessage(" ", "#"), false);
is(hasCommitMessage(" \n#\n ", "#"), false);

function readTest(name) {
  const file = Gio.File.new_for_uri(import.meta.url);
  const data = file.get_parent().resolve_relative_path(`${name}`);
  const [, contents] = data.load_contents(null);
  return byteArray.toString(contents);
}

is(
  parse(readTest("addp-hunk-edit.diff"), "add -p").body,
  `# Manual hunk edit mode -- see bottom for a quick guide.
@@ -1,3 +1,4 @@
 d
 b
 c
+e`,
);
is(parse(readTest("addp-hunk-edit.diff"), "add -p").detail, undefined);
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
is(parse(readTest("addp-hunk-edit.diff"), "add -p").cursor_position, 0);

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
is(parse(readTest("MERGE_MSG"), "merge").cursor_position, 19);

is(
  parse(readTest("with-body/COMMIT_EDITMSG"), "commit").body,
  `Do something great with this commit message, perhaps tell of your adventures?

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
is(parse(readTest("with-body/COMMIT_EDITMSG"), "commit").cursor_position, 100);

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
is(
  parse(readTest("with-octohorpe/COMMIT_EDITMSG"), "commit").cursor_position,
  42,
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
is(parse(readTest("without-body/COMMIT_EDITMSG"), "commit").cursor_position, 0);

is(
  parse(readTest("rebase-merge/git-rebase-todo"), "rebase").body,
  `pick f353b3a this commit message is too long please fix me! wow so long commit message! damn!
pick 688174c Im ok`,
);
is(
  parse(readTest("rebase-merge/git-rebase-todo"), "rebase").detail,
  `d44e355..688174c → d44e355`,
);
is(
  parse(readTest("rebase-merge/git-rebase-todo"), "rebase").comment,
  `
# Rebase d44e355..688174c onto d44e355 (2 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup <commit> = like "squash", but discard this commit's log message
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
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
# However, if you remove everything, the rebase will be aborted.
#
`,
);
is(
  parse(readTest("rebase-merge/git-rebase-todo"), "rebase").cursor_position,
  0,
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
is(parse(readTest("TAG_EDITMSG"), "tag").cursor_position, 0);

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
  parse(readTest("hg-editor-without_body.commit.hg.txt"), "hg").cursor_position,
  0,
);

is(
  parse(readTest("hg-editor-with_body.commit.hg.txt"), "hg").body,
  `Foo this is great

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
is(
  parse(readTest("hg-editor-with_body.commit.hg.txt"), "hg").cursor_position,
  24,
);

is(
  parse(readTest("git-merge-squash/COMMIT_EDITMSG"), "commit").body,
  `Squashed commit of the following:

commit a0cd27f9567cfaf278b0af1e5f8e158397babb35
Author: Sonny Piers <sonny@fastmail.net>
Date:   Sat Jan 15 16:42:24 2022 +0100

    add b.txt

commit de9914cb5224550b41b6880da31a11a143be04b2
Author: Sonny Piers <sonny@fastmail.net>
Date:   Sat Jan 15 16:42:12 2022 +0100

    add foo to a.txt

commit 44b63dfb9196a4dbd71d027cad6575494472d970
Author: Sonny Piers <sonny@fastmail.net>
Date:   Sat Jan 15 16:42:00 2022 +0100

    add a.txt`,
);
is(
  parse(readTest("git-merge-squash/COMMIT_EDITMSG"), "commit").detail,
  undefined,
);
is(
  parse(readTest("git-merge-squash/COMMIT_EDITMSG"), "commit").comment,
  `
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch main
# Your branch is ahead of 'origin/main' by 1 commit.
#   (use "git push" to publish your local commits)
#
# Changes to be committed:
#	new file:   a.txt
#	new file:   b.txt
#
# Changes not staged for commit:
#	modified:   src/application.js
#
`,
);
is(
  parse(readTest("git-merge-squash/COMMIT_EDITMSG"), "commit").cursor_position,
  0,
);

is(
  parse(readTest("git-rebase-squash/COMMIT_EDITMSG"), "commit").body,
  `# This is a combination of 3 commits.
# This is the 1st commit message:

add a.txt

# This is the commit message #2:

add foo to a.txt

# This is the commit message #3:

add b.txt`,
);
is(
  parse(readTest("git-rebase-squash/COMMIT_EDITMSG"), "commit").detail,
  undefined,
);
is(
  parse(readTest("git-rebase-squash/COMMIT_EDITMSG"), "commit").comment,
  `
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# Date:      Sat Jan 15 16:42:00 2022 +0100
#
# interactive rebase in progress; onto aa57d6b
# Last commands done (4 commands done):
#    squash de9914c add foo to a.txt
#    squash a0cd27f add b.txt
# No commands remaining.
# You are currently rebasing branch 'test-squash' on 'aa57d6b'.
#
# Changes to be committed:
#	new file:   a.txt
#	new file:   b.txt
#
`,
);
is(
  parse(readTest("git-rebase-squash/COMMIT_EDITMSG"), "commit").cursor_position,
  0,
);
