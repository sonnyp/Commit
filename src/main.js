import Adw from "gi://Adw?version=1";
import GtkSource from "gi://GtkSource?version=5";

import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { programInvocationName } from "system";
import { bindtextdomain, textdomain } from "gettext";

import Application from "./application.js";

GLib.set_prgname("re.sonny.Commit");
GLib.set_application_name("Commit");

Adw.init();
GtkSource.init();

export default function main(argv, { version, datadir }) {
  bindtextdomain("re.sonny.Commit", GLib.build_filenamev([datadir, "locale"]));
  textdomain("re.sonny.Commit");

  const application = new Application({ version });

  console.debug("argv", argv);
  console.debug("programInvocationName", programInvocationName);
  console.debug("_", GLib.getenv("_"));
  console.debug("PWD", GLib.get_current_dir());

  if (__DEV__) {
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
