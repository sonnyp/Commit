# Gnomit

<img src="gnomit.png" width="466" height="240" alt="Screenshot of Gnomit showing the overflow highlighting on the subject line and the automatically inserted empty line between the subject line and the rest of the commit message."/>

Gnomit is a simple Git commit message editor for Gnome, inspired by the excellent [Komet app](https://github.com/zorgiepoo/Komet) for macOS.

Gnomit is written in [GJS](https://gitlab.gnome.org/GNOME/gjs/wikis/Home)[^1], uses [Flatpak](https://www.flatpak.org/), and is built with [Gnome Builder](https://wiki.gnome.org/Apps/Builder).

## Installation

You can install Gnomit [via Gnome Software](https://wiki.gnome.org/Apps/Software), [from Flathub](https://flathub.org/apps/details/ind.ie.Gnomit), or from my web site.

### Gnome Software

1. Launch Gnome Software and search for Gnomit.
2. Hit the _Install_ button.
3. Set Gnomit as your Git editor:

    ```bash
    git config --global core.editor "flatpak run org.small-tech.Gnomit"
    ```


### Flathub

1. Make sure you’ve [set up Flathub](https://flatpak.org/setup/).

2. In Terminal:

    ```bash
    flatpak install flathub org.small-tech.Gnomit
    ```
3. Set Gnomit as your Git editor:

    ```bash
    git config --global core.editor "flatpak run org.small-tech.Gnomit"
    ```

## Usage

Gnomit will pop up automatically when you make a commit in one of your projects.

To save your commit message, either press the Commit button or press _Ctrl+Return_.

To dismiss Gnomit and cancel your commit message, press _Escape_.

## Features

  - Highlights overflow of subject line when it exceeds 69 characters.
  - Inserts empty line between subject line and rest of message.
  - Has spell checking.
  - Select All selects only your commit message, not the Git commit comment.
  - Displays project folder and branch in window header.
  - Git Commit comment is not editable.
  - Dark theme support: the overflow highlight is adjusted according to your theme.

## Known issues

### Does not use your system theme

This is a Flatpak issue. Gnomit will use your system theme [if it is installed via Flatpak](https://www.linuxuprising.com/2018/05/how-to-get-flatpak-apps-to-use-correct.html).

## Development notes

The following setting in _source.org.Gnomit.json_ allows the app to use mock data when run from Gnome Builder. If you want to test the behaviour of the app when it receives no command-line arguments from within Builder, remove this line. Also note that this path is relative to your home folder. You must update it to point to where you stored your Gnomit working directory for your Builder build to succeed.

```json
"x-run-args" : [
    "small-tech/gnomit/gjs/tests/message-with-body"
],
```

Similarly, the following setting is hardcoded to the source folder and is required by the deployment script:

```json
"sources" : [
  {
    "type" : "git",
    "url" : "file:///home/aral/ind.ie/gnomit/gjs"
  }
]
```

## Deployment

To publish to Flathub (proper credentials required):

1. Remember to update Flatpak metadata, including release notes.
2. Update the version string in the main _meson.build_ file.
3. Tag the release in Git and push your tags.
4. Run the publish script:

    ```sh
    ./publish-to-flathub <tag>
    ```

    The script will create the Flathub build, run it so you can test it, and then prompt you if you want to deploy to Flathub.

    That’s it! Then wait for the changes to propagate on the Flathub web site.

## Contributors

  * [Aral balkan](https://ar.al)
  * [Sergey Bugaev](https://mastodon.technology/@bugaevc)
  * [Sonny Piers](https://github.com/sonnyp)

## Copyright

Copyright © 2020 [Aral balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org)

## License

GPLv3 or later. Please see [LICENSE](https://source.small-tech.org/gnome/gnomit/blob/master/LICENSE) file.


[^1]: There is also a [Vala](https://wiki.gnome.org/Projects/Vala) [version](https://source.small-tech.org/gnome/gnomit/vala) that is far from feature complete. This project was originally a learning exercise to familiarise myself with GNOME/GTK/Linux development after switching my development machine to a Linux laptop running [Pop!_OS 18.04](https://ar.al/2018/07/26/popos-18.04-the-state-of-the-art-in-linux-on-desktop/) back in 2018.
