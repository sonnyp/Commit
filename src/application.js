import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import GLib from "gi://GLib";

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
    const result = Window(application);
    const { window, messageText, cancelButton, commitButton } = result;
    ({ buffer } = result);

    Object.assign(application, {
      window,
      messageText,
      cancelButton,
      commitButton,
    });

    // Add the dialog to the application as its main window.
    application.add_window(application.window);
  });

  application.connect("activate", showHelp);

  return application;
}
