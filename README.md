# Gnomit

![Screenshot of Gnomit showing the overflow highlighting on the subject line and the automatically inserted empty line between the subject line and the rest of the commit message.](gnomit.png)

A simple Git commit message editor written in [GJS](https://gitlab.gnome.org/GNOME/gjs/wikis/Home) and inspired by the excellent [Komet app]() for macOS.

There is also a [Vala](https://wiki.gnome.org/Projects/Vala) version that I only just started working on and which is no way near being feature complete. I am using this project as a learning exercise as I begin to develop for Gnome after switching to [Pop!_OS 18.04](https://ar.al/2018/07/26/popos-18.04-the-state-of-the-art-in-linux-on-desktop/) on my main development machine.

## Important

Gnomit has spell checking implemented via [Gspell](https://wiki.gnome.org/Projects/gspell). I initially had trouble getting it running under GJS and had to install it separately (even though there was a version installed on my machine). I will be looking at packaging Gnomit up properly (maybe via Flatpack), but, in the meanwhile,
please open issues for any problems you encounter while trying to run it, including dependency issues.

## Usage

```bash
./gnomit.js --install
```

This will set up Gnomit as your default editor for Git. Then just make a commit in one of your projects.

To save your commit message, either press the Commit button or press _Ctrl+Return_.

If _gnomit.js_ is not executable, either make it so (`chmod +x gnomit.js`) or run the installation via GJS explicitly:

```bash
gjs gnomit.js --install
```

## Features

Feature-compatible (sans configuration options) with [the first release of Komet](https://github.com/zorgiepoo/Komet/releases/tag/0.1).

  * Highlights overflow of subject line when it exceeds 69 characters.
  * Inserts empty line between subject line and the rest of the message.
  * Select All selects only your commit message, not the Git commit comment.
  * The Git Commit comment is not editable.

## Author

Copyright © 2018, [Aral balkan](https://ar.al)
Copyright © 2018, [Ind.ie](https://ind.ie)

## License

GPLv3 or later. Please see [LICENSE](https://source.ind.ie/gnome/gnomit/blob/master/LICENSE) file.