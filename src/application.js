const { Gtk, Gio, GLib, GObject } = imports.gi

const SUMMARY = `Helps you write better Git commit messages.

To use, configure Git to use Gnomit as the default editor:

  git config --global core.editor <path-to-gnomit.js>`

const COPYRIGHT = `❤ We practice ethical design (https://ind.ie/ethical-design)

Copyright © 2018 Aral Balkan (https://ar.al)
Copyright © 2018 Ind.ie (https://ind.ie)

License GPLv3+: GNU GPL version 3 or later (http://gnu.org/licenses/gpl.html)
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.`

const INSTALLATION_ERROR_SUMMARY = "\nError: failed to set Gnomit as your default Git editor.\n\n"


var Application = GObject.registerClass({
  // Nothing yet.
}, class Application extends Gtk.Application {

  _init() {

    //
    // Set application details.
    //

    super._init({
      application_id: 'ind.ie.Gnomit',
      flags:
      /* We handle file opens. */
      Gio.ApplicationFlags.HANDLES_OPEN
      /* We can have more than one instance active at once. */
      | Gio.ApplicationFlags.NON_UNIQUE
    })

    GLib.set_prgname('Gnomit')
    GLib.set_application_name('Gnomit Commit Editor')

    //
    // Set command-line option handling.
    //

    // The option context parameter string is displayed next to the
    // list of options on the first line of the --help screen.
    this.set_option_context_parameter_string('<path-to-git-commit-message-file>')

    // The option context summary is displayed above the set of options
    // on the --help screen.
    this.set_option_context_summary(SUMMARY)

    // The option context description is displayed below the set of options
    // on the --help screen.
    this.set_option_context_description(COPYRIGHT)

    // Add option: --version, -v
    this.add_main_option(
      'version', 'v',
      GLib.OptionFlags.NONE,
      GLib.OptionArg.NONE,
      'Show version number and exit',
      null
    )

    // Add option: --install, -i
    this.add_main_option(
      'install', 'i',
      GLib.OptionFlags.NONE,
      GLib.OptionArg.NONE,
      'Install Gnomit as your default Git editor',
      null
    )

    this.application.connect('handle_local_options', (application, options) => {
      // Handle option: --install, -i:
      //
      // Install Gnomit as your default Git editor.
      if (options.contains('install')) {
        try {
          let [success, standardOutput, standardError, exitStatus] = GLib.spawn_command_line_sync(`git config --global core.editor ${path}/gnomit.js`)

          if (!success || exitStatus !== 0) {
            // Error: Spawn successful but process did not exit successfully.
            print(`${INSTALLATION_ERROR_SUMMARY}${standardError}`)

            // Exit with generic error code.
            return 1
          }
        } catch (error) {
          // Error: Spawn failed.

          // Start off by telling the person what failed.
          let errorMessage = INSTALLATION_ERROR_SUMMARY

          // Provide further information and try to help.
          if (error.code === GLib.SpawnError.NOENT) {
            // Git was not found: show people how to install it.
            errorMessage += "Git is not installed.\n\nFor help on installing Git, please see:\nhttps://git-scm.com/book/en/v2/Getting-Started-Installing-Git\n"
          } else {
            // Some other error: show the error message.
            errorMessage += `${error}`
          }
          print (errorMessage)

          // Exit with generic error code.
          return 1
        }

        // OK.
        return 0
      }

      // Handle option: --version, -v:
      //
      // Print a minimal version string based on the GNU coding standards.
      // https://www.gnu.org/prep/standards/standards.html#g_t_002d_002dversion
      if (options.contains('version')) {
        print('Gnomit 1.0.0')

        // OK.
        return 0
      }

      // Let the system handle any other command-line options.
      return -1
    })
  }
})
