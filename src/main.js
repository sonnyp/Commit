import Adw from "gi://Adw?version=1";
import GtkSource from "gi://GtkSource?version=5";

import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { programInvocationName } from "system";
import { bindtextdomain, textdomain } from "gettext";

import { settings } from "./util.js";
import Application from "./application.js";

GLib.set_prgname("re.sonny.Commit");
GLib.set_application_name("Commit");

GtkSource.init();

function updateDarkMode() {
  Adw.StyleManager.get_default().set_color_scheme(
    settings.get_boolean("dark-mode")
      ? Adw.ColorScheme.FORCE_DARK
      : Adw.ColorScheme.DEFAULT,
  );
}

export default function main(argv, { version, datadir }) {
  bindtextdomain("re.sonny.Commit", GLib.build_filenamev([datadir, "locale"]));
  textdomain("re.sonny.Commit");

  // gjs doesn't have bind_with_mapping
  // https://gitlab.gnome.org/GNOME/gjs/-/issues/397
  updateDarkMode();
  settings.connect("changed::dark-mode", updateDarkMode);

  const application = new Application({ version });

  if (__DEV__) {
    log("argv " + argv.join(" "));
    log(`programInvocationName: ${programInvocationName}`);
    log(`_: ${GLib.getenv("_")}`);
    log(`PWD: ${GLib.get_current_dir()}`);

    const restart = new Gio.SimpleAction({
      name: "restart",
      parameter_type: null,
    });
    restart.connect("activate", () => {
      application.quit();
      GLib.spawn_async(null, argv, null, GLib.SpawnFlags.DEFAULT, null);
    });
    application.add_action(restart);
    application.set_accels_for_action("app.restart", ["<Control><Shift>Q"]);
  }

  return application.run(argv);
}
