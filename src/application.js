const ByteArray                                = imports.byteArray
const { Gdk, Gtk, Gio, GLib, GObject, Gspell } = imports.gi
const { GnomitWindow }                         = imports.window
const { programInvocationName }                = imports.system

const SUMMARY = `Helps you write better Git commit messages.

To use, configure Git to use Gnomit as the default editor:

  git config --global core.editor "flatpak run org.small_tech.Gnomit"`

const COPYRIGHT = `Made with ♥ by Small Technology Foundation, a tiny, independent not-for-profit (https://small-tech.org).

Small Technology are everyday tools for everyday people designed to increase human welfare, not corporate profits.

Like this? Fund us! https://small-tech.org/fund-us

Copyright © 2020 Aral Balkan (https://ar.al)

License GPLv3+: GNU GPL version 3 or later (http://gnu.org/licenses/gpl.html)
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.`

const HIGHLIGHT_BACKGROUND_TAG_NAME = 'highlightBackground'

// Keep first line line-length validation in line with
// the original Komet behaviour for the time being.
// (See https://github.com/zorgiepoo/Komet/releases/tag/0.1)
const FIRST_LINE_CHARACTER_LIMIT = 69

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

// Method courtesy: https://stackoverflow.com/questions/51396490/getting-a-string-length-that-contains-unicode-character-exceeding-0xffff#comment89813733_51396686
function unicodeLength(str) {
  return [...str].length
}


// TODO: The Application class is doing everything right now. Refactor to offload
//       functionality to the dialogue and to helper objects.

