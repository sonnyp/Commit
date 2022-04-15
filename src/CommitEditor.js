import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import GtkSource from "gi://GtkSource";
import Adw from "gi://Adw";
import Pango from "gi://Pango";

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
      wrap_width_request: GObject.ParamSpec.int(
        "wrap_width_request",
        "",
        "",
        GObject.ParamFlags.READWRITE,
        0,
        9999,
        // Number.MAX_SAFE_INTEGER,
        0,
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

    set wrap_width_request(val) {
      this.view.set_right_margin_position(val);
      this._wrap_width_request = val;
    }

    get wrap_width_request() {
      return this._wrap_width_request;
    }

    vfunc_size_allocate(width, height, baseline) {
      const is_wider_than_wrap_width_request =
        this.view.get_width() >=
        getWrapPixelWidth(this.view, this._wrap_width_request) +
          this.view.left_margin;

      this.view.set_wrap_mode(
        is_wider_than_wrap_width_request
          ? Gtk.WrapMode.NONE
          : Gtk.WrapMode.WORD,
      );

      return super.vfunc_size_allocate(width, height, baseline);
    }

    update_style() {
      const scheme = style_manager.dark ? "Adwaita-dark" : "Adwaita";
      this.buffer.set_style_scheme(scheme_manager.get_scheme(scheme));
    }
  },
);

function getWrapPixelWidth(textview, length) {
  const metrics = textview.get_pango_context()?.get_metrics(null, null);
  const character_width = metrics.get_approximate_char_width() / Pango.SCALE;

  const total_width = character_width * length;

  return Math.ceil(total_width);
}
