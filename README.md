# Gnomit

![Screenshot of Gnomit showing the overflow highlighting on the subject line and the automatically inserted empty line between the subject line and the rest of the commit message.](gnomit.png)

A simple Git commit message editor for Gnome, inspired by the excellent [Komet app](https://github.com/zorgiepoo/Komet) for macOS.

Gnomit is written in [GJS](https://gitlab.gnome.org/GNOME/gjs/wikis/Home). There is also a [Vala](https://wiki.gnome.org/Projects/Vala) [version](https://source.ind.ie/gnome/gnomit/vala) that I only just started working on and which is no way near being feature complete. I am using this project as a learning exercise as I begin to develop for Gnome after switching to [Pop!_OS 18.04](https://ar.al/2018/07/26/popos-18.04-the-state-of-the-art-in-linux-on-desktop/) on my main development machine.

This is the Flatpak branch, built with Gnome Builder.

## Work in progress

This branch is a work in progress.

The `--install` method of having Gnomit set itself as the default Git editor does not work.

Given that I am now using Flatpak, I will look at making it do so upon installation as part of the installation process and remove this feature.

## Usage

Once this branch is merged into master, I will provide a Flatpak installer. In the meanwhile, if you wan’t to run this version, clone the repository and use Gnome Builder to build it.

Then, to set it up as your default Git editor:

```bash
git config --global core.editor 'flatpak run ind.ie.Gnomit'
```

Then just make a commit in one of your projects.

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

Compared to directly running the GJS script, the Flatpak version has a noticable delay which would put me off of using it.

Reportedly, the issue with slow start-up times [has been fixed](https://blogs.gnome.org/alexl/2018/01/16/fixing-flatpak-startup-times/) but we won’t be seeing the improvements until Linux distributions start pushing out version 2.13.0 of the _fontconfig_ package. It remains to be seen what the performance will be like once that fix lands.

Also, I’m interested in seeing if the Vala version is considerably faster in this regard.   

## Development notes

Add the following to ind.ie.Gnomit.json to test the app using command-line arguments from Gnome Builder:

```json
    "x-run-args" : [
        "sandbox/gjs/tests/message-with-body"
    ],
```

## Author

Copyright © 2018 [Aral balkan](https://ar.al), © 2018 [Ind.ie](https://ind.ie)

## License

GPLv3 or later. Please see [LICENSE](https://source.ind.ie/gnome/gnomit/blob/master/LICENSE) file.
