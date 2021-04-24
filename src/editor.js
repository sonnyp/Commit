import Gtk from "gi://Gtk";
import Gspell from "gi://Gspell";

import validateCommitButton from "./validateCommitButton.js";

const HIGHLIGHT_BACKGROUND_TAG_NAME = "highlightBackground";

// Keep first line line-length validation in line with
// the original Komet behaviour for the time being.
// (See https://github.com/zorgiepoo/Komet/releases/tag/0.1)
const FIRST_LINE_CHARACTER_LIMIT = 69;

// Method courtesy: https://stackoverflow.com/questions/51396490/getting-a-string-length-that-contains-unicode-character-exceeding-0xffff#comment89813733_51396686
function unicodeLength(str) {
  return [...str].length;
}

export default function Editor({
  builder,
  commitButton,
  numberOfLinesInCommitComment,
}) {
  let lastActionWasSelectAll;

  // Save the number of lines in the commit message.
  let previousNumberOfLinesInCommitMessage = 1;

  const messageText = builder.get_object("messageText");

  const buffer = messageText.get_buffer();

  // Set up spell checking for the text view.
  // TODO: This is incorrectly documented. File an issue / blog.
  const gSpellTextView = Gspell.TextView.get_from_gtk_text_view(messageText);
  gSpellTextView.basic_setup();

  // Tag: highlight background.
  const highlightBackgroundTag = Gtk.TextTag.new(HIGHLIGHT_BACKGROUND_TAG_NAME);
  buffer.tag_table.add(highlightBackgroundTag);
  function setHighlightColour() {
    // Set the overflow text background highlight colour based on the
    // colour of the foreground text.

    // Colour shade guide for Minty Rose: https://www.color-hex.com/color/ffe4e1
    const darkForegroundHighlightColour = "#ffe4e1"; // minty rose
    const lightForegroundHighlightColour = "#4c4443"; // darker shade of minty rose
    let highlightColour;
    const fontColour = gSpellTextView
      .get_view()
      .get_style_context()
      .get_color(Gtk.StateFlags.NORMAL);

    // Luma calculation courtesy: https://stackoverflow.com/a/12043228
    const luma =
      0.2126 * fontColour.red +
      0.7152 * fontColour.green +
      0.0722 * fontColour.blue; // ITU-R BT.709

    // As get_color() returns r/g/b values between 0 and 1, the luma calculation will
    // return values between 0 and 1 also.
    if (luma > 0.5) {
      // The foreground is light, use darker shade of original highlight colour.
      highlightColour = lightForegroundHighlightColour;
    } else {
      // The foreground is dark, use original highlight colour.
      highlightColour = darkForegroundHighlightColour;
    }
    highlightBackgroundTag.background = highlightColour;
  }

  function highlightText() {
    // Check first line length and highlight characters beyond the limit.
    const text = buffer.text;
    const lines = text.split("\n");
    const firstLine = lines[0];
    const firstLineLength = unicodeLength(firstLine);

    // Get bounding iterators for the first line.
    const startOfTextIterator = buffer.get_start_iter();
    const endOfTextIterator = buffer.get_end_iter();
    const endOfFirstLineIterator = buffer.get_iter_at_offset(firstLineLength);

    // Start with a clean slate: remove any background highlighting on the
    // whole text. (We don’t do just the first line as someone might copy a
    // highlighted piece of the first line and paste it and we don’t want it
    // highlighted on subsequent lines if they do that.)
    buffer.remove_tag_by_name(
      HIGHLIGHT_BACKGROUND_TAG_NAME,
      startOfTextIterator,
      endOfTextIterator,
    );

    // Highlight the overflow area, if any.
    if (firstLineLength > FIRST_LINE_CHARACTER_LIMIT) {
      const startOfOverflowIterator = buffer.get_iter_at_offset(
        FIRST_LINE_CHARACTER_LIMIT,
      );
      buffer.apply_tag(
        highlightBackgroundTag,
        startOfOverflowIterator,
        endOfFirstLineIterator,
      );
    }
  }

  buffer.connect("changed", highlightText);
  buffer.connect("paste-done", highlightText);

  buffer.connect("end-user-action", () => {
    // Due to the non-editable region, the selection for a
    // Select All is not automatically cleared by the
    // system. So let’s detect it and clear it ourselves.
    if (lastActionWasSelectAll) {
      lastActionWasSelectAll = false;
      const cursorIterator = buffer.get_iter_at_offset(buffer.cursor_position);
      buffer.select_range(cursorIterator, cursorIterator);
    }

    // Take measurements
    let lines = buffer.text.split("\n");
    let firstLineLength = unicodeLength(lines[0]);
    let cursorPosition = buffer.cursor_position;
    let numberOfLinesInCommitMessage = lines.length + 1;

    if (
      /* in the correct place */
      cursorPosition === firstLineLength + 1 &&
      /* and the first line is empty */
      unicodeLength(lines[0].replace(/ /g, "")) === 0 &&
      /* and the second line is empty (to avoid
             https://source.small-tech.org/gnome/gnomit/gjs/issues/27) */
      unicodeLength(lines[1].replace(/ /g, "")) === 0 &&
      /* and person didn’t reach here by deleting existing content */
      numberOfLinesInCommitMessage > previousNumberOfLinesInCommitMessage
    ) {
      // Delete the newline
      buffer.backspace(
        /* iter: */ buffer.get_iter_at_offset(buffer.cursor_position),
        /* interactive: */ true,
        /* default_editable: */ true,
      );

      // Update measurements as the buffer has changed.
      lines = buffer.text.split("\n");
      firstLineLength = unicodeLength(lines[0]);
      cursorPosition = buffer.cursor_position;
      numberOfLinesInCommitMessage = lines.length + 1;
    }

    // Add an empty newline to separate the rest
    // of the commit message from the first (summary) line.
    if (
      /* in the correct place */
      cursorPosition === firstLineLength + 1 &&
      numberOfLinesInCommitMessage === numberOfLinesInCommitComment + 3 &&
      /* and person didn’t reach here by deleting existing content */
      numberOfLinesInCommitMessage > previousNumberOfLinesInCommitMessage
    ) {
      // Insert a second newline.
      const newline = "\n";
      buffer.insert_interactive_at_cursor(
        newline,
        newline.length,
        /* default editable */ true,
      );
    }

    // Save the number of lines in the commit message
    // for comparison in later frames.
    previousNumberOfLinesInCommitMessage = numberOfLinesInCommitMessage;

    // Validation: Enable Commit button only if commit message is not empty.
    validateCommitButton({
      buffer,
      numberOfLinesInCommitComment,
      commitButton,
    });
  });

  // Only select commit message body (not the comment) on select all.
  messageText.connect("select-all", (self, selected) => {
    if (!selected) return;

    // Carry this out on the next stack frame. The selected signal
    // gets called too early (you are not able to change the
    // selection at that time.) TODO: File bug.
    Promise.resolve().then(() => {
      lastActionWasSelectAll = true;
      // Redo the selection to limit it to the commit message
      // only (exclude the original commit comment).
      // Assumption: that the person has not added any comments
      // to their commit message themselves. But, I mean, come on!
      // buffer.place_cursor(buffer.get_start_iter())
      const mainCommitMessage = buffer.text.split("#")[0];
      const selectStartIterator = buffer.get_start_iter();
      const selectEndIterator = buffer.get_iter_at_offset(
        unicodeLength(mainCommitMessage),
      );
      // buffer.move_mark_by_name('selection_bound', selectEndIterator)
      buffer.select_range(selectStartIterator, selectEndIterator);
    });
  });
  return { messageText, buffer, setHighlightColour };
}
