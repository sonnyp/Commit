import Gdk from "gi://Gdk";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import GLib from "gi://GLib";
import Gspell from "gi://Gspell";

import Window from "./window.js";
import showHelp from "./showHelp.js";
import validateCommitButton from "./validateCommitButton.js";
import { getType, parse } from "./scm.js";

const ByteArray = imports.byteArray;

const SUMMARY = `
Helps you write better commit messages.

To use with Git, set Commit as the default editor:
  git config --global core.editor "flatpak run --file-forwarding re.sonny.Commit @@"

To use with Mercurial (hg), set the following in your ~/.hgrc
  [ui]
  editor=flatpak run --file-forwarding re.sonny.Commit @@
`.trim();

const HIGHLIGHT_BACKGROUND_TAG_NAME = "highlightBackground";

// Keep first line line-length validation in line with
// the original Komet behaviour for the time being.
// (See https://github.com/zorgiepoo/Komet/releases/tag/0.1)
const FIRST_LINE_CHARACTER_LIMIT = 69;

// Method courtesy: https://stackoverflow.com/questions/51396490/getting-a-string-length-that-contains-unicode-character-exceeding-0xffff#comment89813733_51396686
function unicodeLength(str) {
  return [...str].length;
}

// TODO: The Application class is doing everything right now. Refactor to offload
//       functionality to the window and to helper objects.

