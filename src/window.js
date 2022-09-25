import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import Editor from "./editor.js";

import { settings } from "./util.js";
import { parse, format } from "./scm.js";
import ThemeSelector from "./ThemeSelector.js";
import Interface from "./window.blp";

export default function Window({ application, file, text, type, readonly }) {
  const builder = Gtk.Builder.new_from_resource(Interface);

  let parsed = {};
  try {
    parsed = parse(text, type);
  } catch (err) {
    if (__DEV__) {
      logError(err);
    }
  }

  const window = builder.get_object("window");
  if (__DEV__) window.add_css_class("devel");

  let title = GLib.path_get_basename(GLib.get_current_dir());
  if (parsed.detail) title += ` (${parsed.detail})`;
  window.set_title(title);

  // Popover menu theme switcher
  const button_menu = builder.get_object("menubutton");
  const popover = button_menu.get_popover();
  popover.add_child(new ThemeSelector(), "themeswitcher");

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
    application,
    builder,
    button_save,
    type,
    parsed,
  });

  window.set_application(application);

  const action_cancel = new Gio.SimpleAction({
    name: "cancel",
    parameter_type: null,
  });
  action_cancel.connect("activate", () => {
    if (type && type !== "config") {
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
      parsed.is_message && !editor.isWiderThanWrapWidthRequest()
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

