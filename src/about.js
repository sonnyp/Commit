import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import { gettext as _ } from "gettext";

export default function About() {
  const dialog = new Adw.AboutDialog({
    application_name: "Commit",
    developers: ["Sonny Piers https://sonny.re", "Aral Balkan https://ar.al/"],
    artists: ["Tobias Bernard <tbernard@gnome.org>"],
    copyright: "© 2020-2025 Sonny Piers\n© 2018-2020 Aral Balkan",
    license_type: Gtk.License.GPL_3_0,
    version: pkg.version,
    website: "https://commit.sonny.re",
    issue_url: "https://commit.sonny.re/feedback",
    application_icon: "re.sonny.Commit",
    // TRANSLATORS: eg. 'Translator Name <your.email@domain.com>' or 'Translator Name https://website.example'
    translator_credits: _("translator-credits"),
  });
  dialog.add_credit_section("Contributors", [
    // Add yourself as
    // "John Doe",
    // or
    // "John Doe <john@example.com>",
    // or
    // "John Doe https://john.com",
    "Sergey Bugaev https://floss.social/@bugaevc",
    "Christopher Davis https://social.libre.fi/brainblasted",
    "axtlos https://github.com/axtloss",
    "Felipe Kinoshita https://mastodon.social/@fkinoshita",
    "EncryptedEasty https://github.com/EncryptedEasty",
  ]);
  dialog.present(null);

  return { dialog };
}
