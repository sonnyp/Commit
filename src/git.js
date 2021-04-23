export function parse(commit, type) {
  let body;
  let detail;

  // If this is a git add -p hunk edit message, then we cannot
  // split at the first comment as the message starts with a comment.
  // Remove that comment and instead display that info in the title bar.
  if (type === "add -p") {
    detail = commit.substr(2 /* "# " */, commit.indexOf("\n") - 1).trim();
    commit = commit.substr(commit.indexOf("\n") + 1);
  }

  // Split the message into the commit body and comment
  const firstCommentIndex = commit.indexOf("\n#");
  body = commit.slice(0, firstCommentIndex).trimEnd();
  const comment = commit.slice(firstCommentIndex);

  // Trim any newlines there may be at the end of the commit body
  body = body.trimEnd();

  const commentLines = comment.split("\n");
  if (type === "commit") {
    // Try to get the branch name via a method that relies on
    // positional aspect of the branch name so it should work with
    // other languages.
    // FIXME: I guess we could bundle and use git instead see gitg for flatpak
    // or https://wiki.gnome.org/Projects/Libgit2-glib
    const wordsOnBranchLine = commentLines[4].split(" ");
    const branchName = wordsOnBranchLine[wordsOnBranchLine.length - 1];
    detail = branchName;
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
  if (filename.endsWith("COMMIT_EDITMSG")) return "commit";
  if (filename.endsWith("MERGE_MSG")) return "merge";
  if (filename.endsWith("TAG_EDITMSG")) return "tag";
  if (filename.endsWith("addp-hunk-edit.diff")) return "add -p";
  if (filename.endsWith("rebase-merge/git-rebase-todo")) return "rebase";
  return null;
}
