import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import Editor from "./editor.js";

import { relativePath } from "./util.js";

export default function Window({
  application,
  file,
  numberOfLinesInCommitComment,
  type,
  detail,
  readonly,
}) {
  const builder = Gtk.Builder.new_from_file(relativePath("./window.ui"));

  const window = builder.get_object("window");
  const cancelButton = builder.get_object("cancelButton");
  const commitButton = builder.get_object("commitButton");

  if (type) {
    const projectDirectoryName = GLib.path_get_basename(GLib.get_current_dir());
    let title = `${type}: ${projectDirectoryName}`;
    if (detail) title += ` (${detail})`;
    window.set_title(title);
  }

  window.set_application(application);

  const cancelAction = new Gio.SimpleAction({
    name: "cancel",
    parameter_type: null,
  });
  cancelAction.connect("activate", () => {
    save({ file, application, value: "", readonly });
  });
  window.add_action(cancelAction);

  const commitAction = new Gio.SimpleAction({
    name: "commit",
    parameter_type: null,
  });
  commitAction.connect("activate", () => {
    const value = buffer.text;
    save({ file, application, value, readonly });
  });
  window.add_action(commitAction);

  const { buffer, source_view } = Editor({
    builder,
    commitButton,
    numberOfLinesInCommitComment,
    type,
  });

  // https://github.com/sonnyp/Commit/issues/33
  window.set_focus(source_view);

  return { window, cancelButton, commitButton, buffer };
}

function save({ file, value, application, readonly }) {
  if (!readonly) {
    try {
      GLib.file_set_contents(file.get_path(), value);
    } catch (err) {
      printerr(err);
    }
  }

  application.quit();
}
