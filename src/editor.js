import Gtk from "gi://Gtk";
import Gio from "gi://Gio";
import GtkSource from "gi://GtkSource";

import CommitEditor from "./CommitEditor.js";

import { settings } from "./util.js";
import { isEmptyCommitMessage } from "./scm.js";

const HIGHLIGHT_BACKGROUND_TAG_NAME = "highlightBackground";

export default function editor({ builder, button_save, parsed }) {
  const {
    body,
    comment,
    cursor_position,
    read_only_index,
    language,
    comment_prefix,
    is_message,
  } = parsed;

  const overlay = builder.get_object("overlay");
  const widget = new CommitEditor({ language });
  overlay.set_child(widget);
  const source_view = widget.view;

  source_view.set_show_right_margin(is_message);

  settings.bind(
    "body-length-wrap",
    widget,
    "wrap-width-request",
    Gio.SettingsBindFlags.DEFAULT,
  );

  const buffer = source_view.get_buffer();

  // Tag: highlight background.
  const highlightBackgroundTag = Gtk.TextTag.new(HIGHLIGHT_BACKGROUND_TAG_NAME);
  // Works well with light and dark mode
  const [, color] = source_view.get_style_context().lookup_color("yellow_1");
  highlightBackgroundTag.background = color.to_string();
  buffer.tag_table.add(highlightBackgroundTag);

  buffer.connect("changed", () => {
    const is_empty = isEmptyCommitMessage(buffer.text, comment_prefix);
    button_save.set_sensitive(!is_empty);

    if (!is_message) return;

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

    const title_length_hint = settings.get_int("title-length-hint");
    // Highlight the overflow area, if any.
    if (firstLineLength > title_length_hint) {
      const startOfOverflowIterator =
        buffer.get_iter_at_offset(title_length_hint);
      buffer.apply_tag(
        highlightBackgroundTag,
        startOfOverflowIterator,
        endOfFirstLineIterator,
      );
    }
  });

  // This is not user undo-able
  // if it was we could wrap it between
  // buffer.begin_irreversible_action();
  // buffer.end_irreversible_action();
  buffer.set_text(`${body}\n${comment}`, -1);

  buffer.place_cursor(buffer.get_iter_at_offset(cursor_position));

  if (read_only_index > -1) {
    markCommentReadonly({
      buffer,
      read_only_index,
    });
  }

  if (is_message) {
    const commentLines = comment.split("\n");
    const numberOfLinesInComment = commentLines.length;

    // Save the number of lines in the commit message.
    let previousNumberOfLinesInCommitMessage = 1;

    const capitalizer = Capitalizer();

    buffer.connect("end-user-action", () => {
      let { cursor_position } = buffer;

      capitalizer(buffer, cursor_position);

      // Take measurements
      let lines = buffer.text.split("\n");
      let firstLineLength = unicodeLength(lines[0]);
      let numberOfLinesInCommitMessage = lines.length + 1;

      if (
        /* in the correct place */
        cursor_position === firstLineLength + 1 &&
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
        cursor_position = buffer.cursor_position;
        numberOfLinesInCommitMessage = lines.length + 1;
      }

      // Add an empty newline to separate the rest
      // of the commit message from the first (summary) line.
      if (
        /* in the correct place */
        cursor_position === firstLineLength + 1 &&
        numberOfLinesInCommitMessage === numberOfLinesInComment + 3 &&
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
    });
  }

  // Only select commit message body (not the comment) on select all.
  source_view.connect_after("select-all", (self, selected) => {
    if (!selected) return;

    // Redo the selection to limit it to the commit message
    // only (exclude the original commit comment).
    const mark = buffer.get_mark("comment");
    if (mark) {
      const selectStartIterator = buffer.get_start_iter();
      const selectEndIterator = buffer.get_iter_at_mark(mark);
      // buffer.move_mark_by_name('selection_bound', selectEndIterator)
      buffer.select_range(selectStartIterator, selectEndIterator);
    }

    return false;
  });

  return { source_view, buffer, editor: widget };
}

// Method courtesy: https://stackoverflow.com/questions/51396490/getting-a-string-length-that-contains-unicode-character-exceeding-0xffff#comment89813733_51396686
function unicodeLength(str) {
  return [...str].length;
}

const readonlyTag = Gtk.TextTag.new("readonly");
readonlyTag.editable = false;
function markCommentReadonly({ buffer, read_only_index }) {
  buffer.tag_table.add(readonlyTag);

  const endOfText = buffer.get_end_iter();
  const comment_iter = buffer.get_iter_at_offset(read_only_index - 1);

  buffer.apply_tag(readonlyTag, comment_iter, endOfText);

  // This is used for select-all
  buffer.create_mark("comment", comment_iter, false);
}

function Capitalizer() {
  let complete = false;

  return function capitalizer(buffer, cursor_position) {
    if (complete) return;

    const last_chars = buffer.text.slice(
      cursor_position - 3,
      cursor_position - 1,
    );
    if (last_chars[1] !== " ") return;

    complete = true;

    if (last_chars[0] === ":") {
      buffer.change_case(
        GtkSource.ChangeCaseType.UPPER,
        buffer.get_iter_at_offset(cursor_position - 1),
        buffer.get_iter_at_offset(cursor_position),
      );
    } else {
      buffer.change_case(
        GtkSource.ChangeCaseType.UPPER,
        buffer.get_start_iter(),
        buffer.get_iter_at_offset(1),
      );
    }
  };
}
