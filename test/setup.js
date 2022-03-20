import "gi://Gtk?version=4.0";
import GLib from "gi://GLib";

// https://gitlab.gnome.org/GNOME/gjs/-/merge_requests/696
export const stdout = (() => {
  const { DataOutputStream, UnixOutputStream } = imports.gi.Gio;
  return new DataOutputStream({
    base_stream: new UnixOutputStream({ fd: 1 }),
  });
})();
export const stderr = (() => {
  const { DataOutputStream, UnixOutputStream } = imports.gi.Gio;
  return new DataOutputStream({
    base_stream: new UnixOutputStream({ fd: 2 }),
  });
})();
export const stdin = (() => {
  const { DataInputStream, UnixInputStream } = imports.gi.Gio;
  return new DataInputStream({
    base_stream: new UnixInputStream({ fd: 0 }),
  });
})();
// const source = stdin.base_stream.create_source(null);
// source.set_callback(() => {
//   log("foo");
// });
// source.attach(null);

const decoder = new TextDecoder();
GLib.log_set_writer_func((log_level, fields) => {
  const output = log_level === GLib.LogLevelFlags.LEVEL_ERROR ? stderr : stdout;
  output.put_string(decoder.decode(fields.MESSAGE), null);
  return GLib.LogWriterOutput.HANDLED;
});
