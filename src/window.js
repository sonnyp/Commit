import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

import Editor from "./editor.js";

import { settings } from "./util.js";
import { parse, format, isEmptyCommitMessage } from "./scm.js";
import ThemeSelector from "../troll/src/widgets/ThemeSelector.js";
import Interface from "./window.blp";

Gio._promisify(Adw.MessageDialog.prototype, "choose", "choose_finish");

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

  settings.bind(
    "window-width",
    window,
    "default-width",
    Gio.SettingsBindFlags.DEFAULT,
  );

  settings.bind(
    "window-height",
    window,
    "default-height",
    Gio.SettingsBindFlags.DEFAULT,
  );

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
    builder,
    button_save,
    type,
    parsed,
  });

  let has_changes = false;
  buffer.connect("changed", () => {
    has_changes = true;
  });

  window.set_application(application);

  const action_cancel = new Gio.SimpleAction({
    name: "cancel",
    parameter_type: null,
  });
  action_cancel.connect("activate", () => {
    const { text } = buffer;

    abort({
      type,
      file,
      value: text.trim(),
      readonly,
      window,
      application,
      has_changes,
    }).catch(logError);
  });
  window.add_action(action_cancel);

  const action_save = new Gio.SimpleAction({
    name: "save",
    parameter_type: null,
  });
  action_save.connect("activate", () => {
    const { text } = buffer;

    if (isEmptyCommitMessage(text, parsed.comment_prefix)) return;

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

function shouldSaveOnAbort({ type }) {
  return type !== "config";
}

async function abort({
  type,
  file,
  value,
  readonly,
  window,
  application,
  has_changes,
}) {
  if (!shouldSaveOnAbort({ type })) {
    application.quit();
    return;
  }

  if (await confirmDiscard({ type, value, window, has_changes })) {
    save({ file, value: "", readonly });
    application.quit();
  }
}

function save({ file, value, readonly }) {
  if (readonly) return;

  try {
    GLib.file_set_contents(file.get_path(), value);
  } catch (err) {
    logError(err);
  }
}

function shouldConfirmOnDiscard({ type, value, has_changes }) {
  if (!has_changes) return false;
  if (type !== "commit") return false;
  if (!value) return false;

  return true;
}

async function confirmDiscard({ type, value, window, has_changes }) {
  if (!shouldConfirmOnDiscard({ type, value, has_changes })) return true;

  const cancel = "cancel";
  const discard = "discard";
  const dialog = new Adw.MessageDialog({
    heading: _("Discard changes?"),
    close_response: "cancel",
    modal: true,
    transient_for: window,
  });
  dialog.add_response(cancel, _("Cancel"));
  dialog.add_response(discard, _("Discard"));
  dialog.set_response_appearance("discard", Adw.ResponseAppearance.DESTRUCTIVE);
  dialog.set_default_response("discard");
  dialog.present();

  const response = await dialog.choose(null);
  return response === discard;
}