var Application = GObject.registerClass({
  // Nothing yet.
}, class Application extends Gtk.Application {

  _init() {

    //
    // Set application details.
    //

    super._init({
      application_id: 'org.small_tech.Gnomit',
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

    //
    // Signal: Handle local options.
    //

    this.connect('handle_local_options', (application, options) => {
      // Handle option: --version, -v:
      //
      // Print a minimal version string based on the GNU coding standards.
      // https://www.gnu.org/prep/standards/standards.html#g_t_002d_002dversion
      if (options.contains('version')) {
        print(`Gnomit ${pkg.version}`)

        // OK.
        return 0
      }

      // Let the system handle any other command-line options.
      return -1
    })

    //
    // Signal: Open.
    //

    // Open gets called when a file is passed as a command=line argument.
    // We expect Git to pass us one file.
    this.connect('open', (application, files, hint) => {
      if (files.length !== 1) {
        // Error: Too many files.
        this.activate()
        return
      }

      this.commitMessageFile = files[0]
      this.commitMessageFilePath = this.commitMessageFile.get_path()

      //
      // Save the type of this message for later
      //

      // Generic commit message.
      const isGitCommitMessage = this.commitMessageFilePath.includes('COMMIT_EDITMSG')
      const isTestCommitMessage = this.commitMessageFilePath.includes('tests/message-with-body') || this.commitMessageFilePath.includes('tests/message-without-body')
      this.isCommitMessage = isGitCommitMessage || isTestCommitMessage

      // Git merge message.
      const isMergeMessage     = this.commitMessageFilePath.includes('MERGE_MSG')
      const isTestMergeMessage = this.commitMessageFilePath.includes('tests/merge')
      this.isMergeMessage      = isMergeMessage || isTestMergeMessage

      // Git tag message.
      const isGitTagMessage  = this.commitMessageFilePath.includes('TAG_EDITMSG')
      const isTestTagMessage = this.commitMessageFilePath.includes('tests/tag-message')
      this.isTagMessage      = isGitTagMessage || isTestTagMessage

      // AddP Hunk Edit message.
      const _isAddPHunkEditMessage     = this.commitMessageFilePath.includes('addp-hunk-edit.diff')
      const _isTestAddPHunkEditMessage = this.commitMessageFilePath.includes('tests/add-p-edit-hunk')
      this.isAddPHunkEditMessage       = _isAddPHunkEditMessage || _isTestAddPHunkEditMessage

      // Rebase message.
      const _isRebaseMessage     = this.commitMessageFilePath.includes('rebase-merge/git-rebase-todo')
      const _isTestRebaseMessage = this.commitMessageFilePath.includes('tests/rebase')
      this.isRebaseMessage       = _isRebaseMessage || _isTestRebaseMessage

      this.isTest = isTestCommitMessage || isTestTagMessage || _isTestAddPHunkEditMessage || _isTestRebaseMessage || isTestMergeMessage

      // Try to load the commit message contents.
      const ERROR_SUMMARY="\n\nError: Could not read the Git commit message file.\n\n"

      let success = false,
      commitMessage = '',
      commitBody = '',
      commitComment = '';

      try {
        [success, commitMessage] = GLib.file_get_contents(this.commitMessageFilePath)

        // Convert the message from ByteArray to String.
        commitMessage = ByteArray.toString(commitMessage)

        // Escape tag start/end as we will be using markup to populate the buffer.
        // (Otherwise, rebase -i commit messages fail, as they contain the strings
        // <commit>, <label>, etc.
        commitMessage = commitMessage.replace(/</g, '&lt;')
        commitMessage = commitMessage.replace(/>/g, '&gt;')

        // In case we need to refer to the original in the future
        const commitMessageAsOriginallyLoaded = commitMessage

        // If this is a git add -p hunk edit message, then we cannot
        // split at the first comment as the message starts with a comment.
        // Remove that comment and instead display that info in the title bar.
        if (this.isAddPHunkEditMessage) {
          commitMessage = commitMessage.substr(commitMessage.indexOf("\n")+1)
        }

        // Split the message into the commit body and comment
        let firstCommentIndex = commitMessage.indexOf('\n# ')
        commitBody = commitMessage.slice(0, firstCommentIndex)
        commitComment = commitMessage.slice(firstCommentIndex)

        // Trim any newlines there may be at the end of the commit body
        while (commitBody.length > 0 && commitBody[(commitBody.length - 1)] === "\n") {
          commitBody = commitBody.slice(0, commitBody.length - 1)
        }

        const commitCommentLines = commitComment.split("\n")
        this.numberOfLinesInCommitComment = commitCommentLines.length

        // The commit message is always in the .git directory in the
        // project directory. Get the project directory’s name by using this.
        const pathComponents = this.commitMessageFilePath.split('/')
        let projectDirectoryName = pathComponents[pathComponents.indexOf('.git') - 1]

        if (this.isTest) {
          projectDirectoryName = 'test'
        }

        let action = ''
        let detail = ''
        if (this.isCommitMessage) {
          // Try to get the branch name via a method that relies on
          // positional aspect of the branch name so it should work with
          // other languages.
          const wordsOnBranchLine = commitCommentLines[4].split(" ")
          const branchName = wordsOnBranchLine[wordsOnBranchLine.length - 1]
          action = 'commit'
          detail = branchName
        } else if (this.isMergeMessage) {
          // Display the branch name
          action = 'merge'
          detail = `branch ${commitBody.split("'")[1]}`
        } else if (this.isTagMessage) {
          // Get the version number from the message
          const version = commitCommentLines[3].slice(1).trim()
          action = 'tag'
          detail = version
        } else if (this.isAddPHunkEditMessage) {
          // git add -p: edit hunk message
          action = 'add -p'
          detail = 'manual hunk edit mode; instructions at end'
        } else if (this.isRebaseMessage) {
          action = 'rebase'
          let _detail = commitCommentLines[1].replace('# ', '')
          let _detailChunks = _detail.split(' ')
          detail = `${_detailChunks[1]} → ${_detailChunks[3]}`
        } else {
          // This should not happen.
          print(`Warning: unknown Git commit type encountered in: ${this.commitMessageFilePath}`)
        }

        // Set the title.
        this.active_window.set_title(`Git ${action}: ${projectDirectoryName} (${detail})`)

        // Add Pango markup to make the commented are appear lighter.
        commitMessage = `${commitBody}<span foreground="#959595">\n${commitComment}</span>`

        // Not sure when you would get success === false without an error being
        // thrown but handling it anyway just to be safe. There doesn’t appear
        // to be any error information available.
        // Docs: https://gjs-docs.gnome.org/glib20~2.64.1/glib.file_get_contents
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

      // Special case: for git add -p edit hunk messages, place the cursor at start.
      if (this.isAddPHunkEditMessage) {
        this.buffer.place_cursor(this.buffer.get_start_iter())
      }

      // Validate the commit button on start (if we have an auto-generated
      // body of the commit message, it should be enabled).
      this.validateCommitButton()

      // Show the composition interface.
      this.dialogue.show_all()
    })

    //
    // Signal: Startup
    //

    this.connect('startup', () => {

      this.dialogue = new GnomitWindow(this)

      // TODO: This is violating encapsulation: move to Window subclass.
      this.dialogue.set_icon_name('accessories-text-editor')
      this.messageText = this.dialogue._messageText
      this.cancelButton = this.dialogue._cancelButton
      this.commitButton = this.dialogue._commitButton
      /////

      // Disable commit button initially as we don’t allow empty
      // messages to be committed (person can always cancel).
      // PS. set_sensitive? Really? Wow :)
      this.commitButton.set_sensitive(false)

      // Exit via Escape key.
      this.dialogue.add_events(Gdk.EventMask.KEY_PRESS_MASK)
      this.dialogue.connect('key_press_event', (widget, event) => {
        let [ok, keyval] = event.get_keyval()
        if (keyval == Gdk.KEY_Escape) {
          this.quit()
          return true
        }
        return false
      })

      this.buffer = this.messageText.get_buffer()

      // Set up spell checking for the text view.
      // TODO: This is incorrectly documented. File an issue / blog.
      const gSpellTextView = Gspell.TextView.get_from_gtk_text_view(this.messageText)
      gSpellTextView.basic_setup()


      // Tag: highlight background.
      const highlightBackgroundTag = Gtk.TextTag.new(HIGHLIGHT_BACKGROUND_TAG_NAME)
      this.buffer.tag_table.add(highlightBackgroundTag)
      let setHighlightColour = () => {
        // Set the overflow text background highlight colour based on the
        // colour of the foreground text.

        // Colour shade guide for Minty Rose: https://www.color-hex.com/color/ffe4e1
        let darkForegroundHighlightColour = "#ffe4e1" // minty rose
        let lightForegroundHighlightColour = "#4c4443" // darker shade of minty rose
        var highlightColour
        let fontColour = gSpellTextView.get_view().get_style_context().get_color(Gtk.StateFlags.NORMAL)

        // Luma calculation courtesy: https://stackoverflow.com/a/12043228
        let luma = 0.2126 * fontColour.red + 0.7152 * fontColour.green + 0.0722 * fontColour.blue // ITU-R BT.709

        // As get_color() returns r/g/b values between 0 and 1, the luma calculation will
        // return values between 0 and 1 also.
        if (luma > 0.5) {
          // The foreground is light, use darker shade of original highlight colour.
          highlightColour = lightForegroundHighlightColour
        } else {
          // The foreground is dark, use original highlight colour.
          highlightColour = darkForegroundHighlightColour
        }
        highlightBackgroundTag.background = highlightColour
      }

      this.dialogue.connect('style-updated', () => {
        setHighlightColour()
      })

      const highlightText = () => {
        // Check first line length and highlight characters beyond the limit.
        const text            = this.buffer.text
        const lines           = text.split("\n")
        const firstLine       = lines[0]
        const firstLineLength = unicodeLength(firstLine)

        // Get bounding iterators for the first line.
        const startOfTextIterator    = this.buffer.get_start_iter()
        const endOfTextIterator      = this.buffer.get_end_iter()
        const endOfFirstLineIterator = this.buffer.get_iter_at_offset(firstLineLength)

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
        let lines                        = this.buffer.text.split("\n")
        let firstLineLength              = unicodeLength(lines[0])
        let cursorPosition               = this.buffer.cursor_position
        let numberOfLinesInCommitMessage = lines.length + 1

        // Validation: disallow empty first line.
        let justDisallowedEmptyFirstLine = false
        if (
          /* in the correct place */
          cursorPosition === firstLineLength + 1
          /* and the first line is empty */
          && unicodeLength(lines[0].replace(/ /g, '')) === 0
          /* and the second line is empty (to avoid
             https://source.small-tech.org/gnome/gnomit/gjs/issues/27) */
          && unicodeLength(lines[1].replace(/ /g, '')) === 0
          /* and person didn’t reach here by deleting existing content */
          && numberOfLinesInCommitMessage > this.previousNumberOfLinesInCommitMessage
        ) {
          // Delete the newline
          this.buffer.backspace(
            /* iter: */ this.buffer.get_iter_at_offset(this.buffer.cursor_position),
            /* interactive: */ true,
            /* default_editable: */ true
          )

          // Update measurements as the buffer has changed.
          lines                        = this.buffer.text.split("\n")
          firstLineLength              = unicodeLength(lines[0])
          cursorPosition               = this.buffer.cursor_position
          numberOfLinesInCommitMessage = lines.length + 1
        }

        // Add an empty newline to separate the rest
        // of the commit message from the first (summary) line.
        if (
          /* in the correct place */
          cursorPosition === firstLineLength + 1
          && numberOfLinesInCommitMessage === this.numberOfLinesInCommitComment + 3
          /* and person didn’t reach here by deleting existing content */
          && numberOfLinesInCommitMessage > this.previousNumberOfLinesInCommitMessage
        ) {
          // Insert a second newline.
          const newline = "\n"
          this.buffer.insert_interactive_at_cursor(newline, newline.length, /* default editable */ true)
        }

        // Save the number of lines in the commit message
        // for comparison in later frames.
        this.previousNumberOfLinesInCommitMessage = numberOfLinesInCommitMessage

        // Validation: Enable Commit button only if commit message is not empty.
        this.validateCommitButton()
      })

      // Only select commit message body (not the comment) on select all.
      this.messageText.connect('select-all', (textView, selected) => {
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
            const mainCommitMessage   = this.buffer.text.split('#')[0]
            const selectStartIterator = this.buffer.get_start_iter()
            const selectEndIterator   = this.buffer.get_iter_at_offset(unicodeLength(mainCommitMessage))
            // this.buffer.move_mark_by_name('selection_bound', selectEndIterator)
            this.buffer.select_range(selectStartIterator, selectEndIterator)
          }, 0)
        }
      })

      //
      // Cancel button clicked.
      //
      this.cancelButton.connect('clicked', () => {
        this.quit()
      })

      //
      // Connect button clicked.
      //
      this.commitButton.connect('clicked', () => {

        let success;
        const ERROR_SUMMARY = "\n\nError: could not save your commit message.\n"

        let textToSave = this.buffer.text

        try {
          // Save the text.
          success = GLib.file_set_contents(
            this.commitMessageFilePath,
            textToSave
          )
          if (!success) {
            print(ERROR_SUMMARY)
          }
          this.quit()
        } catch (error) {
          print(`${ERROR_SUMMARY}${error}`)
          this.quit()
        }
      })

      // Add the dialog to the application as its main window.
      this.add_window(this.dialogue)
    })


    //
    // Signal: Activate
    //

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
        let [success, standardOutput, standardError, exitStatus] = GLib.spawn_command_line_sync(`${programInvocationName} --help`)

        if (success) {
          print(ByteArray.toString(standardOutput))
        } else {
          printerr(ByteArray.toString(standardError))
        }
      } catch (error) {
        printerr (error)
      }

      this.quit()
    }

    this.connect('activate', this.activate)
  }

  // Validate the buffer and enable/disable the commit button accordingly.
  validateCommitButton () {
    // Take measurements.
    const lines = this.buffer.text.split("\n")
    const numberOfLinesInCommitMessage = lines.length + 1

    // Enable the Commit button only if the commit message is not empty.
    let numberOfLinesInMessageExcludingComments = numberOfLinesInCommitMessage - this.numberOfLinesInCommitComment
    let commitMessageExcludingComments = ""
    for (let i = 0; i < numberOfLinesInMessageExcludingComments; i++) {
      commitMessageExcludingComments += lines[i]
    }
    commitMessageExcludingComments = commitMessageExcludingComments.replace(/ /g, '')
    const commitMessageIsEmpty = (commitMessageExcludingComments.length === 0)
    this.commitButton.set_sensitive(!commitMessageIsEmpty)
  }
})
