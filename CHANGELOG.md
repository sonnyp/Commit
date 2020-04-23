# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

Nothing yet.

## [2.0.0] - 2020-04-23

Initial release under the new org.small_tech.Gnomit App ID.

### Changed

  - (Breaking Change) App ID is now org.small_tech.Gnomit.
  - Publish delay hours set to 0 to remove Flathub publishing delay.

### Removed

  - --install command-line option (which was broken, undocumented, and unnecessary).

### Added

  - Changelog.

## [1.1.0] - 2020-04-23

This release is thanks to the work of [Sonny Piers](https://github.com/sonnyp).

Note: this is the last release under the ind.ie.Gnomit App ID.

### Removed

  - Unnecessary permissions (network and dconf).

### Fixed

  - GJS warning by using ByteArray.toString.

### Changed

  - Update GNOME runtime version to 3.36.
  - Update gspell version to 1.8.3.
  - Update Meson minimum version to 0.50.
  - Hide desktop entry.
  - Reduce size of the screenshot in README.

## [1.0.7] - 2018-12-11

### Added

  - Explicit support for git merge messages (removes the command-line warning about them).

### Changed

   - Update GNOME runtime to version 3.30.

## [1.0.6] - 2018-10-27

### Added

  - Support for git add -p messages.
  - Support for rebase -i messages.

A big thank-you to Philip Chimento for reporting those issues.

## [1.0.5] - 2018-10-22

### Added

  - Dark theme support.

## [1.0.4] - 2018-10-19

### Changed

  - Gnomit has a new look thanks to [Sergey Bugaev](https://mastodon.technology/@bugaevc).

## [1.0.3] - 2018-08-26

### Added

  - Gnomit is now Unicode-aware 🤓

### Fixed

  - A couple of minor bugs.

## [1.0.2] - 2018-08-26

### Added

  - Support for tag messages

### Fixed

  - Gracefully handles auto-generated commit message bodies longer than a single line.

## [1.0.1] - 2018-08-23

Initial release.
