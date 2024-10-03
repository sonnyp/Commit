import GLib from "gi://GLib";
import Gio from "gi://Gio";

export const TITLE_LENGTH_HINT = "title-length-hint";
export const BODY_LENGTH_WRAP = "body-length-wrap";
export const AUTO_CAPITALIZE_TITLE = "auto-capitalize-title";

export const MIN_TITLE_LENGTH_HINT = 50;
export const MIN_BODY_LENGTH_WRAP = 50;

const DEFAULT_TITLE_LENGTH_HINT = 50;
const DEFAULT_BODY_LENGTH_WRAP = 72;
const DEFAULT_AUTO_CAPITALIZE_TITLE = true;

export const MAX_TITLE_LENGTH_HINT = GLib.MAXINT32;
export const MAX_BODY_LENGTH_WRAP = GLib.MAXINT32;

export const settings = new Gio.Settings({
  schema_id: "re.sonny.Commit",
  path: "/re/sonny/Commit/",
});

class Config {
  key_file = new GLib.KeyFile();
  file;

  [TITLE_LENGTH_HINT];
  [BODY_LENGTH_WRAP];
  [AUTO_CAPITALIZE_TITLE];

  constructor({ file }) {
    this.file = file;
  }

  _load() {
    try {
      this.key_file.load_from_file(
        this.file.get_path(),
        GLib.KeyFileFlags.KEEP_COMMENTS | GLib.KeyFileFlags.KEEP_TRANSLATIONS,
      );
    } catch (err) {
      if (!err.matches(GLib.FileError, GLib.FileError.NOENT)) {
        throw err;
      }
    }
  }

  save() {
    this._load();

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
    this.key_file.set_boolean(
      "re.sonny.Commit",
      AUTO_CAPITALIZE_TITLE,
      this[AUTO_CAPITALIZE_TITLE],
    );

    this.key_file.save_to_file(this.file.get_path());
  }
}

const file_gitconfig_global = Gio.File.new_for_path(
  GLib.get_home_dir(),
).get_child(".gitconfig");
const file_gitconfig_local = Gio.File.new_for_path(
  GLib.get_current_dir(),
).get_child(".gitconfig");

export const local = new Config({ file: file_gitconfig_local });
export const global = new Config({ file: file_gitconfig_global });

local.load = function load() {
  this._load();

  this[TITLE_LENGTH_HINT] =
    getSafeKey(local.key_file, "get_integer", TITLE_LENGTH_HINT) ??
    global[TITLE_LENGTH_HINT];

  this[BODY_LENGTH_WRAP] =
    getSafeKey(local.key_file, "get_integer", BODY_LENGTH_WRAP) ??
    global[BODY_LENGTH_WRAP];

  this[AUTO_CAPITALIZE_TITLE] =
    getSafeKey(local.key_file, "get_boolean", AUTO_CAPITALIZE_TITLE) ??
    global[AUTO_CAPITALIZE_TITLE];
};

global.load = function load() {
  this._load();

  this[TITLE_LENGTH_HINT] =
    getSafeKey(global.key_file, "get_integer", TITLE_LENGTH_HINT) ??
    settings.get_int(TITLE_LENGTH_HINT) ??
    DEFAULT_TITLE_LENGTH_HINT;

  this[BODY_LENGTH_WRAP] =
    getSafeKey(global.key_file, "get_integer", BODY_LENGTH_WRAP) ??
    settings.get_int(BODY_LENGTH_WRAP) ??
    DEFAULT_BODY_LENGTH_WRAP;

  this[AUTO_CAPITALIZE_TITLE] =
    getSafeKey(global.key_file, "get_boolean", AUTO_CAPITALIZE_TITLE) ??
    DEFAULT_AUTO_CAPITALIZE_TITLE;
};

global.load();
local.load();

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
