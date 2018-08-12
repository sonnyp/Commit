using Gtk;

int main (string[] args) {
  Gtk.init (ref args);

  try {
    var builder = new Builder ();
    builder.add_from_file ("gnomit.glade");

    // Outlets.
    var dialogue = builder.get_object ("dialogue") as Dialog;
    var commitButton = builder.get_object ("commitButton") as Button;
    var cancelButton = builder.get_object ("cancelButton") as Button;
    var messageText = builder.get_object ("messageText") as TextView;

    // When the dialogue is destroyed, the app should quit.
    dialogue.destroy.connect(Gtk.main_quit);

    // Commit
    commitButton.clicked.connect(() => {
      stdout.printf("Commit button clicked");
      try {
        FileUtils.set_contents ("./test.txt", messageText.get_buffer().text);
      } catch (Error e) {
        stderr.printf ("Error: %s\n", e.message);
      }
      dialogue.destroy();
    });

    // Cancel
    cancelButton.clicked.connect(() => {
      stdout.printf("Cancel button clicked");
      dialogue.destroy();
    });

    // Load the file
    string text;
    try {
      FileUtils.get_contents ("./test.txt", out text);
      stdout.printf(text);
    } catch (Error e) {
      stderr.printf ("Error: %s\n", e.message);
    }

    messageText.get_buffer().text = text;

    // Display the interface.
    dialogue.show_all ();
    Gtk.main ();
  } catch (Error e) {
    stderr.printf ("Could not load UI: %s\n", e.message);
  }

  return 0;
}
