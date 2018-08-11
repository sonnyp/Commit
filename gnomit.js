#!/usr/bin/gjs

imports.gi.versions.Gtk = '3.0'
const Gtk = imports.gi.Gtk
const GLib = imports.gi.GLib
const Gio = imports.gi.Gio
const System = imports.system

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

class Gnomit {
    constructor () {
        this.title = 'Gnomit'
        GLib.set_prgname(this.title)

        this.application = new Gtk.Application({
            application_id: 'ind.ie.gnomit',
            flags: Gio.ApplicationFlags.HANDLES_OPEN,

        })

        this.application.add_main_option('version',
        'v'.charCodeAt(0),
        GLib.OptionFlags.NONE,
        GLib.OptionArg.NONE,
        "Shows program version",
        null)

        this.application.connect('handle_local_options', (application, options) => {
            if (options.contains('version')) {
                print('Version 0.1')
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
            // without a commit message file as an argument, so we show
            // setup instructions.
            print('\nGnomit')
            print('——————\n')
            print('To set Gnomit as your default editor for Git:\n')
            print('git config --global core.editor <path-to-gnomit.js>\n')
            this.application.quit()        
        }

        this.application.connect('activate', this.activate)
    }
}

let app = new Gnomit()

// Workaround incompatibility between how GJS handles ARGV and how C-based libraries like Gtk.Application do.
// (See https://stackoverflow.com/a/35237684)
ARGV.unshift(System.programInvocationName)
app.application.run(ARGV)
