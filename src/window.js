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
import GObject from "gi://GObject";
import Gio from "gi://Gio";

const file = Gio.File.new_for_uri(import.meta.url);
const windowFile = file.get_parent().resolve_relative_path("window.ui");
const [, Template] = windowFile.load_contents(null);

export default GObject.registerClass(
  {
    Name: "CommitWindow",
    GTypeName: "CommitWindow",
    Template,
    InternalChildren: ["messageText", "commitButton", "cancelButton"],
  },
  class CommitWindow extends Gtk.Window {
    _init(application) {
      super._init({
        application,
      });
    }
  },
);
