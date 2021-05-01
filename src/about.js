import Gtk from "gi://Gtk";

export default function About({ application, version }) {
  // https://gjs-docs.gnome.org/gtk30~3.24.8/gtk.aboutdialog
  const dialog = new Gtk.AboutDialog({
    authors: ["Sonny Piers https://sonny.re", "Aral Balkan https://ar.al/"],
    comments: "Commit message editor",
    copyright:
      "Copyright 2020-2021 Sonny Piers\nCopyright 2018-2020 Aral balkan",
    license_type: Gtk.License.GPL_3_0,
    version,
    website: "https://github.com/sonnyp/Commit",
    transient_for: application.get_active_window(),
    // modal: true,
    logo_icon_name: "re.sonny.Commit",
  });
  dialog.add_credit_section("Contributors", [
    // Add yourself as
    // "John Doe",
    // or
    // "John Doe <john@example.com>",
    // or
    // "John Doe https://john.com",
    "Sergey Bugaev https://mastodon.technology/@bugaevc",
  ]);
  dialog.present();

  return { dialog };
}
