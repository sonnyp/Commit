# Gnomit

<img src="gnomit.png" width="466" height="240" alt="Screenshot of Gnomit showing the overflow highlighting on the subject line and the automatically inserted empty line between the subject line and the rest of the commit message."/>

Gnomit is a simple Git commit message editor for Gnome, inspired by the excellent [Komet app](https://github.com/zorgiepoo/Komet) for macOS.

Gnomit is written in [GJS](https://gitlab.gnome.org/GNOME/gjs/wikis/Home)[^1], uses [Flatpak](https://www.flatpak.org/), and is built with [Gnome Builder](https://wiki.gnome.org/Apps/Builder).

## Features

  - Highlights overflow of subject line when it exceeds 69 characters.
  - Inserts empty line between subject line and rest of message.
  - Has spell checking.
  - Select All selects only your commit message, not the Git commit comment.
  - Displays project folder and branch in window header.
  - Git Commit comment is not editable.
  - Dark theme support: the overflow highlight is adjusted according to your theme.

## Like this? Fund us!

[Small Technology Foundation](https://small-tech.org) is a tiny, independent not-for-profit.

We exist in part thanks to patronage by people like you. If you share [our vision](https://small-tech.org/about/#small-technology) and want to support our work, please [become a patron or donate to us](https://small-tech.org/fund-us) today and help us continue to exist.

## Installation

You can install Gnomit using [Gnome Software](https://wiki.gnome.org/Apps/Software) and [Pop!_Shop](https://github.com/pop-os/shop) ([Pop!_OS](https://system76.com/pop) 20.04+), [from Flathub](https://flathub.org/apps/details/re.sonny.Commit), or from [my web site](https://ar.al).

### Gnome Software & Pop!_Shop

1. Launch Gnome Software/Pop!_Shop and search for Gnomit.
2. Hit the _Install_ button.
3. Set Gnomit as your Git editor:

    ```sh
    git config --global core.editor "flatpak run re.sonny.Commit"
    ```

### Flathub

1. Make sure you’ve [set up Flathub](https://flatpak.org/setup/).

2. In Terminal:

    ```sh
    flatpak install flathub re.sonny.Commit
    ```

3. Set Gnomit as your Git editor:

    ```sh
    git config --global core.editor "flatpak run re.sonny.Commit"
    ```

### From my web site

Installing from Gnome Software/Pop!_Shop or Flathub is recommeded as you will be notified of updates and can easily update them.

That said, it is nice not to have to rely solely on centralised App Stores.

So, if you want to, you can also install Gnomit directly from my web site:

  1. Download [Gnomit version 2.0.0](https://ar.al/downloads/gnomit/2.0.0/re.sonny.Commit.flatpak).

  2. In Terminal, from the directory you downloaded the Gnomit flatpak to:

      ```sh
      flatpak install re.sonny.Commit.flatpak
      ```

  3. Set Gnomit as your Git editor:

      ```sh
      git config --global core.editor "flatpak run re.sonny.Commit"
      ```

## Usage

Gnomit will pop up automatically when you make a commit in one of your projects.

To save your commit message, either press the Commit button or press _Ctrl+Return_.

To dismiss Gnomit and cancel your commit message, press _Escape_.

## Help

To see the help screen, in Terminal:

```sh
flatpak run re.sonny.Commit --help
```

## Known issues

### Does not use your system theme

This is a Flatpak issue. Gnomit will use your system theme [if it is installed via Flatpak](https://www.linuxuprising.com/2018/05/how-to-get-flatpak-apps-to-use-correct.html).

## Development notes

The following setting in _re.sonny.Commit.json_ allows the app to use mock data when run from Gnome Builder. If you want to test the behaviour of the app when it receives no command-line arguments from within Builder, remove this line. Also note that this path is relative to your home folder. You must update it to point to where you stored your Gnomit working directory for your Builder build to succeed.

```json
"x-run-args" : [
    "small-tech/gnomit/gjs/tests/message-with-body"
],
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

## Deployment Notes

The following setting is hardcoded to the source folder and is required by the deployment script. Since I’m the only one with deployment privileges at the moment, you should be able to ignore this.

```json
"sources" : [
  {
    "type" : "git",
    "url" : "file:///home/aral/small-tech/gnomit/gjs"
  }
]
```

Also, note that if you change where the source is located, you will also have to delete the `local-gnomit-repository` flathub repository that is added as a path to your local Flatpak repository:

```sh
flatpak remote-delete local-gnomit-repository
```

The deployment script will recreate it with the correct path for you.

## Contributors

  * [Aral Balkan](https://ar.al)
  * [Sergey Bugaev](https://mastodon.technology/@bugaevc)
  * [Sonny Piers](https://github.com/sonnyp)

## Like this? Fund us!

[Small Technology Foundation](https://small-tech.org) is a tiny, independent not-for-profit.

We exist in part thanks to patronage by people like you. If you share [our vision](https://small-tech.org/about/#small-technology) and want to support our work, please [become a patron or donate to us](https://small-tech.org/fund-us) today and help us continue to exist.

## Copyright

Copyright © 2020 [Aral balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org)

## License

GPLv3 or later. Please see [LICENSE](https://source.small-tech.org/gnome/gnomit/blob/master/LICENSE) file.


[^1]: There is also a [Vala](https://wiki.gnome.org/Projects/Vala) [version](https://source.small-tech.org/gnome/gnomit/vala) that is far from feature complete. This project was originally a learning exercise to familiarise myself with GNOME/GTK/Linux development after switching my development machine to a Linux laptop running [Pop!_OS 18.04](https://ar.al/2018/07/26/popos-18.04-the-state-of-the-art-in-linux-on-desktop/) back in 2018.
