/* main.js
 *
 * Copyright 2020-2021 Sonny Piers
 * Copyright 2018-2020 Aral Balkan
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

import './setup.js'

import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import {programInvocationName} from 'system'

import Application from './application.js'

export default function main(argv, {version}) {
  let application = new Application({version})

  if (__DEV__) {
    log("argv " + argv.join(" "));
    log(`programInvocationName: ${programInvocationName}`);
    log(`_: ${GLib.getenv("_")}`);

    const restart = new Gio.SimpleAction({
      name: "restart",
      parameter_type: null,
    });
    restart.connect("activate", () => {
      application.quit();
      GLib.spawn_async(null, argv, null, GLib.SpawnFlags.DEFAULT, null);
    });
    application.add_action(restart);
    application.set_accels_for_action("app.restart", ["<Ctrl><Shift>Q"]);
  }

  return application.run(argv)
}
