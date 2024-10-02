#!/usr/bin/env -S gjs -m

import { exit, programArgs, programInvocationName } from "system";
import GLib from "gi://GLib";
import { setConsoleLogDomain } from "console";
import Gio from "gi://Gio";

import { build as gjspack } from "../troll/gjspack/src/gjspack.js";

// eslint-disable-next-line no-restricted-globals
imports.package.init({
  name: "re.sonny.Commit",
  version: "dev",
  prefix: "/tmp/Commit",
  libdir: "/tmp/Commit",
  datadir: "/tmp/Commit",
});
setConsoleLogDomain("re.sonny.Commit");
GLib.set_application_name("Commit");

globalThis.__DEV__ = true;

const project_root = Gio.File.new_for_uri(
  import.meta.url,
).resolve_relative_path("../..");
const { gresource_path, prefix } = gjspack({
  appid: "re.sonny.Commit",
  prefix: "/re/sonny/Commit",
  project_root,
  resource_root: project_root.resolve_relative_path("./src"),
  entry: project_root.resolve_relative_path("./src/main.js"),
  output: project_root.resolve_relative_path("./src"),
  potfiles: project_root.resolve_relative_path("./po/POTFILES"),
});
const resource = Gio.resource_load(gresource_path);
Gio.resources_register(resource);

const data_dir = project_root.get_child("data");

const [, , stderr, status] = GLib.spawn_command_line_sync(
  `glib-compile-schemas --strict ${data_dir.get_path()}`,
);
if (status !== 0) {
  throw new Error(new TextDecoder().decode(stderr));
}

GLib.setenv("GSETTINGS_SCHEMA_DIR", data_dir.get_path(), true);

const { main } = await import(`resource://${prefix}/main.js`);
const exit_code = await main([programInvocationName, ...programArgs]);
exit(exit_code);
