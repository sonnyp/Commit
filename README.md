# Gnomit

A simple Git commit message editor written in [GJS](https://gitlab.gnome.org/GNOME/gjs/wikis/Home) and inspired by the excellent [Komet app]() for macOS.

There is also a very early [Vala](https://wiki.gnome.org/Projects/Vala) version that is no way near to being feature complete. I am using this project as a learning exercise as I begin to develop for Gnome after switching to [Pop!_OS 18.04](https://ar.al/2018/07/26/popos-18.04-the-state-of-the-art-in-linux-on-desktop/) on my main development machine.

## Important

Gnomit has spell checking implemented via Gspell. As this is an external dependency, you may have to install it separately. I will be looking at packaging Gnomit up properly (maybe via Flatpack), but, in the meanwhile,
please open issues for any problems you encounter while trying to run it, including dependency issues.

## Usage

```bash
./gnomit.js --install
```

This will set up Gnomit as your default editor for Git. Then just make a commit in one of your projects.

To save your commit message, either press the Commit button or press _Ctrl+Return_.

## Features

Feature-compatible (sans configuration options) with [the first release of Komet](https://github.com/zorgiepoo/Komet/releases/tag/0.1).

  * Highlights overflow of subject line when it exceeds 69 characters.
  * Inserts empty line between subject line and the rest of the message.
  * Select All selects only your commit message, not the Git commit comment.
  * The Git Commit comment is not editable.

## Author

Copyright © 2018, [Aral balkan](https://ar.al)

## License

GPLv3 or later. Please see [LICENSE](https://source.ind.ie/gnome/gnomit/blob/master/LICENSE) file.