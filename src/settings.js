import GLib from "gi://GLib";
import Gio from "gi://Gio";

export const TITLE_LENGTH_HINT = "title-length-hint";
export const BODY_LENGTH_WRAP = "body-length-wrap";

export const MIN_TITLE_LENGTH_HINT = 50;
export const MIN_BODY_LENGTH_WRAP = 50;

const DEFAULT_TITLE_LENGTH_HINT = 50;
const DEFAULT_BODY_LENGTH_WRAP = 72;

export const MAX_TITLE_LENGTH_HINT = GLib.MAXINT32;
export const MAX_BODY_LENGTH_WRAP = GLib.MAXINT32;

export const settings = new Gio.Settings({
  schema_id: "re.sonny.Commit",
  path: "/re/sonny/Commit/",
});

class GitConfig {
  key_file = new GLib.KeyFile();
  #file;

  [TITLE_LENGTH_HINT] = DEFAULT_TITLE_LENGTH_HINT;
  [BODY_LENGTH_WRAP] = DEFAULT_BODY_LENGTH_WRAP;

  constructor({ file }) {
    this.#file = file;
    this.load();
  }

  load(update = true) {
    try {
      this.key_file.load_from_file(
        this.#file.get_path(),
        GLib.KeyFileFlags.KEEP_COMMENTS | GLib.KeyFileFlags.KEEP_TRANSLATIONS,
      );
    } catch (err) {
      if (!err.matches(GLib.FileError, GLib.FileError.NOENT)) {
        throw err;
      }
    }

    if (!update) return;

    const title_length_hint = getSafeKey(
      this.key_file,
      "get_integer",
      TITLE_LENGTH_HINT,
    );
    if (typeof title_length_hint === "number") {
      this[TITLE_LENGTH_HINT] = title_length_hint;
    }

    const body_length_wrap = getSafeKey(
      this.key_file,
      "get_integer",
      BODY_LENGTH_WRAP,
    );
    if (typeof body_length_wrap === "number") {
      this[BODY_LENGTH_WRAP] = body_length_wrap;
    }
  }

  save() {
    this.load(false);

    this.key_file.set_integer(
      "re.sonny.Commit",
      TITLE_LENGTH_HINT,
      this[TITLE_LENGTH_HINT],
    );
    this.key_file.set_integer(
      "re.sonny.Commit",
      BODY_LENGTH_WRAP,
      this[BODY_LENGTH_WRAP],
    );
    this.key_file.save_to_file(this.#file.get_path());
  }
}

const file_gitconfig_global = Gio.File.new_for_path(
  GLib.get_home_dir(),
).get_child(".gitconfig");
const file_gitconfig_local = Gio.File.new_for_path(
  GLib.get_current_dir(),
).get_child(".gitconfig");
export const global = new GitConfig({ file: file_gitconfig_global });
export const local = new GitConfig({ file: file_gitconfig_local });

function getSafeKey(key_file, method, name) {
  try {
    return key_file[method]("re.sonny.Commit", name);
  } catch (err) {
    if (
      !err.matches(GLib.KeyFileError, GLib.KeyFileError.KEY_NOT_FOUND) &&
      !err.matches(GLib.KeyFileError, GLib.KeyFileError.GROUP_NOT_FOUND)
    ) {
      throw err;
    }
  }
}

export function getConfig() {
  local.load();
  global.load();

  const title_length_hint =
    getSafeKey(local.key_file, "get_integer", TITLE_LENGTH_HINT) ??
    getSafeKey(global.key_file, "get_integer", TITLE_LENGTH_HINT) ??
    settings.get_int(TITLE_LENGTH_HINT) ??
    DEFAULT_TITLE_LENGTH_HINT;

  const body_length_wrap =
    getSafeKey(local.key_file, "get_integer", BODY_LENGTH_WRAP) ??
    getSafeKey(global.key_file, "get_integer", BODY_LENGTH_WRAP) ??
    settings.get_int(BODY_LENGTH_WRAP) ??
    DEFAULT_BODY_LENGTH_WRAP;

  return {
    [TITLE_LENGTH_HINT]: title_length_hint,
    [BODY_LENGTH_WRAP]: body_length_wrap,
  };
}
