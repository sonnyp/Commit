import Gtk from "gi://Gtk";
import system from "system";
import GLib from "gi://GLib";
import Gio from "gi://Gio";

import settings from "./settings.js";
import { relativePath, loadStyleSheet } from "./util.js";

export default function Welcome({ application }) {
  const builder = Gtk.Builder.new_from_file(relativePath("./welcome.ui"));

  loadStyleSheet(relativePath("./style.css"));

  const spinButton = builder.get_object("spinButton");
  spinButton.set_range(50, 200);
  spinButton.set_increments(1, 10);
  settings.bind(
    "title-length-hint",
    spinButton,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );

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
