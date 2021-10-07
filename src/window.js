import GLib from "gi://GLib";
import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";

import Editor from "./editor.js";

import { relativePath } from "./util.js";

export default function Window({
  application,
  file,
  numberOfLinesInCommitComment,
  comment_separator,
  type,
  detail,
}) {
  const builder = Gtk.Builder.new_from_file(relativePath("./window.ui"));

  const window = builder.get_object("window");
  const cancelButton = builder.get_object("cancelButton");
  const commitButton = builder.get_object("commitButton");
  const eventController = builder.get_object("eventController");

  if (type) {
    const projectDirectoryName = GLib.path_get_basename(GLib.get_current_dir());
    window.set_title(`${type}: ${projectDirectoryName} (${detail})`);
  }

  window.set_application(application);

  function onCancel() {
    save({ file, application, value: "" });
  }

  function onCommit() {
    const value = buffer.text;
    save({ file, application, value });
  }

  // Exit via Escape key.
  eventController.connect("key-pressed", (_self, keyval, _keycode, _state) => {
    if (keyval === Gdk.KEY_Escape) {
      onCancel();
      return true;
    }
    return false;
  });

  const { buffer, setHighlightColour } = Editor({
    builder,
    commitButton,
    numberOfLinesInCommitComment,
    comment_separator,
    type,
  });

  setHighlightColour();

  cancelButton.connect("clicked", onCancel);

  commitButton.connect("clicked", onCommit);

  return { window, cancelButton, commitButton, buffer };
}

function save({ file, value, application }) {
  try {
    GLib.file_set_contents(file.get_path(), value);
    application.quit();
  } catch (err) {
    printerr(err);
  }

  application.quit();
}
