import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import settings from "./settings.js";
import { relativePath } from "./util.js";

export default function Preferences({ application }) {
  const builder = Gtk.Builder.new_from_file(relativePath("./preferences.ui"));

  const window = builder.get_object("window");
  window.set_application(application);

  const spinButton = builder.get_object("spinButton");
  spinButton.set_range(50, 200);
  spinButton.set_increments(1, 10);
  settings.bind(
    "title-length-hint",
    spinButton,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );

  window.show_all();

  return { window };
}
