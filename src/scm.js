import wordwrap from "./wordwrap.js";

export function parse(commit, type) {
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
    commit.startsWith("Squashed commit of the following")
  ) {
    type = "git-merge-squash";
  } else if (
    type === "commit" &&
    commit.startsWith("# This is a combination of")
  ) {
    type = "git-rebase-squash";
  }

  // Split the message into the commit body and comment
  const split = splitMessage(commit, comment_prefix);
  let { body } = split;
  const { comment, read_only_index } = split;

  // Trim any newlines there may be at the end of the commit body
  // body = body.trimEnd();

  const commentLines = comment.split("\n");
  let cursor_position = body.length;
  if (type === "hg") {
    detail = getMercurialBranch(commentLines);
  } else if (type === "commit") {
    detail = getGitBranch(commentLines);
  } else if (type === "merge") {
    // Display the branch name
    detail = `branch ${body.split("'")[1]}`;
  } else if (type === "tag") {
    // Get the version number from the message
    detail = getGitTag(commentLines);
  } else if (type === "rebase") {
    const _detail = commentLines[1].replace("# ", "");
    const _detailChunks = _detail.split(" ");
    detail = `${_detailChunks[1]} → ${_detailChunks[3]}`;
    cursor_position = 0;
  } else if (
    ["add -p", "git-merge-squash", "git-rebase-squash"].includes(type)
  ) {
    cursor_position = 0;
  }

  let capitalize = false;
  if (["hg", "commit", "merge", "tag"].includes(type)) {
    body = body.charAt(0).toUpperCase() + body.slice(1);
    capitalize = true;
  }

  return {
    body,
    comment,
    detail,
    comment_prefix,
    comment_separator,
    cursor_position,
    read_only_index,
    language,
    capitalize,
    wrap: [
      "hg",
      "commit",
      "git-merge-squash",
      "git-rebase-squash",
      "merge",
    ].includes(type),
  };
}

export function getType(filename) {
  // Git
  if (filename.endsWith("COMMIT_EDITMSG")) return "commit";
  if (filename.endsWith("MERGE_MSG")) return "merge";
  if (filename.endsWith("TAG_EDITMSG")) return "tag";
  if (filename.endsWith("addp-hunk-edit.diff")) return "add -p";
  if (filename.endsWith("git-rebase-todo")) return "rebase";
  // Mercurial
  if (filename.endsWith(".commit.hg.txt")) return "hg";
  // Unknown
  return null;
}

export function getMercurialBranch(commentLines) {
  // Try to get the branch name via a method that relies on
  // positional aspect of the branch name so it should work with
  // other languages.
  const wordsOnBranchLine = commentLines[5].split(" ");
  return wordsOnBranchLine[wordsOnBranchLine.length - 1].split("'")[1];
}

export function getGitBranch(commentLines) {
  // Try to get the branch name via a method that relies on
  // positional aspect of the branch name so it should work with
  // other languages.
  const wordsOnBranchLine = commentLines[4].split(" ");
  return wordsOnBranchLine[wordsOnBranchLine.length - 1];
}

export function getGitTag(commentLines) {
  // Try to get the tag via a method that relies on
  // positional aspect of the branch name so it should work with
  // other languages.
  return commentLines[3]?.slice(1).trim();
}

function splitMessage(commit, comment_prefix) {
  const exp = new RegExp(
    `^${comment_prefix}.*\n${comment_prefix}.*\n${comment_prefix}`,
    "m",
  );

  const idx = commit.search(exp);
  if (idx === -1) {
    return {
      body: commit,
      comment: "",
    };
  }

  const body = commit.slice(0, idx).trim();

  const comment = "\n" + commit.slice(idx);

  return { body, comment, read_only_index: idx };
}

export function hasCommitMessage(str, comment_prefix) {
  return str.split("\n").some((line) => {
    line = line.trim();
    return line.length > 0 && !line.startsWith(comment_prefix);
  });
}

export function wrap(text, length = 75) {
  const [, title, body] = text.match(/^(.+)\n\n([\s\S]*)$/);
  return title + `\n\n` + wordwrap(0, length, { mode: "hard" })(body);
}
