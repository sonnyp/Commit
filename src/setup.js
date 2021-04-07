// GLib, GObject, and Gio are required by GJS so no version is necessary.
// https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md
// import "gi://Gio";
// import "gi://GLib";
// import "gi://GObject";

// FIXME: Gspell does not support GTK 4 currently
// https://gitlab.gnome.org/GNOME/gspell/-/issues/17

// Gtk and Gdk are required by Gspell
import Gtk from "gi://Gtk?version=3.0";
// import "gi://Gdk?version=4.0";
import "gi://Gspell?version=1";

Gtk.init(null);
