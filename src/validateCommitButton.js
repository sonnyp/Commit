// Validate the buffer and enable/disable the commit button accordingly.
export default function validateCommitButton({
  buffer,
  numberOfLinesInCommitComment,
  commitButton,
}) {
  // Take measurements.
  const lines = buffer.text.split("\n");
  const numberOfLinesInCommitMessage = lines.length + 1;

  // Enable the Commit button only if the commit message is not empty.
  const numberOfLinesInMessageExcludingComments =
    numberOfLinesInCommitMessage - numberOfLinesInCommitComment;
  let commitMessageExcludingComments = "";
  for (let i = 0; i < numberOfLinesInMessageExcludingComments; i++) {
    commitMessageExcludingComments += lines[i];
  }
  commitMessageExcludingComments = commitMessageExcludingComments.replace(
    / /g,
    "",
  );
  const commitMessageIsEmpty = commitMessageExcludingComments.length === 0;
  commitButton.set_sensitive(!commitMessageIsEmpty);
}
