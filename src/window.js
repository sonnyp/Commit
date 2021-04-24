import Gtk from "gi://Gtk";
import GLib from "gi://GLib";
import Gdk from "gi://Gdk";

import Editor from "./editor.js";

const [filename] = GLib.filename_from_uri(import.meta.url);
const dirname = GLib.path_get_dirname(filename);
const builder = Gtk.Builder.new_from_file(
  GLib.build_filenamev([dirname, "window.ui"]),
);

export default function Window({
  application,
  file,
  numberOfLinesInCommitComment,
}) {
  const window = builder.get_object("window");
  const cancelButton = builder.get_object("cancelButton");
  const commitButton = builder.get_object("commitButton");

  window.set_application(application);

  // Exit via Escape key.
  window.add_events(Gdk.EventMask.KEY_PRESS_MASK);
  window.connect("key_press_event", (self, event) => {
    const [, keyval] = event.get_keyval();
    if (keyval === Gdk.KEY_Escape) {
      application.quit();
      return true;
    }
    return false;
  });

  const { buffer, setHighlightColour } = Editor({
    builder,
    commitButton,
    numberOfLinesInCommitComment,
  });

  window.connect("style-updated", () => {
    setHighlightColour();
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
      success = GLib.file_set_contents(file.get_path(), textToSave);
      if (!success) {
        print(ERROR_SUMMARY);
      }
      application.quit();
    } catch (error) {
      print(`${ERROR_SUMMARY}${error}`);
      application.quit();
    }
  });

  return { window, cancelButton, commitButton, buffer };
}
