import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Gio from "gi://Gio";

import { relativePath } from "./util.js";

const file = Gio.File.new_for_path(relativePath("./TextView.ui"));
const [, template] = file.load_contents(null);

export default GObject.registerClass(
  {
    GTypeName: "TextView",
    Template: template,
    Signals: {
      "style-updated": {},
    },
  },
  class TextView extends Gtk.TextView {
    vfunc_css_changed() {
      // In GTK3 we had a signal widget.connect("style-updated")
      // but there is only vfunc options in GTK4
      super.emit("style-updated");
    }
  },
);
