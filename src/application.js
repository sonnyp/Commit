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

    // Option: --version, -v
    this.add_main_option(
      'version', 'v',
      GLib.OptionFlags.NONE,
      GLib.OptionArg.NONE,
      'Show version number and exit',
      null
    )

    // Option: --install, -i
    this.add_main_option(
      'install', 'i',
      GLib.OptionFlags.NONE,
      GLib.OptionArg.NONE,
      'Install Gnomit as your default Git editor',
      null
    )
  }

})
