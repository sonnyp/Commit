/* window.js
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

import Gtk from "gi://Gtk";
import GLib from "gi://GLib";

// FIXME: Doc says return type is string but it is an array
// https://gitlab.gnome.org/GNOME/gjs/-/merge_requests/603
const [filename] = GLib.filename_from_uri(import.meta.url);
const dirname = GLib.path_get_dirname(filename);
const builder = Gtk.Builder.new_from_file(
  GLib.build_filenamev([dirname, "window.ui"]),
);

export default function Window(application) {
  const window = builder.get_object("window");
  const cancelButton = builder.get_object("cancelButton");
  const commitButton = builder.get_object("commitButton");
  const messageText = builder.get_object("messageText");

  window.set_application(application);

  return { window, cancelButton, commitButton, messageText };
}
