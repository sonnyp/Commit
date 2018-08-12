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
      messageText.get_buffer().text += "Hello";
      dialogue.destroy();
    });

    // Cancel
    cancelButton.clicked.connect(() => {
      stdout.printf("Cancel button clicked");
      dialogue.destroy();
    });

    // Display the interface.
    dialogue.show_all ();
    Gtk.main ();
  } catch (Error e) {
    stderr.printf ("Could not load UI: %s\n", e.message);
  }

  return 0;
}
