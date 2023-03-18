#!/usr/bin/env -S gjs -m

import { exit, programArgs, programInvocationName } from "system";
import GLib from "gi://GLib";
import { setConsoleLogDomain } from "console";

imports.package.init({
  name: "@app_id@",
  version: "@version@",
  prefix: "@prefix@",
  libdir: "@libdir@",
  datadir: "@datadir@",
});
setConsoleLogDomain(pkg.name);
GLib.set_application_name("Commit");

globalThis.__DEV__ = false;

const { main } = await import("resource:///re/sonny/Commit/main.js");
const exit_code = await main([programInvocationName, ...programArgs]);
exit(exit_code);
