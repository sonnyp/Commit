import Adw from "gi://Adw?version=1";
import GtkSource from "gi://GtkSource?version=5";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { programInvocationName } from "system";

import Application from "./application.js";

pkg.initGettext();

Adw.init();
GtkSource.init();

export function main(argv) {
  const application = new Application();

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
      GLib.spawn_async(
        null,
        [programInvocationName, ...argv],
        null,
        GLib.SpawnFlags.DEFAULT,
        null,
      );
    });
    application.add_action(restart);
    application.set_accels_for_action("app.restart", ["<Control><Shift>Q"]);
  }

  return application.runAsync(argv);
}
