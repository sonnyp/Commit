/* main.js
 *
 * Copyright 2021 Sonny Piers
 * Copyright 2018 Aral Balkan
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

pkg.initGettext()
pkg.initFormat()
pkg.require({
  'GObject': '2.0',
  'Gio': '2.0',
  'Gtk': '3.0',
  'GLib': '2.0',
  'Gspell': '1'
})

const Gio = imports.gi.Gio
const Gtk = imports.gi.Gtk
const GLib = imports.gi.GLib
const {programInvocationName} = imports.system;

const {Application} = imports.application;


function main(argv) {
  let application = new Application()

  if (GLib.getenv("DEV")) {
    log("argv " + argv.join(" "));

    log(`programInvocationName: ${programInvocationName}`);
    log(`_: ${GLib.getenv("_")}`);
    for (const i in pkg) {
      if (typeof pkg[i] === "string") {
        log(`pkg.${i}: ${pkg[i]}`);
      }
    }

    const restart = new Gio.SimpleAction({
      name: "restart",
      parameter_type: null,
    });
    restart.connect("activate", () => {
      application.quit();
      log(argv);
      GLib.spawn_async(null, argv, null, GLib.SpawnFlags.DEFAULT, null);
    });
    application.add_action(restart);
    application.set_accels_for_action("app.restart", ["<Ctrl><Shift>Q"]);
  }

  return application.run(argv)
}
