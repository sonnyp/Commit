<img style="vertical-align: middle;" src="data/icons/re.sonny.Commit.svg" width="120" height="120">

Commit message editor

# Commit

Commit is an editor that helps you write better Git and Mercurial commit messages.

<a href='https://flathub.org/apps/details/re.sonny.Commit'><img width='180' height='60' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.svg'/></a>

![screenshot](data/screenshot.png)

## Installation

[Setup flatpak](https://flatpak.org/setup/) then

```sh
flatpak install re.sonny.Commit
flatpak run re.sonny.Commit # Follow instructions
```

## Usage

Commit will pop up automatically when you make a commit in one of your projects.

To save your commit message, press the Commit button or the _Ctrl+Return_ key combination.

To abort and dismiss Commit, press the Cancel button or the _Escape_ key.

## Features

- Highlights overflow of subject line when it exceeds 69 characters
- Inserts blank line between subject line and description
- Spell checking
- Comments are readonly and excluded from "Select All"
- Displays project folder and branch in window header
- Dark theme support: the overflow highlight is adjusted according to your theme
- Supports git commit messages, merge messages, tag messages, add -p messages, and rebase -i messages
- Supports Mercurial commit messages
- Welcome window when launched from desktop (or without argument)

## Development

```sh
cd Commit
./re.sonny.Commit test/with-body/COMMIT_EDITMSG
```

Make changes and hit `Ctrl+Shift+Q` on the Commit window to restart it.

To pass the tests you will have to install a few dependencies

```
# Install development dependencies
sudo dnf install --assumeyes npm flatpak make desktop-file-utils gjs gtk3-devel
npm install
flatpak remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install --user --assumeyes --noninteractive flathub org.freedesktop.appstream-glib

# Run tests
make test
```

## Building

<details>
  <summary>host</summary>

```sh
cd Commit
meson --prefix $PWD/install build
ninja -C build install
```

</details>

<details>
  <summary>Flatpak</summary>

Use [GNOME Builder](https://wiki.gnome.org/Apps/Builder) or

```sh
cd Commit
flatpak-builder --user --force-clean --repo=repo --install-deps-from=flathub flatpak re.sonny.Commit.yaml
flatpak --user remote-add --no-gpg-verify --if-not-exists Commit repo
flatpak --user install --reinstall --assumeyes Commit re.sonny.Commit
```

</details>

## Contributors

- [Aral Balkan](https://ar.al)
- [Sergey Bugaev](https://mastodon.technology/@bugaevc)
- [Sonny Piers](https://github.com/sonnyp)

## Copyright

- © 2020-2021 Sonny Piers
- © 2018-2020 [Aral balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org)

## License

GPLv3 or later. Please see [COPYING](COPYING) file.
