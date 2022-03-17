import Gtk from "gi://Gtk";
import system from "system";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import GObject from "gi://GObject";

import { relativePath, loadStyleSheet, settings } from "./util.js";

export default function Welcome({ application }) {
  const builder = Gtk.Builder.new_from_file(relativePath("./welcome.ui"));

  loadStyleSheet(relativePath("./style.css"));

  const button_hint = builder.get_object("button_hint");
  button_hint.set_range(...getRange("title-length-hint"));
  button_hint.set_increments(1, 10);
  settings.bind(
    "title-length-hint",
    button_hint,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );

  const button_wrap = builder.get_object("button_wrap");
  button_wrap.set_range(...getRange("body-length-wrap"));
  button_wrap.set_increments(1, 10);
  settings.bind(
    "body-length-wrap",
    button_wrap,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );

  const darkSwitch = builder.get_object("darkSwitch");
  Adw.StyleManager.get_default().bind_property(
    "dark",
    darkSwitch,
    "active",
    GObject.BindingFlags.SYNC_CREATE,
  );
  darkSwitch.connect("state-set", (self, state) => {
    // The switch was enabled by the system dark mode
    if (state === true && Adw.StyleManager.get_default().dark) return;
    settings.set_boolean("dark-mode", state);
  });

  const window = builder.get_object("window");
  window.set_application(application);

  const command = getCommand();

  const git_text = builder.get_object("git_text");
  git_text.label = `<tt>git config --global core.editor "${command}"</tt>`;
  const git_copy = builder.get_object("git_copy");
  git_copy.connect("clicked", () => {
    git_copy.get_clipboard().set(git_text.get_text());
  });

  const hg_text = builder.get_object("hg_text");
  hg_text.label = `<tt>[ui]\neditor=${command}</tt>`;
  const hg_copy = builder.get_object("hg_copy");
  hg_copy.connect("clicked", () => {
    hg_copy.get_clipboard().set(hg_text.get_text());
  });

  window.show();

  return { window };
}

function getCommand() {
  const FLATPAK_ID = GLib.getenv("FLATPAK_ID");
  const { programInvocationName } = system;

  if (FLATPAK_ID) {
    return `flatpak run --file-forwarding ${FLATPAK_ID} @@`;
  }

  // re.sonny.Commit
  if (programInvocationName === GLib.path_get_basename(programInvocationName)) {
    return programInvocationName;
  }

  // ./re.sonny.commit
  // /home/sonny/re.sonny.Commit
  return GLib.canonicalize_filename(
    programInvocationName,
    GLib.get_current_dir(),
  );
}

function getRange(key) {
  const range = settings.get_range(key).unpack()[1].unpack();

  return [
    range.get_child_value(0).get_int32(),
    range.get_child_value(1).get_int32(),
  ];
}
