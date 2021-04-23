export function parse(commit, type) {
  let body;
  let detail;
  let comment_prefix = "#";

  if (type === "hg") {
    comment_prefix = "HG:";
  }

  const comment_separator = `\n${comment_prefix}`;

  // If this is a git add -p hunk edit message, then we cannot
  // split at the first comment as the message starts with a comment.
  // Remove that comment and instead display that info in the title bar.
  if (type === "add -p") {
    detail = commit.substr(2 /* "# " */, commit.indexOf("\n") - 1).trim();
    commit = commit.substr(commit.indexOf("\n") + 1);
  }

  // Split the message into the commit body and comment
  const firstCommentIndex = commit.indexOf(comment_separator);
  body = commit.slice(0, firstCommentIndex).trimEnd();
  const comment = commit.slice(firstCommentIndex);

  // Trim any newlines there may be at the end of the commit body
  body = body.trimEnd();

  const commentLines = comment.split("\n");
  if (type === "hg") {
    detail = getMercurialBranch(commentLines);
  } else if (type === "commit") {
    detail = getGitBranch(commentLines);
  } else if (type === "merge") {
    // Display the branch name
    detail = `branch ${body.split("'")[1]}`;
  } else if (type === "tag") {
    // Get the version number from the message
    const version = commentLines[3].slice(1).trim();
    detail = version;
  } else if (type === "rebase") {
    const _detail = commentLines[1].replace("# ", "");
    const _detailChunks = _detail.split(" ");
    detail = `${_detailChunks[1]} → ${_detailChunks[3]}`;
  }

  return { body, comment, detail };
}

export function getType(filename) {
  // Git
  if (filename.endsWith("COMMIT_EDITMSG")) return "commit";
  if (filename.endsWith("MERGE_MSG")) return "merge";
  if (filename.endsWith("TAG_EDITMSG")) return "tag";
  if (filename.endsWith("addp-hunk-edit.diff")) return "add -p";
  if (filename.endsWith("rebase-merge/git-rebase-todo")) return "rebase";
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
