#!/usr/bin/gjs

imports.gi.versions.Gtk = '3.0'
const Gtk = imports.gi.Gtk
const GLib = imports.gi.GLib
const Gio = imports.gi.Gio
const System = imports.system
const Notify = imports.gi.Notify

// Get application folder and add it into the imports path
// Courtesy: https://github.com/optimisme/gjs-examples/blob/master/egInfo.js
function getAppFileInfo() {
    let stack = (new Error()).stack,
        stackLine = stack.split('\n')[1],
        coincidence, path, file;

    if (!stackLine) throw new Error('Could not find current file (1)')

    coincidence = new RegExp('@(.+):\\d+').exec(stackLine)
    if (!coincidence) throw new Error('Could not find current file (2)')

    path = coincidence[1]
    file = Gio.File.new_for_path(path)
    return [file.get_path(), file.get_parent().get_path(), file.get_basename()]
}
const path = getAppFileInfo()[1]
imports.searchPath.push(path)

const Spawn = imports.lib.spawn

class Gnomit {
    constructor () {
        this.title = 'Gnomit'
        GLib.set_prgname(this.title)
        GLib.set_application_name('Gnomit Commit Editor')

        this.application = new Gtk.Application({
            application_id: 'ind.ie.gnomit',
            flags: Gio.ApplicationFlags.HANDLES_OPEN,
        })

        this.application.set_option_context_parameter_string('')

        // The option context summary is displayed above the set of options
        // in the --help screen.
        
        const summary = `Helps you write better Git commit messages.
        Helps you write better Git commit messages.
        Moo
        hoo 
        woo
        `
        this.application.set_option_context_summary(summary)

        // const help = this.application.get_main_option


        // The option context description is displayed below the set of options
        // in the --help screen.
        this.application.set_option_context_description('© 2018 Aral Balkan (https://ar.al), Indie (https://ind.ie). License: GPLv3.\n')

        this.application.add_main_option('version',
        'v'.charCodeAt(0),
        GLib.OptionFlags.NONE,
        GLib.OptionArg.NONE,
        "Show version number and exit",
        null)

        this.application.connect('handle_local_options', (application, options) => {

            // Print a minimal version of the version string in the GNU coding standards: https://www.gnu.org/prep/standards/standards.html#g_t_002d_002dversion
            if (options.contains('version')) {
                print('Gnomit 1.0.0')
                return 0
            }

            // Let the system handle any other options.
            return -1
        })

        // Open gets called when a file is passed as a commandline argument.
        // We expect Git to pass us one file.
        this.application.connect('open', (application, files, hint) => {

            if (files.length !== 1) {
                // Error: Too many files.
                this.activate()
                return
            }

            const commitFile = files[0]

            this.dialogue.show_all()
        })
        
        this.application.connect('startup', () => {
            // Create a builder and get it to load the interface from the Glade file.
            const builder = new Gtk.Builder()
            builder.add_from_file(`${path}/gnomit.glade`)
            
            // Get references to the components defined in the Glade file.
            this.dialogue = builder.get_object('dialogue')
            this.dialogue.set_icon_name('accessories-text-editor')
    
            this.cancelButton = builder.get_object('cancelButton')
            this.commitButton = builder.get_object('commitButton')
    
            // Response is called after dialogue closes.
            this.dialogue.connect('response', () => {
                print('RESPONSE')
            })
    
            // Add event handlers for the buttons.
            this.cancelButton.connect('clicked', () => {
                print('Cancel button clicked')
            })
    
            this.commitButton.connect('clicked', () => {
                print('Commit button clicked')
            })
    
            // Add the dialog to the application as its main window.
            this.application.add_window(this.dialogue)
        })


        this.activate = () => {
            // Activate is only called if there are no file(s) passed to
            // Gnomit. As Gnomit should only be run by Git, and since Git
            // always passes the commit file, we can assume if activate is
            // triggered that someone ran Gnomit directly and
            // without a commit message file as an argument, we show the help.
            //
            // This is a faff-and-a-half when using the simple signals-based
            // approach to handling commandline arguments (in our case HANDLES_OPEN),
            // as there is no way to get a reference to the GOptionContext of the
            // main application to invoke its get_help() method.
            //
            // TODO: File an enhancement request about this with the GTK project.
            //
            // So, instead, as a workaround, I’m spawning another instance of
            // the app with the --help flag set and piping the output.
            const reader = new Spawn.SpawnReader()
            reader.spawn(`${path}/`, ['gnomit.js', '--help'], (line) => {
                // A new line’s been read, proxy it to stdout.
                print(line)
            }, () => {
                // End of stream, quit the app.
                this.application.quit()
            })
        }

        this.application.connect('activate', this.activate)
    }
}

let app = new Gnomit()

// Workaround incompatibility between how GJS handles ARGV and how C-based libraries like Gtk.Application do.
// (See https://stackoverflow.com/a/35237684)
ARGV.unshift(System.programInvocationName)
app.application.run(ARGV)
