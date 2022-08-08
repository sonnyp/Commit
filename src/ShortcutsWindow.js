import Gtk from "gi://Gtk";

import Builder from "./ShortcutsWindow.ui";

export default function ShortcutsWindow({ application }) {
  const builder = Gtk.Builder.new_from_resource(Builder);

  const window = builder.get_object("shortcuts_window");
  window.set_transient_for(application.get_active_window());
  window.set_application(application);

  window.show();
}
