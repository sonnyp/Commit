<img style="vertical-align: middle;" src="data/icons/re.sonny.Commit.svg" width="120" height="120" align="left">

# Commit

Commit is an editor that helps you write better Git and Mercurial commit messages.

![screenshot](data/screenshot.png)

<a href='https://flathub.org/apps/details/re.sonny.Commit'><img width='180' height='60' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.svg'/></a>

## Installation

[Setup flatpak](https://flatpak.org/setup/) then

```sh
flatpak install re.sonny.Commit
flatpak run re.sonny.Commit # Follow instructions
```

|      Distro      |                   Package Name/Link                    |                   Maintainer                    |
| :--------------: | :----------------------------------------------------: | :---------------------------------------------: |
| Arch Linux (aur) | [`commit`](https://aur.archlinux.org/packages/commit/) | [Mark Wagie](https://github.com/yochananmarqos) |

## Usage

Commit will pop up automatically when you make a commit in one of your projects.

To save your commit message, press the Commit button or the _Ctrl+Return_ key combination.

To abort and dismiss Commit, press the Cancel button or the _Escape_ key.

## Features

- Highlights overflow of title when it exceeds 50 characters (customizable)
- Inserts blank line between title and description
- Spell checking
- Comments are readonly and excluded from "Select All"
- Displays project folder and branch in window header
- Dark theme support: the overflow highlight is adjusted according to your theme
- Supports git commit messages, merge messages, tag messages, add -p messages, and rebase -i messages
- Supports Mercurial commit messages
- Welcome window when launched from desktop (or without argument)

## Tips and trick

### Open Commit in the center of the screen

On GNOME you can make all new windows open in the center using

```sh
gsettings set org.gnome.mutter center-new-windows true
```

or set and use the move-to-center keybinding

```sh
gsettings set org.gnome.desktop.wm.keybindings move-to-center "['<Super><Control><Shift>Space']"
```

</details>

## Development

```sh
cd Commit
./re.sonny.Commit test/with-body/COMMIT_EDITMSG
```

Make changes and hit `Ctrl+Shift+Q` on the Commit window to restart it.

To pass the tests you have to install a few dependencies

```
# Install development dependencies
sudo dnf install --assumeyes npm flatpak make desktop-file-utils gjs gtk3-devel libhandy
npm install
flatpak remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install --user --assumeyes --noninteractive flathub org.freedesktop.appstream-glib

# Run tests
make test
```

Flathub builds https://flathub.org/builds/#/apps/re.sonny.Commit

## Maintainer

<details>

  <summary>i18n</summary>

```sh
# To update the pot file
xgettext -f po/POTFILES -o po/re.sonny.Commit.pot --no-wrap -cTRANSLATORS --from-code=UTF-8
sed -i "s/Project-Id-Version: PACKAGE VERSION/Project-Id-Version: re.sonny.Commit/" po/re.sonny.Commit.pot

# To create a translation
msginit -i po/re.sonny.Commit.pot -o po/fr.po -l fr_FR.UTF-8

# To update translations
msgmerge -U po/*.po po/re.sonny.Commit.pot
```

See https://github.com/sonnyp/Commit/pull/14#issuecomment-894070878

</details>

<details>

<summary>Publish new version</summary>

- `make update-locales`
- Update version in `meson.build`
- git tag
- flathub

</details>

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

## Credits

Commit is a fork of [Gnomit](https://github.com/small-tech/gnomit/) wich was inspired by [Komet](https://github.com/zorgiepoo/Komet).

Many thanks to its original author [Aral balkan](https://ar.al) of [Small Technology Foundation](https://small-tech.org).

### Contributors

- [Aral Balkan](https://ar.al)
- [Sergey Bugaev](https://mastodon.technology/@bugaevc)
- [Sonny Piers](https://github.com/sonnyp)

## Copyright

- © 2020-2021 [Sonny Piers](https://github.com/sonnyp)
- © 2018-2020 [Aral balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org)

## License

GPLv3 or later. Please see [COPYING](COPYING) file.
