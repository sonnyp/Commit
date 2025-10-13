import GLib from "gi://GLib";
import Gio from "gi://Gio";

import tst, { assert } from "../troll/tst/tst.js";

import { getHostConfigHomePath, isFile } from "../src/helpers.js";

const test = tst("helpers");

test("getHostConfigHomePath host", async () => {
  assert.is(
    await getHostConfigHomePath(false),
    GLib.get_home_dir() + "/.config",
  );
});

test("getHostConfigHomePath sandbox with HOST_XDG_CONFIG_HOME", async () => {
  const HOST_XDG_CONFIG_HOME = GLib.getenv("HOST_XDG_CONFIG_HOME");
  GLib.setenv("HOST_XDG_CONFIG_HOME", "/foo/bar", true);
  assert.is(await getHostConfigHomePath(true), "/foo/bar");
  if (HOST_XDG_CONFIG_HOME) {
    GLib.setenv("HOST_XDG_CONFIG_HOME", HOST_XDG_CONFIG_HOME, true);
  }
});

test("getHostConfigHomePath sandbox without HOST_XDG_CONFIG_HOME", async () => {
  const HOST_XDG_CONFIG_HOME = GLib.getenv("HOST_XDG_CONFIG_HOME");
  GLib.unsetenv("HOST_XDG_CONFIG_HOME");
  assert.is(
    await getHostConfigHomePath(true),
    GLib.get_home_dir() + "/.config",
  );
  if (HOST_XDG_CONFIG_HOME) {
    GLib.setenv("HOST_XDG_CONFIG_HOME", HOST_XDG_CONFIG_HOME, true);
  }
});

test("isFile returns false for directory", async () => {
  assert.is(await isFile(Gio.File.new_for_path("/tmp")), false);
});

test("isFile returns false for NOT_FOUND", async () => {
  assert.is(await isFile(Gio.File.new_for_path("/foobar")), false);
});

test("isFile returns true for files", async () => {
  assert.is(await isFile(Gio.File.new_for_path("//etc/passwd")), true);
});

export default test;
