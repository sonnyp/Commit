import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import { gettext as _ } from "gettext";

import Editor from "./editor.js";

import { parse, format, isEmptyCommitMessage } from "./scm.js";
import ThemeSelector from "../troll/src/widgets/ThemeSelector.js";
import { BODY_LENGTH_WRAP, local as config } from "./settings.js";
import Preferences from "./preferences.js";

import resource from "./window.blp" with { type: "uri" };
import { build } from "../troll/src/builder.js";

Gio._promisify(Adw.MessageDialog.prototype, "choose", "choose_finish");

export default function Window({ application, file, text, type, readonly }) {
  const { window, menu_button, button_save, overlay } = build(resource);

  let parsed = {};
  try {
    parsed = parse(text, type);
  } catch (err) {
    if (__DEV__) {
      console.error(err);
    }
  }

  if (__DEV__) window.add_css_class("devel");

  let title = GLib.path_get_basename(GLib.get_current_dir());
  if (parsed.detail) title += ` (${parsed.detail})`;
  window.set_title(title);

  // Popover menu theme switcher
  menu_button.get_popover().add_child(new ThemeSelector(), "themeswitcher");

  button_save.label = parsed.action;

  // Set a 3px padding on the bottom right floating menu button
  {
    const margin_box = menu_button.get_first_child().get_first_child();
    ["top", "end", "start", "bottom"].forEach((dir) => {
      margin_box["margin_" + dir] = 10;
    });
  }

  const { buffer, source_view, editor, update } = Editor({
    overlay,
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
    }).catch(console.error);
  });
  window.add_action(action_cancel);

  const action_save = new Gio.SimpleAction({
    name: "save",
    parameter_type: null,
  });
  action_save.connect("activate", () => {
    const { text } = buffer;

    if (isEmptyCommitMessage(text, parsed.comment_prefix)) return;

    config.load();
    const value =
      parsed.is_message && !editor.isWiderThanWrapWidthRequest()
        ? format(text, config[BODY_LENGTH_WRAP], parsed.comment_prefix)
        : text;

    save({
      file,
      value,
      readonly,
    });
    application.quit();
  });
  window.add_action(action_save);

  const action_preferences = new Gio.SimpleAction({
    name: "preferences",
    parameter_type: null,
  });
  action_preferences.connect("activate", () => {
    Preferences({ application, update });
  });
  application.add_action(action_preferences);

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
    console.error(err);
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
