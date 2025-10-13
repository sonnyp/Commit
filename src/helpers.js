import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Xdp from "gi://Xdp";

Gio._promisify(Gio.File.prototype, "query_info_async");

export function getHostConfigHomePath(
  running_under_sandbox = Xdp.Portal.running_under_sandbox(),
) {
  // We can't use GLib.get_user_config_dir() here since it will
  // return the sandbox's XDG_CONFIG_HOME
  if (!running_under_sandbox) {
    return GLib.get_user_config_dir();
  }

  return (
    GLib.getenv("HOST_XDG_CONFIG_HOME") ||
    GLib.build_filenamev([GLib.get_home_dir(), ".config"])
  );
}

export async function isFile(file) {
  try {
    const info = await file.query_info_async(
      Gio.FILE_ATTRIBUTE_STANDARD_TYPE,
      Gio.FileQueryInfoFlags.NONE,
      GLib.PRIORITY_DEFAULT,
      null,
    );
    return info.get_file_type() === Gio.FileType.REGULAR;
  } catch (e) {
    if (e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) return false;
    throw e;
  }
}
