import Gtk from "gi://Gtk";
import GtkSource from "gi://GtkSource";
import Gdk from "gi://Gdk";

import CommitEditor from "./CommitEditor.js";

import { isEmptyCommitMessage } from "./scm.js";
import {
  AUTO_CAPITALIZE_TITLE,
  BODY_LENGTH_WRAP,
  local as config,
  TITLE_LENGTH_HINT,
} from "./settings.js";

const tag_title_too_long = new Gtk.TextTag({
  foreground: "#e01b24",
});

export default function editor({ overlay, button_save, parsed }) {
  const {
    body,
    comment,
    cursor_position,
    read_only_index,
    language,
    comment_prefix,
    is_message,
  } = parsed;

  const widget = new CommitEditor({ language });
  overlay.set_child(widget);
  const source_view = widget.view;

  source_view.set_show_right_margin(is_message);

  const buffer = source_view.get_buffer();
  buffer.tag_table.add(tag_title_too_long);

  // Set up keyboard shortcut for comment toggle (Ctrl+/)
  const event_controller = new Gtk.EventControllerKey();
  source_view.add_controller(event_controller);

  event_controller.connect(
    "key-pressed",
    (controller, keyval, keycode, state) => {
      if (!comment_prefix) return false; // Event not handled

      const ctrl_pressed = (state & Gdk.ModifierType.CONTROL_MASK) !== 0;

      // Check for Ctrl+/ (line comment toggle)
      if (ctrl_pressed && keyval === Gdk.KEY_slash) {
        toggleLineComment(buffer, comment_prefix);
        return true; // Event handled
      }

      return false; // Event not handled
    },
  );

  function update() {
    config.load();
    widget.wrap_width_request = config[BODY_LENGTH_WRAP];
    updateHighlight();
  }
  update();

  buffer.connect("changed", updateHighlight);

  function updateHighlight() {
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
    buffer.remove_tag(
      tag_title_too_long,
      startOfTextIterator,
      endOfTextIterator,
    );

    const title_length_hint = config[TITLE_LENGTH_HINT];
    // Highlight the overflow area, if any.
    if (firstLineLength > title_length_hint) {
      const startOfOverflowIterator =
        buffer.get_iter_at_offset(title_length_hint);
      buffer.apply_tag(
        tag_title_too_long,
        startOfOverflowIterator,
        endOfFirstLineIterator,
      );
    }
  }

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

      if (config[AUTO_CAPITALIZE_TITLE]) {
        capitalizer(buffer, cursor_position);
      }

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
  source_view.connect_after("select-all", (_self, selected) => {
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

  return { source_view, buffer, editor: widget, update };
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

    // Get the last 3 characters
    // for example ": h" in "fix: h"
    const last_chars = buffer.text.slice(
      cursor_position - 3,
      cursor_position - 1,
    );
    if (last_chars[1] !== " ") return;

    const iter = buffer.get_iter_at_offset(cursor_position - 3);
    const [match_found] = iter.backward_search(
      " ", // str
      null, // flags
      null, // limit
    );
    if (match_found) return;

    // Only capitalize once in case that's not what the user wants
    // so that if they backspace - Commit does not repeat the same mistake
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

function toggleLineComment(buffer, commentPrefix) {
  const [hasSelection, start, end] = buffer.get_selection_bounds();

  let startLine, endLine;

  if (hasSelection) {
    startLine = start.get_line();
    endLine = end.get_line();

    if (end.get_line_offset() === 0 && endLine > startLine) {
      endLine--;
    }
  } else {
    const cursor = buffer.get_iter_at_mark(buffer.get_insert());
    startLine = cursor.get_line();
    endLine = startLine;
  }

  const text = buffer.get_text(
    buffer.get_start_iter(),
    buffer.get_end_iter(),
    false,
  );
  const lines = text.split("\n");

  let allCommented = true;
  for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
    if (lineNum >= lines.length) continue;

    const lineText = lines[lineNum];
    const trimmed = lineText.trimStart();

    if (trimmed.length === 0) continue;

    if (!trimmed.startsWith(commentPrefix)) {
      allCommented = false;
      break;
    }
  }

  buffer.begin_user_action();

  for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
    if (lineNum >= lines.length) continue;

    const lineText = lines[lineNum];

    if (lineText.trim().length === 0) continue;

    const trimmed = lineText.trimStart();
    const leadingWhitespace = lineText.length - trimmed.length;

    let lineStartOffset = 0;
    for (let i = 0; i < lineNum; i++) {
      lineStartOffset += lines[i].length + 1;
    }

    if (allCommented && trimmed.startsWith(commentPrefix)) {
      const commentStartOffset = lineStartOffset + leadingWhitespace;
      let commentEndOffset = commentStartOffset + commentPrefix.length;

      const currentText = buffer.get_text(
        buffer.get_start_iter(),
        buffer.get_end_iter(),
        false,
      );
      if (
        commentEndOffset < currentText.length &&
        currentText[commentEndOffset] === " "
      ) {
        commentEndOffset++;
      }

      const commentStart = buffer.get_iter_at_offset(commentStartOffset);
      const commentEnd = buffer.get_iter_at_offset(commentEndOffset);

      buffer.delete(commentStart, commentEnd);

      lines[lineNum] =
        lineText.substring(0, leadingWhitespace) +
        lineText.substring(
          leadingWhitespace +
            commentPrefix.length +
            (currentText[commentStartOffset + commentPrefix.length] === " "
              ? 1
              : 0),
        );
    } else if (!allCommented) {
      const match = lineText.match(/\S/);
      if (match) {
        const offset = match.index;
        const absoluteOffset = lineStartOffset + offset;

        const insertPos = buffer.get_iter_at_offset(absoluteOffset);
        buffer.insert(insertPos, commentPrefix + " ", -1);

        lines[lineNum] =
          lineText.substring(0, offset) +
          commentPrefix +
          " " +
          lineText.substring(offset);
      }
    }
  }

  buffer.end_user_action();
}
