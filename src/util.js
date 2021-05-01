import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";

export function relativePath(path) {
  const [filename] = GLib.filename_from_uri(import.meta.url);
  const dirname = GLib.path_get_dirname(filename);
  return GLib.canonicalize_filename(path, dirname);
}

export function loadStyleSheet(path) {
  const provider = new Gtk.CssProvider();
  provider.load_from_path(path);
  Gtk.StyleContext.add_provider_for_screen(
    Gdk.Screen.get_default(),
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );
}
