import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";
import Gio from "gi://Gio";

export function loadStyleSheet(path) {
  const provider = new Gtk.CssProvider();
  provider.load_from_resource(path);
  Gtk.StyleContext.add_provider_for_display(
    Gdk.Display.get_default(),
    provider,
    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION,
  );
}

export const settings = new Gio.Settings({
  schema_id: "re.sonny.Commit",
  path: "/re/sonny/Commit/",
});
