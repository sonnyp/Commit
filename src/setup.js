// GLib, GObject, and Gio are required by GJS so no version is necessary.
// https://gitlab.gnome.org/GNOME/gjs/-/blob/master/doc/ESModules.md
// import "gi://Gio";
// import "gi://GLib";
// import "gi://GObject";

// FIXME: Implement spell check with future GTK4 API
import Gtk from "gi://Gtk?version=4.0";

import Adw from "gi://Adw";

Gtk.init();
Adw.init();
