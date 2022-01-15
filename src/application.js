import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import GLib from "gi://GLib";
import Adw from "gi://Adw";

import Window from "./window.js";
import Welcome from "./welcome.js";
import validateCommitButton from "./validateCommitButton.js";
import { getType, parse } from "./scm.js";
import About from "./about.js";
import ShortcutsWindow from "./ShortcutsWindow.js";

const textDecoder = new TextDecoder();

export default function Application({ version }) {
  const application = new Adw.Application({
    application_id: "re.sonny.Commit",
    flags:
      /* We handle file opens. */
      Gio.ApplicationFlags.HANDLES_OPEN |
      /* We can have more than one instance active at once. */
      Gio.ApplicationFlags.NON_UNIQUE,
  });

  let readonly = false;

  application.add_main_option(
    "readonly",
    null,
    GLib.OptionFlags.NONE,
    GLib.OptionArg.NONE,
    "Prevent Commit from making changes - useful for testing",
    null,
  );

  application.connect("handle-local-options", (self, options) => {
    if (options.contains("readonly")) readonly = true;

    return -1;
  });

  // Open gets called when a file is passed as a command=line argument.
  // We expect Git or Mercurial to pass us one file.
  application.connect("open", (self, files, hint) => {
    if (__DEV__) log("open");

    if (files.length !== 1) {
      openWelcome({ application });
      return;
    }

    const file = files[0];
    openEditor({ file, application, readonly });
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

  const showShortCutsWindow = new Gio.SimpleAction({
    name: "shortcuts",
    parameter_type: null,
  });
  showShortCutsWindow.connect("activate", () => {
    ShortcutsWindow({ application });
  });
  application.add_action(showShortCutsWindow);
  application.set_accels_for_action("app.shortcuts", ["<Primary>question"]);

  application.set_accels_for_action("win.cancel", ["Escape"]);
  application.set_accels_for_action("win.commit", ["<Primary>Return"]);

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
  application.set_accels_for_action("app.quit", ["<Primary>Q"]);
}

function openEditor({ file, application, readonly }) {
  const filePath = file.get_path();

  let commitMessage;
  try {
    [, commitMessage] = GLib.file_get_contents(filePath);
  } catch (err) {
    printerr(err);
    application.quit();
    return;
  }

  commitMessage = textDecoder.decode(commitMessage);

  const type = getType(filePath);
  // This should not happen.
  if (!type) {
    print(`Warning: unknown commit type encountered in: ${filePath}`);
  }

  const {
    comment: commitComment,
    detail,
    comment_separator,
    cursor_position,
  } = parse(commitMessage, type);

  const commitCommentLines = commitComment.split("\n");
  const numberOfLinesInCommitComment = commitCommentLines.length;

  const { window, commitButton, buffer } = Window({
    application,
    file,
    numberOfLinesInCommitComment,
    comment_separator,
    type,
    detail,
    readonly,
  });
  // Add the dialog to the application as its main window.
  application.add_window(window);

  // This is not user undo-able
  // if it was we could wrap it between
  // buffer.begin_irreversible_action();
  // buffer.end_irreversible_action();
  buffer.set_text(commitMessage, -1);

  buffer.place_cursor(buffer.get_iter_at_offset(cursor_position));

  // Set the original comment to be non-editable.
  const nonEditableTag = Gtk.TextTag.new("NonEditable");
  nonEditableTag.editable = false;
  buffer.tag_table.add(nonEditableTag);
  const endOfText = buffer.get_end_iter();
  buffer.apply_tag(nonEditableTag, buffer.get_start_iter(), endOfText);

  // Validate the commit button on start (if we have an auto-generated
  // body of the commit message, it should be enabled).
  validateCommitButton({
    buffer,
    numberOfLinesInCommitComment,
    commitButton,
  });

  window.show();
}
