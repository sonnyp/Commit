import Gio from "gi://Gio";

export const settings = new Gio.Settings({
  schema_id: "re.sonny.Commit",
  path: "/re/sonny/Commit/",
});
