.PHONY: build run-host flatpak bundle test

build:
	# meson --reconfigure --prefix $(shell pwd)/install build
	meson --prefix $(shell pwd)/install build
	ninja -C build install

run-host:
	make clean
	make build
	GSETTINGS_SCHEMA_DIR=./data ./install/bin/re.sonny.Commit

flatpak:
	flatpak-builder --user  --force-clean --repo=repo --install-deps-from=flathub flatpak re.sonny.Commit.json
	flatpak --user remote-add --no-gpg-verify --if-not-exists Commit repo
	flatpak --user install --reinstall --assumeyes Commit re.sonny.Commit
	flatpak run re.sonny.Commit

bundle:
	flatpak-builder --user  --force-clean --repo=repo --install-deps-from=flathub flatpak re.sonny.Commit.json
	flatpak build-bundle repo Commit.flatpak re.sonny.Commit --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo

test:
	./node_modules/.bin/eslint --cache .
	flatpak run org.freedesktop.appstream-glib validate data/re.sonny.Commit.appdata.xml
	desktop-file-validate data/re.sonny.Commit.desktop

