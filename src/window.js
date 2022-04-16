import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import Editor from "./editor.js";

import { relativePath, settings } from "./util.js";
import { parse, format } from "./scm.js";

export default function Window({
  application,
  file,
  commitMessage,
  type,
  readonly,
}) {
  let parsed = {};
  try {
    parsed = parse(commitMessage, type);
  } catch (err) {
    if (__DEV__) {
      logError(err);
    }
  }

  const builder = Gtk.Builder.new_from_file(relativePath("./window.ui"));
  const window = builder.get_object("window");
  const button_save = builder.get_object("button_save");
  button_save.label = parsed.action;

  // Set a 3px padding on the bottom right floating menu button
  {
    const margin_box = builder
      .get_object("menubutton")
      .get_first_child()
      .get_first_child();
    ["top", "end", "start", "bottom"].forEach((dir) => {
      margin_box["margin_" + dir] = 10;
    });
  }

  const { buffer, source_view, editor } = Editor({
    builder,
    button_save,
    type,
    window,
    parsed,
  });

  window.set_application(application);

  const action_cancel = new Gio.SimpleAction({
    name: "cancel",
    parameter_type: null,
  });
  action_cancel.connect("activate", () => {
    if (type) {
      save({ file, value: "", readonly });
    }
    application.quit();
  });
  window.add_action(action_cancel);

  const action_save = new Gio.SimpleAction({
    name: "save",
    parameter_type: null,
  });
  action_save.connect("activate", () => {
    const { text } = buffer;

    const value =
      parsed.wrap && !editor.isWiderThanWrapWidthRequest()
        ? format(
            text,
            settings.get_int("body-length-wrap"),
            parsed.comment_prefix,
          )
        : text;

    save({
      file,
      value,
      readonly,
    });
    application.quit();
  });
  window.add_action(action_save);

  // https://github.com/sonnyp/Commit/issues/33
  window.set_focus(source_view);

  return { window };
}

function save({ file, value, readonly }) {
  if (!readonly) {
    try {
      GLib.file_set_contents(file.get_path(), value);
    } catch (err) {
      logError(err);
    }
  }
}
