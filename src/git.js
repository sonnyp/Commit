import Gio from "gi://Gio";
import GLib from "gi://GLib";

import { getHostConfigHomePath, isFile } from "./helpers.js";

// https://git-scm.com/docs/git-config#FILES

export async function getGlobalGitconfig(
  path_host_config_home = getHostConfigHomePath(),
) {
  let file_gitconfig_global = Gio.File.new_build_filenamev([
    path_host_config_home,
    "git",
    "config",
  ]);

  if (!(await isFile(file_gitconfig_global))) {
    file_gitconfig_global = Gio.File.new_build_filenamev([
      GLib.get_home_dir(),
      ".gitconfig",
    ]);
  }

  return file_gitconfig_global;
}
