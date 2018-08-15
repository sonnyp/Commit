#!/usr/bin/gjs

imports.gi.versions.Gtk = '3.0'
const Gtk = imports.gi.Gtk
const GLib = imports.gi.GLib
const Gio = imports.gi.Gio
const System = imports.system
const Notify = imports.gi.Notify

// TODO: GSpell is not a default library. Find out how to
// package it.
const Gspell = imports.gi.Gspell

// Keep first line line-length validation in line with
// the original Komet behaviour for the time being.
// (See https://github.com/zorgiepoo/Komet/releases/tag/0.1)
const FIRST_LINE_CHARACTER_LIMIT = 69

const COPYRIGHT = `❤ We practice ethical design (https://ind.ie/ethical-design)

Copyright © 2018 Aral Balkan (https://ar.al)
Copyright © 2018 Ind.ie (https://ind.ie)

License GPLv3+: GNU GPL version 3 or later (http://gnu.org/licenses/gpl.html)
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.`

const SUMMARY = `Helps you write better Git commit messages.

To use, configure Git to use Gnomit as the default editor:

  git config --global core.editor <path-to-gnomit.js>`

const INSTALLATION_ERROR_SUMMARY = "\nError: failed to set Gnomit as your default Git editor.\n\n"

const HIGHLIGHT_BACKGROUND_TAG_NAME = 'highlightBackground'

// Timers
// https://github.com/optimisme/gjs-examples/blob/master/egTimers.js
const Mainloop = imports.mainloop

const setTimeout = function(func, millis /* , ... args */) {

    let args = []
    if (arguments.length > 2) {
        args = args.slice.call(arguments, 2)
    }

    let id = Mainloop.timeout_add(millis, () => {
        func.apply(null, args)
        return false; // Stop repeating
    }, null)

    return id
}

const clearTimeout = function(id) {
    Mainloop.source_remove(id)
}

