/* Based on /assets/Spawn.js at https://github.com/optimisme/gjs-examples */
const Gio = imports.gi.Gio
const GLib = imports.gi.GLib
const Lang = imports.lang

var SpawnReader = function () {}

SpawnReader.prototype.spawn = function (path, command, data, end) {
  let res, pid, stdin, stdout, stderr, stream, reader

  ;[res, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(
    path,
    command,
    null,
    0,
    null
  )

  stream = new Gio.DataInputStream({
    base_stream: new Gio.UnixInputStream({ fd: stdout })
  })

  this.read(stream, data, end)
}

SpawnReader.prototype.read = function (stream, data, end) {
  stream.read_line_async(
    GLib.PRIORITY_LOW,
    null,
    Lang.bind(this, function (source, res) {
      let out, length

      ;[out, length] = source.read_line_finish(res)
      if (out !== null) {
        data(out)
        this.read(source, data, end)
      } else {
        end()
      }
    })
  )
}
