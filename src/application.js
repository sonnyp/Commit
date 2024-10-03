import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Adw from "gi://Adw";

import Window from "./window.js";
import Welcome from "./welcome.js";
import { getType } from "./scm.js";
import About from "./about.js";
import ShortcutsWindow from "./ShortcutsWindow.js";

import "./style.css";
import { settings } from "./settings.js";

const textDecoder = new TextDecoder();

const style_manager = Adw.StyleManager.get_default();

export default function Application() {
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

  application.connect("handle-local-options", (_self, options) => {
    if (options.contains("readonly")) readonly = true;

    return -1;
  });

  // Open gets called when a file is passed as a command=line argument.
  // We expect Git or Mercurial to pass us one file.
  application.connect("open", (_self, files, _hint) => {
    console.debug(
      "open",
      files.map((file) => file.get_path()),
    );

    if (files.length !== 1) {
      openWelcome({ application });
      return;
    }

    const file = files[0];
    openEditor({ file, application, readonly });
  });

  application.connect("startup", () => {
    console.debug("startup");
  });

  application.connect("activate", () => {
    console.debug("activate");
    openWelcome({ application });
  });

  const action_about = new Gio.SimpleAction({
    name: "about",
    parameter_type: null,
  });
  action_about.connect("activate", () => {
    About({ application });
  });
  application.add_action(action_about);

  const action_shortcuts = new Gio.SimpleAction({
    name: "shortcuts",
    parameter_type: null,
  });
  action_shortcuts.connect("activate", () => {
    ShortcutsWindow({ application });
  });
  application.add_action(action_shortcuts);
  application.set_accels_for_action("app.shortcuts", ["<Control>question"]);

  application.set_accels_for_action("win.cancel", ["Escape"]);
  application.set_accels_for_action("win.save", [
    "<Control>Return",
    "<Control>KP_Enter",
  ]);

  application.add_action(settings.create_action("color-scheme"));

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
  application.set_accels_for_action("app.quit", ["<Control>Q"]);
}

function openEditor({ file, application, readonly }) {
  const file_path = file.get_path();

  let text;
  try {
    const [, contents] = GLib.file_get_contents(file_path);
    text = textDecoder.decode(contents);
  } catch (err) {
    console.error(err);
    application.quit();
    return;
  }

  const type = getType(GLib.path_get_basename(file_path));
  const { window } = Window({
    application,
    file,
    text,
    type,
    readonly,
  });
  // Add the dialog to the application as its main window.
  application.add_window(window);

  window.present();
}

function setColorScheme() {
  const color_scheme = settings.get_int("color-scheme");
  style_manager.set_color_scheme(color_scheme);
}
setColorScheme();
settings.connect("changed::color-scheme", setColorScheme);
