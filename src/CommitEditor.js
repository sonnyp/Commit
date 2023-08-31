import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import GtkSource from "gi://GtkSource";
import Adw from "gi://Adw";
import GLib from "gi://GLib";
import Spelling from "gi://Spelling";

import Template from "./CommitEditor.blp" assert { type: "uri" };

import "./language-specs/git.lang";
import "./language-specs/hg.lang";

const scheme_manager = GtkSource.StyleSchemeManager.get_default();
const style_manager = Adw.StyleManager.get_default();
const language_manager = GtkSource.LanguageManager.get_default();
language_manager.set_search_path([
  ...language_manager.get_search_path(),
  GLib.Uri.resolve_relative(
    import.meta.url,
    "language-specs",
    GLib.UriFlags.NONE,
  ),
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
        1000,
        0,
      ),
    },
    Template,
    Children: ["view", "buffer"],
    Signals: {
      "style-updated": {},
    },
  },
  class CommitEditor extends Gtk.ScrolledWindow {
    constructor(params = {}) {
      super(params);

      this.buffer.set_language(language_manager.get_language(this.language));

      this.update_style();
      style_manager.connect("notify::dark", this.update_style.bind(this));

      const checker = Spelling.Checker.get_default();
      const adapter = Spelling.TextBufferAdapter.new(this.buffer, checker);
      const extra_menu = adapter.get_menu_model();

      this.view.set_extra_menu(extra_menu);
      this.view.insert_action_group('spelling', adapter);

      adapter.set_enabled(true);
    }

    set wrap_width_request(val) {
      this.view.set_right_margin_position(val);
      this._wrap_width_request = val;
    }

    get wrap_width_request() {
      return this._wrap_width_request;
    }

    vfunc_size_allocate(width, height, baseline) {
      this.view.set_wrap_mode(
        this.isWiderThanWrapWidthRequest()
          ? Gtk.WrapMode.NONE
          : Gtk.WrapMode.WORD,
      );

      return super.vfunc_size_allocate(width, height, baseline);
    }

    update_style() {
      const scheme = style_manager.dark ? "Adwaita-dark" : "Adwaita";
      this.buffer.set_style_scheme(scheme_manager.get_scheme(scheme));
    }

    isWiderThanWrapWidthRequest() {
      return (
        this.view.get_width() >=
        getRulerPosition(this.view, this._wrap_width_request)
      );
    }
  },
);

// https://gitlab.gnome.org/GNOME/gtksourceview/-/blob/bbf355ae4da03e4d7442e6749c2005a2e905e36c/gtksourceview/gtksourceview.c#L2801
function getWrapPixelWidth(textview, length) {
  const layout = textview.create_pango_layout("_");
  const [character_width] = layout.get_pixel_size();
  return character_width * length;
}
// https://gitlab.gnome.org/GNOME/gtksourceview/-/blob/bbf355ae4da03e4d7442e6749c2005a2e905e36c/gtksourceview/gtksourceview.c#L2565
function getRulerPosition(sourceview, length) {
  return getWrapPixelWidth(sourceview, length) + sourceview.get_left_margin();
}
