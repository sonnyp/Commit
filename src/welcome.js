import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import system from "system";
import GLib from "gi://GLib";
import Gio from "gi://Gio";

import settings from "./settings.js";
import { relativePath, loadStyleSheet } from "./util.js";

export default function Welcome({ application }) {
  const builder = Gtk.Builder.new_from_file(relativePath("./welcome.ui"));

  loadStyleSheet(relativePath("./application.css"));

  const spinButton = builder.get_object("spinButton");
  spinButton.set_range(50, 200);
  spinButton.set_increments(1, 10);
  settings.bind(
    "title-length-hint",
    spinButton,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );

  const Clipboard = Gtk.Clipboard.get_default(Gdk.Display.get_default());

  const window = builder.get_object("window");
  window.set_application(application);

  const command = getCommand();

  const git_text = builder.get_object("git_text");
  git_text.label = `<tt>git config --global core.editor "${command}"</tt>`;
  const git_copy = builder.get_object("git_copy");
  git_copy.connect("clicked", () => {
    selectNone(git_text);
    Clipboard.set_text(git_text.get_text(), -1);
  });
  git_text.connect("grab-focus", () => {
    Promise.resolve().then(() => {
      selectAll(git_text);
    });
    return false;
  });

  const hg_text = builder.get_object("hg_text");
  hg_text.label = `<tt>[ui]\neditor=${command}</tt>`;
  const hg_copy = builder.get_object("hg_copy");
  hg_copy.connect("clicked", () => {
    selectNone(hg_text);
    Clipboard.set_text(hg_text.get_text(), -1);
  });
  hg_text.connect("grab-focus", () => {
    Promise.resolve().then(() => {
      selectAll(hg_text);
    });
    return false;
  });

  window.show_all();

  return { window };
}

function selectAll(GTKLabel) {
  GTKLabel.select_region(0, -1);
}

function selectNone(GTKLabel) {
  GTKLabel.select_region(0, 0);
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
