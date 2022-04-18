import wrapbody from "./wrap.js";
import { gettext as _ } from "gettext";

const actions = {
  commit: _("Commit"),
  hg: _("Commit"),
  merge: _("Merge"),
  tag: _("Tag"),
  "add -p": _("Add"),
  rebase: _("Rebase"),
};

export function parse(text, type) {
  const action = actions[type] || _("Save");

  if (type === "config") {
    return {
      cursor_position: 0,
      action,
      body: text,
      comment: "",
      text,
      language: "ini",
    };
  }

  let detail;
  let comment_prefix = "#";
  let language = "git";

  if (type === "hg") {
    comment_prefix = "HG:";
    language = "hg";
  }

  const comment_separator = `\n${comment_prefix}`;

  // If this is a git add -p hunk edit message, then we cannot
  // split at the first comment as the message starts with a comment.
  // Remove that comment and instead display that info in the title bar.
  if (type === "add -p") {
    language = "diff";
  } else if (
    type === "commit" &&
    text.startsWith("Squashed commit of the following")
  ) {
    type = "git-merge-squash";
  } else if (
    type === "commit" &&
    text.startsWith("# This is a combination of")
  ) {
    type = "git-rebase-squash";
  }

  // Split the message into the commit body and comment
  const split = splitMessage(text, comment_prefix);
  const { body, comment, read_only_index } = split;

  // Trim any newlines there may be at the end of the commit body
  // body = body.trimEnd();

  const commentLines = comment.split("\n");
  if (type === "hg") {
    detail = getMercurialBranch(commentLines);
  } else if (type === "commit") {
    detail = getGitBranch(commentLines);
  } else if (type === "merge") {
    // Display the branch name
    const branch = getMergeBranch(body);
    if (branch) {
      detail = `branch ${branch}`;
    }
  } else if (type === "tag") {
    // Get the version number from the message
    detail = getGitTag(commentLines);
  } else if (type === "rebase") {
    const _detail = commentLines[1]?.replace("# ", "");
    const _detailChunks = _detail?.split(" ");
    if (_detailChunks?.length > 1) {
      detail = `${_detailChunks[1]} → ${_detailChunks[3]}`;
    }
  }

  let cursor_position = body.length;
  if (
    ["rebase", "add -p", "git-merge-squash", "git-rebase-squash"].includes(type)
  ) {
    cursor_position = 0;
  }

  const is_message = [
    "hg",
    "commit",
    "git-merge-squash",
    "git-rebase-squash",
    "merge",
    "tag",
  ].includes(type);

  return {
    body,
    comment,
    detail,
    comment_prefix,
    comment_separator,
    cursor_position,
    read_only_index,
    language,
    action,
    is_message,
    text,
  };
}

export function getType(filename) {
  // Git
  if (filename.endsWith("COMMIT_EDITMSG")) return "commit";
  if (filename.endsWith("MERGE_MSG")) return "merge";
  if (filename.endsWith("TAG_EDITMSG")) return "tag";
  if (filename.endsWith("addp-hunk-edit.diff")) return "add -p";
  if (filename.endsWith("git-rebase-todo")) return "rebase";
  if (filename.endsWith(".gitconfig")) return "config";
  if (filename.endsWith(".hgrc")) return "config";
  // Mercurial
  if (filename.endsWith(".commit.hg.txt")) return "hg";
  // Unknown
  return null;
}

export function getMercurialBranch(commentLines) {
  // Try to get the branch name via a method that relies on
  // positional aspect of the branch name so it should work with
  // other languages.
  const wordsOnBranchLine = commentLines[5]?.split(" ");
  return wordsOnBranchLine?.[wordsOnBranchLine.length - 1].split("'")[1];
}

export function getGitBranch(commentLines) {
  // Try to get the branch name via a method that relies on
  // positional aspect of the branch name so it should work with
  // other languages.
  const wordsOnBranchLine = commentLines[4]?.split(" ");
  return wordsOnBranchLine?.[wordsOnBranchLine.length - 1];
}

export function getGitTag(commentLines) {
  // Try to get the tag via a method that relies on
  // positional aspect of the branch name so it should work with
  // other languages.
  return commentLines[3]?.slice(1).trim();
}

function getMergeBranch(body) {
  return body.split("'")[1];
}

function splitMessage(text, comment_prefix) {
  const exp = new RegExp(
    `^${comment_prefix}.*\n${comment_prefix}.*\n${comment_prefix}`,
    "m",
  );

  const idx = text.search(exp);
  if (idx === -1) {
    return {
      body: text,
      comment: "",
      read_only_index: -1,
    };
  }

  const body = text.slice(0, idx).trim();

  const comment = "\n" + text.slice(idx);

  return { body, comment, read_only_index: idx };
}

export function isEmptyCommitMessage(text, comment_prefix) {
  return !text.split("\n").some((line) => {
    line = line.trim();
    return line.length > 0 && !line.startsWith(comment_prefix);
  });
}

export function format(text, length, comment_prefix) {
  const match = text.match(/^(.+)\n\n([\s\S]*)$/);
  if (!match) return text;
  const [, title, body] = match;
  const wrapped_body = wrapbody(body, length, comment_prefix);
  return title.trim() + `\n\n` + wrapped_body.trimStart();
}

export function stripComments(text, comment_prefix) {
  const exp = new RegExp(`\n${comment_prefix}.*$`, "mg");
  return text.replaceAll(exp, "");
}
