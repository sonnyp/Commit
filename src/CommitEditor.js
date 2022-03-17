import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import GtkSource from "gi://GtkSource";
import Adw from "gi://Adw";

import { relativePath } from "./util.js";

const file = Gio.File.new_for_path(relativePath("./CommitEditor.ui"));
const [, template] = file.load_contents(null);

const scheme_manager = GtkSource.StyleSchemeManager.get_default();
const style_manager = Adw.StyleManager.get_default();
const language_manager = GtkSource.LanguageManager.get_default();
language_manager.set_search_path([
  ...language_manager.get_search_path(),
  relativePath("language-specs"),
]);

export default GObject.registerClass(
  {
    GTypeName: "CommitEditor",
    Properties: {
      language: GObject.ParamSpec.string(
        "language",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        null,
      ),
    },
    Template: template,
    Children: ["view", "buffer"],
    Signals: {
      "style-updated": {},
    },
  },
  class CommitEditor extends Gtk.ScrolledWindow {
    _init(params = {}) {
      super._init(params);

      this.buffer.set_language(language_manager.get_language(this.language));

      this.update_style();
      style_manager.connect("notify::dark", this.update_style.bind(this));
    }

    update_style() {
      const scheme = style_manager.dark ? "Adwaita-dark" : "Adwaita";
      this.buffer.set_style_scheme(scheme_manager.get_scheme(scheme));
    }
  },
);