// Get application folder and add it into the imports path
// Courtesy: https://github.com/optimisme/gjs-examples/blob/master/egInfo.js
function getAppFileInfo () {
  let stack = new Error().stack,
    stackLine = stack.split('\n')[1],
    coincidence,
    path,
    file

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
    GLib.set_application_name('Gnomit Commit Editor')

    this.application = new Gtk.Application({
      application_id: 'ind.ie.gnomit',
      flags: Gio.ApplicationFlags.HANDLES_OPEN
    })

    this.application.set_option_context_parameter_string('')

    // The option context summary is displayed above the set of options
    // in the --help screen.
    this.application.set_option_context_summary(SUMMARY)

    // The option context description is displayed below the set of options
    // on the --help screen.
    this.application.set_option_context_description(COPYRIGHT)

    // Add option: --version, -v
    this.application.add_main_option(
      'version',
      'v'.charCodeAt(0),
      GLib.OptionFlags.NONE,
      GLib.OptionArg.NONE,
      'Show version number and exit',
      null
    )

    // Add option: --install, -i
    this.application.add_main_option(
      'install',
      'i'.charCodeAt(0),
      GLib.OptionFlags.NONE,
      GLib.OptionArg.NONE,
      'Install Gnomit as your default Git editor',
      null
    )

    this.application.connect('handle_local_options', (application, options) => {
      // --install, -i:
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

      // --version, -v:
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

    // Open gets called when a file is passed as a command=line argument.
    // We expect Git to pass us one file.
    this.application.connect('open', (application, files, hint) => {
      if (files.length !== 1) {
        // Error: Too many files.
        this.activate()
        return
      }

      this.commitMessageFile = files[0]
      this.commitMessageFilePath = this.commitMessageFile.get_path()

      // Try to load the commit message contents.
      const ERROR_SUMMARY="\n\nError: Could not read the Git commit message file.\n\n"

      let success = false,
      commitMessage = '',
      commitBody = '',
      commitComment = '';

      try {
        [success, commitMessage] = GLib.file_get_contents(this.commitMessageFilePath)

        // Convert the message from ByteArray to String.
        commitMessage = commitMessage.toString()

        const commitMessageLines = commitMessage.split("\n")

        // Separate the comments section from any body content that there
        // may be (e.g., an auto-generated Merge message)
        if (commitMessage[1] === '#') {
          print("IS COMMENT!!!!")
          commitComment = `\n${commitMessage}`
        } else {
          // The first line is not a comment, it’s an autogenerated
          // message. Treat it as such.
          commitBody = `${commitMessageLines[0]}`
          commitMessageLines.shift()
          commitComment = `\n${commitMessageLines.join("\n")}`
        }

        // Save the number of lines in the original commit comment
        // so we have an easy way of calculating the non-comment
        // section of the commit message.
        this.numberOfLinesInCommitComment = commitComment.split("\n").length

        // Add Pango markup to make the commented are appear
        // lighter.
        commitMessage = `${commitBody}<span foreground="#959595">${commitComment}</span>`

        // Not sure when you would get success === false without an error being
        // thrown but handling it anyway just to be safe. There doesn’t appear
        // to be any error information available.
        // Docs: http://devdocs.baznga.org/glib20~2.50.0/glib.file_get_contents
        if (!success) {
          print(`${ERROR_SUMMARY}`)
          application.quit()
        }
      } catch (error) {
        print(`${ERROR_SUMMARY}${error}\n`)
        application.quit()
      }

      // Update the text in the interface using markup.
      let startOfText = this.buffer.get_start_iter()
      this.buffer.insert_markup(startOfText, commitMessage, -1)

      // The iterator now points to the end of the inserted section.
      // Reset it to either the start of the body of the commit message
      // (if there is one) or to the very start of the text and place the
      // cursor there, ready for person to start editing it.
      startOfText = commitBody.length > 0 ? this.buffer.get_iter_at_offset(commitBody.length) : this.buffer.get_start_iter()
      this.buffer.place_cursor(startOfText)

      // Set the original comment to be non-editable.
      const nonEditableTag = Gtk.TextTag.new('NonEditable')
      nonEditableTag.editable = false
      this.buffer.tag_table.add(nonEditableTag)
      const endOfText = this.buffer.get_end_iter()
      this.buffer.apply_tag(nonEditableTag, startOfText, endOfText)

      // Save the number of lines in the commit message.
      this.previousNumberOfLinesInCommitMessage = 1

      // Show the composition interface.
      this.dialogue.show_all()
    })

    this.application.connect('startup', () => {

      // Create a builder and get it to load the interface from the Glade file.
      const builder = new Gtk.Builder()
      builder.add_from_file(`${path}/gnomit.glade`)

      // Get references to the components defined in the Glade file.
      this.dialogue = builder.get_object('dialogue')
      this.dialogue.set_icon_name('accessories-text-editor')
      this.messageText = builder.get_object('messageText')
      this.cancelButton = builder.get_object('cancelButton')
      this.commitButton = builder.get_object('commitButton')

      // Disable commit button initially as we don’t allow empty
      // messages to be committed (person can always cancel).
      // PS. set_sensitive? Really? Wow :)
      this.commitButton.set_sensitive(false)

      this.buffer = this.messageText.get_buffer()

      // Set up spell checking for the text view.
      // TODO: This is incorrectly documented. File an issue / blog.
      const gSpellTextView = Gspell.TextView.get_from_gtk_text_view(this.messageText)
      gSpellTextView.basic_setup()

      // Tag: highlight background.
      const highlightBackgroundTag = Gtk.TextTag.new(HIGHLIGHT_BACKGROUND_TAG_NAME)
      highlightBackgroundTag.background = "#ffe4e1" // minty rose
      this.buffer.tag_table.add(highlightBackgroundTag)

      const highlightText = () => {
        // Check first line length and highlight characters beyond the limit.
        let text = this.buffer.text
        let lines = text.split("\n")
        let firstLine = lines[0]
        let firstLineLength = firstLine.length

        // Get bounding iterators for the first line.
        const startOfTextIterator = this.buffer.get_start_iter()
        const endOfTextIterator = this.buffer.get_end_iter()
        let endOfFirstLineIterator = this.buffer.get_iter_at_offset(firstLineLength)

        // Start with a clean slate: remove any background highlighting on the
        // whole text. (We don’t do just the first line as someone might copy a
        // highlighted piece of the first line and paste it and we don’t want it
        // highlighted on subsequent lines if they do that.)
        this.buffer.remove_tag_by_name(HIGHLIGHT_BACKGROUND_TAG_NAME, startOfTextIterator, endOfTextIterator)

        // Highlight the overflow area, if any.
        if (firstLineLength > FIRST_LINE_CHARACTER_LIMIT) {
          let startOfOverflowIterator = this.buffer.get_iter_at_offset(FIRST_LINE_CHARACTER_LIMIT)
          this.buffer.apply_tag(highlightBackgroundTag, startOfOverflowIterator, endOfFirstLineIterator)
        }
      }

      this.buffer.connect('changed', highlightText)
      this.buffer.connect('paste-done', highlightText)

      this.buffer.connect('end-user-action', () => {
        // Due to the non-editable region, the selection for a
        // Select All is not automatically cleared by the
        // system. So let’s detect it and clear it ourselves.
        if (this.lastActionWasSelectAll) {
          this.lastActionWasSelectAll = false
          const cursorIterator = this.buffer.get_iter_at_offset(this.buffer.cursor_position)
          this.buffer.select_range(cursorIterator, cursorIterator)
        }

        // Take measurements
        let lines = this.buffer.text.split("\n")
        let firstLineLength = lines[0].length
        let cursorPosition = this.buffer.cursor_position
        let numberOfLinesInCommitMessage = lines.length + 1

        // Debug
        // print(`Len                  : ${firstLineLength}`)
        // print(`Cur                  : ${cursorPosition}`)
        // print(`Line (all, now)     : ${lines.length}`)
        // print(`Lines (all, previous): ${this.previousNumberOfLinesInCommitMessage}`)
        // print(`Lines (commit)       : ${this.numberOfLinesInCommitComment}`)
        // print('---')

        // Validation: disallow empty first line.
        let justDisallowedEmptyFirstLine = false
        if (
          /* in the correct place */
          cursorPosition === firstLineLength + 1
          /* and the first line is empty */
          && lines[0].replace(/ /g, '').length === 0
          /* and person didn’t reach here by deleting existing content */
          && numberOfLinesInCommitMessage > this.previousNumberOfLinesInCommitMessage
        ) {
          //print('Empty first line not allowed.')

          // Delete the newline
          this.buffer.backspace(
            /* iter: */ this.buffer.get_iter_at_offset(this.buffer.cursor_position),
            /* interactive: */ true,
            /* default_editable: */ true
          )

          // Update measurements as the buffer has changed.
          lines = this.buffer.text.split("\n")
          firstLineLength = lines[0].length
          cursorPosition = this.buffer.cursor_position
          numberOfLinesInCommitMessage = lines.length + 1
        }

        // Add an empty newline to separate the rest
        // of the commit message from the first (summary) line.
        if (
          /* in the correct place */
          cursorPosition === firstLineLength + 1
          && numberOfLinesInCommitMessage === this.numberOfLinesInCommitComment + 2
          /* and person didn’t reach here by deleting existing content */
          && numberOfLinesInCommitMessage > this.previousNumberOfLinesInCommitMessage
        ) {
          // print("Condition reached!\n---")

          // Insert a second newline.
          const newline = "\n"
          this.buffer.insert_interactive_at_cursor(newline, newline.length, /* default editable */ true)
        }

        // Save the number of lines in the commit message
        // for comparison in later frames.
        this.previousNumberOfLinesInCommitMessage = numberOfLinesInCommitMessage

        // Validation: Enable the Commit button only if the commit message
        // is not empty.
        let numberOfLinesInMessageExcludingComments = numberOfLinesInCommitMessage - this.numberOfLinesInCommitComment
        let commitMessageExcludingComments = ""
        for (let i = 0; i < numberOfLinesInMessageExcludingComments; i++) {
          commitMessageExcludingComments += lines[i]
        }
        commitMessageExcludingComments = commitMessageExcludingComments.replace(/ /g, '')
        const commitMessageIsEmpty = (commitMessageExcludingComments.length === 0)
        this.commitButton.set_sensitive(!commitMessageIsEmpty)
      })

      this.messageText.connect('select-all', (textView, selected) => {
        print(`Select all: ${selected}`)
        if (selected) {
          // Carry this out on the next stack frame. The selected signal
          // gets called too early (you are not able to change the
          // selection at that time.) TODO: File bug.
          setTimeout(() => {
            this.lastActionWasSelectAll = true
            // Redo the selection to limit it to the commit message
            // only (exclude the original commit comment).
            // Assumption: that the person has not added any comments
            // to their commit message themselves. But, I mean, come on!
            // this.buffer.place_cursor(this.buffer.get_start_iter())
            const mainCommitMessage = this.buffer.text.split('#')[0]
            const selectStartIterator = this.buffer.get_start_iter()
            const selectEndIterator = this.buffer.get_iter_at_offset(mainCommitMessage.length)
            // this.buffer.move_mark_by_name('selection_bound', selectEndIterator)
            this.buffer.select_range(selectStartIterator, selectEndIterator)
          }, 0)
        }
      })


      // this.buffer.connect('mark-set', (location, mark) => {

      // })

      //
      // Cancel button clicked.
      //
      this.cancelButton.connect('clicked', () => {
        this.application.quit()
      })

      //
      // Connect button clicked.
      //
      this.commitButton.connect('clicked', () => {

        let success;
        const ERROR_SUMMARY = "\n\nError: could not save your commit message.\n"

        try {
          // Save the text.
          success = GLib.file_set_contents(
            this.commitMessageFilePath,
            this.buffer.text
          )
          if (!success) {
            print(ERROR_SUMMARY)
          }
          this.application.quit()
        } catch (error) {
          print(`${ERROR_SUMMARY}${error}`)
          this.application.quit()
        }
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
      // approach to handling command-line arguments (in our case HANDLES_OPEN),
      // as there is no way to get a reference to the GOptionContext of the
      // main application to invoke its get_help() method.
      //
      // TODO: File an enhancement request about this with the GTK project.
      //
      // So, instead, as a workaround, I’m spawning another instance of
      // the app with the --help flag set and piping the output.

      try {
        let [success, standardOutput, standardError, exitStatus] = GLib.spawn_command_line_sync(`${path}/gnomit.js --help`)

        if (success) {
          print(standardOutput)
        } else {
          print(standardError)
        }
      } catch (error) {
        print (error)
      }

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
