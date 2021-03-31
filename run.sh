#!/bin/sh

glib-compile-resources --target=data/re.sonny.Commit.data.gresource --sourcedir=src/ src/re.sonny.Commit.data.gresource.xml
gjs $PWD/src/re.sonny.Commit "$@"