export default function Application({ version }) {
  let buffer, type;

  const application = new Gtk.Application({
    application_id: "re.sonny.Commit",
    flags:
      /* We handle file opens. */
      Gio.ApplicationFlags.HANDLES_OPEN |
      /* We can have more than one instance active at once. */
      Gio.ApplicationFlags.NON_UNIQUE,
  });

  GLib.set_prgname("Commit");
  GLib.set_application_name("Commit Editor");

  // The option context parameter string is displayed next to the
  // list of options on the first line of the --help screen.
  application.set_option_context_parameter_string(
    "<path-to-commit-message-file>",
  );

  // The option context summary is displayed above the set of options
  // on the --help screen.
  application.set_option_context_summary(SUMMARY);

  // Add option: --version, -v
  application.add_main_option(
    "version",
    "v",
    GLib.OptionFlags.NONE,
    GLib.OptionArg.NONE,
    "Show version number and exit",
    null,
  );

  application.connect("handle_local_options", (self, options) => {
    // Handle option: --version, -v:
    //
    // Print a minimal version string based on the GNU coding standards.
    // https://www.gnu.org/prep/standards/standards.html#g_t_002d_002dversion
    if (options.contains("version")) {
      print(`Commit ${version}`);

      // OK.
      return 0;
    }

    // Let the system handle any other command-line options.
    return -1;
  });

  // Open gets called when a file is passed as a command=line argument.
  // We expect Git or Mercurial to pass us one file.
  application.connect("open", (self, files, hint) => {
    if (files.length !== 1) {
      // Error: Too many files.
      showHelp(application);
      return;
    }

    application.commitMessageFile = files[0];
    application.commitMessageFilePath = application.commitMessageFile.get_path();

    // Try to load the commit message contents.
    const ERROR_SUMMARY =
      "\n\nError: Could not read the commit message file.\n\n";

    let success = false,
      commitMessage = "",
      commitBody = "",
      commitComment = "",
      detail = "";

    try {
      [success, commitMessage] = GLib.file_get_contents(
        application.commitMessageFilePath,
      );

      commitMessage = ByteArray.toString(commitMessage);

      // Escape tag start/end as we will be using markup to populate the buffer.
      // (Otherwise, rebase -i commit messages fail, as they contain the strings
      // <commit>, <label>, etc.
      commitMessage = commitMessage.replace(/</g, "&lt;");
      commitMessage = commitMessage.replace(/>/g, "&gt;");

      type = getType(application.commitMessageFilePath);
      // This should not happen.
      if (!type) {
        print(
          `Warning: unknown commit type encountered in: ${application.commitMessageFilePath}`,
        );
      }

      ({ body: commitBody, comment: commitComment, detail } = parse(
        commitMessage,
        type,
      ));

      const commitCommentLines = commitComment.split("\n");
      application.numberOfLinesInCommitComment = commitCommentLines.length;

      const projectDirectoryName = GLib.path_get_basename(
        GLib.get_current_dir(),
      );

      if (type) {
        application.active_window.set_title(
          `${type}: ${projectDirectoryName} (${detail})`,
        );
      }

      // Add Pango markup to make the commented are appear lighter.
      commitMessage = `${commitBody}<span foreground="#959595">\n${commitComment}</span>`;

      // Not sure when you would get success === false without an error being
      // thrown but handling it anyway just to be safe. There doesn’t appear
      // to be any error information available.
      // Docs: https://gjs-docs.gnome.org/glib20~2.64.1/glib.file_get_contents
      if (!success) {
        print(`${ERROR_SUMMARY}`);
        application.quit();
      }
    } catch (error) {
      print(`${ERROR_SUMMARY}${error}\n`);
      application.quit();
    }

    // Update the text in the interface using markup.
    let startOfText = buffer.get_start_iter();
    buffer.insert_markup(startOfText, commitMessage, -1);

    // The iterator now points to the end of the inserted section.
    // Reset it to either the start of the body of the commit message
    // (if there is one) or to the very start of the text and place the
    // cursor there, ready for person to start editing it.
    startOfText =
      commitBody.length > 0
        ? buffer.get_iter_at_offset(commitBody.length)
        : buffer.get_start_iter();
    buffer.place_cursor(startOfText);

    // Set the original comment to be non-editable.
    const nonEditableTag = Gtk.TextTag.new("NonEditable");
    nonEditableTag.editable = false;
    buffer.tag_table.add(nonEditableTag);
    const endOfText = buffer.get_end_iter();
    buffer.apply_tag(nonEditableTag, startOfText, endOfText);

    // Save the number of lines in the commit message.
    application.previousNumberOfLinesInCommitMessage = 1;

    // Special case: for git add -p edit hunk messages, place the cursor at start.
    if (type === "add -p") {
      buffer.place_cursor(buffer.get_start_iter());
    }

    // Validate the commit button on start (if we have an auto-generated
    // body of the commit message, it should be enabled).
    validateCommitButton({
      buffer,
      numberOfLinesInCommitComment: application.numberOfLinesInCommitComment,
      commitButton: application.commitButton,
    });

    // Show the composition interface.
    application.window.show_all();
  });

  application.connect("startup", () => {
    const { window, messageText, cancelButton, commitButton } = Window(
      application,
    );

    Object.assign(application, {
      window,
      messageText,
      cancelButton,
      commitButton,
    });

    // Exit via Escape key.
    application.window.add_events(Gdk.EventMask.KEY_PRESS_MASK);
    application.window.connect("key_press_event", (self, event) => {
      const [, keyval] = event.get_keyval();
      if (keyval === Gdk.KEY_Escape) {
        application.quit();
        return true;
      }
      return false;
    });

    buffer = application.messageText.get_buffer();

    // Set up spell checking for the text view.
    // TODO: This is incorrectly documented. File an issue / blog.
    const gSpellTextView = Gspell.TextView.get_from_gtk_text_view(
      application.messageText,
    );
    gSpellTextView.basic_setup();

    // Tag: highlight background.
    const highlightBackgroundTag = Gtk.TextTag.new(
      HIGHLIGHT_BACKGROUND_TAG_NAME,
    );
    buffer.tag_table.add(highlightBackgroundTag);
    const setHighlightColour = () => {
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
    };

    application.window.connect("style-updated", () => {
      setHighlightColour();
    });

    const highlightText = () => {
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
    };

    buffer.connect("changed", highlightText);
    buffer.connect("paste-done", highlightText);

    buffer.connect("end-user-action", () => {
      // Due to the non-editable region, the selection for a
      // Select All is not automatically cleared by the
      // system. So let’s detect it and clear it ourselves.
      if (application.lastActionWasSelectAll) {
        application.lastActionWasSelectAll = false;
        const cursorIterator = buffer.get_iter_at_offset(
          buffer.cursor_position,
        );
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
        numberOfLinesInCommitMessage >
          application.previousNumberOfLinesInCommitMessage
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
        numberOfLinesInCommitMessage ===
          application.numberOfLinesInCommitComment + 3 &&
        /* and person didn’t reach here by deleting existing content */
        numberOfLinesInCommitMessage >
          application.previousNumberOfLinesInCommitMessage
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
      application.previousNumberOfLinesInCommitMessage = numberOfLinesInCommitMessage;

      // Validation: Enable Commit button only if commit message is not empty.
      validateCommitButton({
        buffer,
        numberOfLinesInCommitComment: application.numberOfLinesInCommitComment,
        commitButton: application.commitButton,
      });
    });

    // Only select commit message body (not the comment) on select all.
    messageText.connect("select-all", (self, selected) => {
      if (selected) {
        // Carry this out on the next stack frame. The selected signal
        // gets called too early (you are not able to change the
        // selection at that time.) TODO: File bug.
        Promise.resolve().then(() => {
          application.lastActionWasSelectAll = true;
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
      }
    });

    cancelButton.connect("clicked", () => {
      application.quit();
    });

    commitButton.connect("clicked", () => {
      let success;
      const ERROR_SUMMARY = "\n\nError: could not save your commit message.\n";

      const textToSave = buffer.text;

      try {
        // Save the text.
        success = GLib.file_set_contents(
          application.commitMessageFilePath,
          textToSave,
        );
        if (!success) {
          print(ERROR_SUMMARY);
        }
        application.quit();
      } catch (error) {
        print(`${ERROR_SUMMARY}${error}`);
        application.quit();
      }
    });

    // Add the dialog to the application as its main window.
    application.add_window(application.window);
  });

  application.connect("activate", showHelp);

  return application;
}
