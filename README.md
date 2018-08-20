# Gnomit

![Screenshot of Gnomit showing the overflow highlighting on the subject line and the automatically inserted empty line between the subject line and the rest of the commit message.](gnomit.png)

Gnomit is a simple Git commit message editor for Gnome, inspired by the excellent [Komet app](https://github.com/zorgiepoo/Komet) for macOS.

Gnomit is written in [GJS](https://gitlab.gnome.org/GNOME/gjs/wikis/Home)[^1], uses [Flatpak](https://www.flatpak.org/), and is built with [Gnome Builder](https://wiki.gnome.org/Apps/Builder).

## Installation

I plan on streamlining the installation process by submitting Gnomit to [Flathub](https://flathub.org/home) and I also plan on hosting a Flatpak repository at Ind.ie but, in the meanwhile:

1. Download the [Gnomit Flatpak bundle](https://ind.ie/downloads/gnomit/1.0/ind.ie.Gnomit.flatpak) (403.6 kB) from [my personal web site](https://ar.al).

2. Verify that the file you downloaded is the one I uploaded by running the following command in Terminal from the directory you downloaded the Gnomit Flatpak bundle into:

    ```bash
    if [ "$(shasum -a 256 ind.ie.Gnomit.flatpak)" = "6c068fd16489a7ddc35dd53c906aeb481b40ae7a600655f0bc5a78af453ca818  ind.ie.Gnomit.flatpak" ]; then echo 'Download valid.'; else echo 'Download invalid. DO NOT INSTALL. Please alert aral@ind.ie.'; fi
    ```

3. Install it:

    ```bash
    flatpak install ind.ie.Gnomit.flatpak
    ```

    Once it installs, you should see the message _Now at a1d9a6ad1add._

4. Set Gnomit as your Git editor:

    ```bash
    git config --global core.editor "flatpak run ind.ie.Gnomit"
    ```

    (I plan on looking into [automatically registering Gnomit during the Flatpak installation process](https://source.ind.ie/gnome/gnomit/gjs/issues/22) to remove this step .)

## Usage

Once you’ve installed Gnomit, just make a commit in one of your projects and it should pop up on demand.

To save your commit message, either press the Commit button or press _Ctrl+Return_.

## Features

Feature-compatible (sans configuration options) with [the first release of Komet](https://github.com/zorgiepoo/Komet/releases/tag/0.1).

  * Highlights overflow of subject line when it exceeds 69 characters.
  * Inserts empty line between subject line and the rest of the message.
  * Has spell checking.
  * Select All selects only your commit message, not the Git commit comment.
  * Displays the project folder and branch in the window header.
  * The Git Commit comment is not editable.
  
## Known issues

### Slow start-up time

Compared to [directly running the GJS script](https://source.ind.ie/gnome/gnomit/gjs/tree/bare), the Flatpak version has a noticable delay before the Gnomit dialogue pops up.

Reportedly, the issue with slow start-up times [has been fixed](https://blogs.gnome.org/alexl/2018/01/16/fixing-flatpak-startup-times/) but we won’t be seeing the improvements until Linux distributions start pushing out version 2.13.0 of the _fontconfig_ package. My own Pop!_OS 18.04 distribution has it at 2.12.6. It remains to be seen what the performance will be like once that fix lands.

Also, I’m interested in seeing if [the Vala version](https://source.ind.ie/gnome/gnomit/vala) will perform any differently in this regard. I plan to [benchmark startup times](https://source.ind.ie/gnome/gnomit/gjs/issues/23) to get better insight into this.

## Development notes

The following setting in _ind.ie.Gnomit.json_ allows the app to use mock data when run from Gnome Builder. If you want to test the behaviour of the app when it receives no command-line arguments from within Builder, remove this line.

```json
    "x-run-args" : [
        "sandbox/gjs/tests/message-with-body"
    ],
```

## Author

Copyright © 2018 [Aral balkan](https://ar.al), © 2018 [Ind.ie](https://ind.ie)

## License

GPLv3 or later. Please see [LICENSE](https://source.ind.ie/gnome/gnomit/blob/master/LICENSE) file.

## Footnotes

[^1]: There is also a [Vala](https://wiki.gnome.org/Projects/Vala) [version](https://source.ind.ie/gnome/gnomit/vala) that I only just started working on and which is no way near being feature complete. I am using this project as a learning exercise as I begin to develop for Gnome after switching to [Pop!_OS 18.04](https://ar.al/2018/07/26/popos-18.04-the-state-of-the-art-in-linux-on-desktop/) on my main development machine.
