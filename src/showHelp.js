import GLib from "gi://GLib";
import { programInvocationName } from "system";

const ByteArray = imports.byteArray;

// Activate is only called if there are no file(s) passed to
// Commit. As Commit should only be run by Git, and since Git
// always passes the commit file, we can assume if activate is
// triggered that someone ran Commit directly and
// without a commit message file as an argument, we show the help.
//
// This is a faff-and-a-half when using the simple signals-based
// approach to handling command-line arguments (in our case HANDLES_OPEN),
// as there is no way to get a reference to the GOptionContext of the
// main application to invoke its get_help() method.
//
// TODO: File an enhancement request about this with the GTK project.
//
// So, instead, as a workaround, I’m spawning another instance of
// the app with the --help flag set and piping the output.

export default function showHelp(application) {
  try {
    const [
      success,
      standardOutput,
      standardError,
    ] = GLib.spawn_command_line_sync(`${programInvocationName} --help`);

    if (success) {
      print(ByteArray.toString(standardOutput));
    } else {
      printerr(ByteArray.toString(standardError));
    }
  } catch (error) {
    printerr(error);
  }

  application.quit();
}
