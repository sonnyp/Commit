import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import GLib from "gi://GLib";

import Window from "./window.js";
import Welcome from "./welcome.js";
import validateCommitButton from "./validateCommitButton.js";
import { getType, parse } from "./scm.js";
import About from "./about.js";
import Preferences from "./Preferences.js";

const ByteArray = imports.byteArray;

export default function Application({ version }) {
  const application = new Gtk.Application({
    application_id: "re.sonny.Commit",
    flags:
      /* We handle file opens. */
      Gio.ApplicationFlags.HANDLES_OPEN |
      /* We can have more than one instance active at once. */
      Gio.ApplicationFlags.NON_UNIQUE,
  });

  GLib.set_prgname("re.sonny.Commit");
  GLib.set_application_name("Commit");

  // Open gets called when a file is passed as a command=line argument.
  // We expect Git or Mercurial to pass us one file.
  application.connect("open", (self, files, hint) => {
    if (__DEV__) log("open");

    if (files.length !== 1) {
      openWelcome({ application });
      return;
    }

    const file = files[0];
    openEditor({ file, application });
  });

  application.connect("startup", () => {
    if (__DEV__) log("startup");
  });

  application.connect("activate", () => {
    if (__DEV__) log("activate");
    openWelcome({ application });
  });

  const showAboutDialog = new Gio.SimpleAction({
    name: "about",
    parameter_type: null,
  });
  showAboutDialog.connect("activate", () => {
    About({ application, version });
  });
  application.add_action(showAboutDialog);

  const showPrefencesWindow = new Gio.SimpleAction({
    name: "preferences",
    parameter_type: null,
  });
  showPrefencesWindow.connect("activate", () => {
    Preferences({ application });
  });
  application.add_action(showPrefencesWindow);

  return application;
}

function openWelcome({ application }) {
  Welcome({ application });

  const quit = new Gio.SimpleAction({
    name: "quit",
    parameter_type: null,
  });
  quit.connect("activate", () => {
    application.quit();
  });
  application.add_action(quit);
  application.set_accels_for_action("app.quit", ["<Ctrl>Q", "Escape"]);
}

function openEditor({ file, application }) {
  const filePath = file.get_path();

  let commitMessage;
  try {
    [, commitMessage] = GLib.file_get_contents(filePath);
  } catch (err) {
    printerr(err);
    application.quit();
    return;
  }

  commitMessage = ByteArray.toString(commitMessage);

  // Escape text as we will be using markup to populate the buffer.
  commitMessage = GLib.markup_escape_text(commitMessage, -1);

  const type = getType(filePath);
  // This should not happen.
  if (!type) {
    print(`Warning: unknown commit type encountered in: ${filePath}`);
  }

  const {
    body: commitBody,
    comment: commitComment,
    detail,
    comment_separator,
  } = parse(commitMessage, type);

  const commitCommentLines = commitComment.split("\n");
  const numberOfLinesInCommitComment = commitCommentLines.length;

  // Add Pango markup to make the commented area appear lighter.
  commitMessage = `${commitBody}<span foreground="#959595">\n${commitComment}</span>`;

  const { window, commitButton, buffer } = Window({
    application,
    file,
    numberOfLinesInCommitComment,
    comment_separator,
    type,
    detail,
  });
  // Add the dialog to the application as its main window.
  application.add_window(window);

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

  // Special case: for git add -p edit hunk messages, place the cursor at start.
  if (type === "add -p") {
    buffer.place_cursor(buffer.get_start_iter());
  }

  // Validate the commit button on start (if we have an auto-generated
  // body of the commit message, it should be enabled).
  validateCommitButton({
    buffer,
    numberOfLinesInCommitComment,
    commitButton,
  });

  window.show_all();
}
