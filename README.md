<img style="vertical-align: middle;" src="data/icons/re.sonny.Commit.svg" width="120" height="120" align="left">

# Commit

Commit is an editor that helps you write better Git and Mercurial commit messages.<img style="vertical-align: middle;" src="data/icons/re.sonny.Commit-symbolic.svg" width="16" height="16">

![screenshot](data/screenshot.png)

https://apps.gnome.org/app/re.sonny.Commit/

<a href='https://flathub.org/apps/details/re.sonny.Commit'><img width='180' height='60' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.svg'/></a>

## Installation

[Setup flatpak](https://flatpak.org/setup/) then

```sh
flatpak install re.sonny.Commit
flatpak run re.sonny.Commit # Follow instructions
```

## Tips and trick

### Emojis

right-click ➞ Insert Emoji or use the shortcut _Ctrl+._ 🎉️
The Emoji picker works in any GNOME app 👣️

### Open Commit in the center of the screen

On GNOME you can make all new windows open in the center using

```sh
gsettings set org.gnome.mutter center-new-windows true
```

See https://gitlab.gnome.org/GNOME/mutter/-/issues/246

or set and use the move-to-center keybinding

```sh
gsettings set org.gnome.desktop.wm.keybindings move-to-center "['<Super><Control><Shift>Space']"
```

</details>

## Translation

If you'd like to help translating Commit into your language, please head over to [Weblate](https://hosted.weblate.org/engage/commit/).

<a href="https://hosted.weblate.org/engage/commit/">
  <img src="https://hosted.weblate.org/widgets/commit/-/commit/multi-auto.svg" alt="Translation status" />
</a>

Thank you for your help!

## Development

```sh
cd Commit
./re.sonny.Commit --readonly test/with-body/COMMIT_EDITMSG
```

Make changes and hit `Ctrl+Shift+Q` on the Commit window to restart it.

To pass the tests you have to install a few dependencies

```
# Install development dependencies
sudo dnf install --assumeyes npm flatpak make desktop-file-utils gjs gtk4-devel libadwaita
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
# xgettext -f po/POTFILES -o po/re.sonny.Commit.pot --no-wrap -cTRANSLATORS --from-code=UTF-8
# sed -i "s/Project-Id-Version: PACKAGE VERSION/Project-Id-Version: re.sonny.Commit/" po/re.sonny.Commit.pot
meson compile re.sonny.Commit-pot -C _build


# To create a translation
# msginit -i po/re.sonny.Commit.pot -o po/fr.po -l fr_FR.UTF-8
echo -n " fr" >> po/LINGUAS
meson compile re.sonny.Commit-update-po -C _build

# To update translations
# msgmerge -U po/*.po po/re.sonny.Commit.pot
meson compile re.sonny.Commit-update-po -C _build
```

See https://github.com/sonnyp/Commit/pull/14#issuecomment-894070878

</details>

<details>

<summary>Publish new version</summary>

- `meson compile re.sonny.Commit-update-po -C _build`
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
flatpak-builder --user --force-clean --repo=repo --install-deps-from=flathub flatpak re.sonny.Commit.json
flatpak --user remote-add --no-gpg-verify --if-not-exists Commit repo
flatpak --user install --reinstall --assumeyes Commit re.sonny.Commit
```

</details>

## Credits

Commit is a fork of [Gnomit](https://github.com/small-tech/gnomit/) wich was inspired by [Komet](https://github.com/zorgiepoo/Komet).

Many thanks to its original author [Aral Balkan](https://ar.al) of [Small Technology Foundation](https://small-tech.org).

### Contributors

- [Aral Balkan](https://ar.al)
- [Sergey Bugaev](https://mastodon.technology/@bugaevc)
- [Sonny Piers](https://github.com/sonnyp)
- [Tobias Bernard](https://tobiasbernard.com/)
- [Christopher Davis](https://social.libre.fi/brainblasted)

## Copyright

- © 2020-2022 [Sonny Piers](https://github.com/sonnyp)
- © 2018-2020 [Aral Balkan](https://ar.al), [Small Technology Foundation](https://small-tech.org)

## License

GPLv3 or later. Please see [COPYING](COPYING) file.
