import system from "system";
import GLib from "gi://GLib";

import { global as config } from "./settings.js";

import resource from "./welcome.blp" with { type: "uri" };
import { build } from "../troll/src/builder.js";
import { saveConfig, setupRows } from "./preferences.js";

export default function Welcome({ application }) {
  const {
    window,
    spin_hint,
    spin_wrap,
    switch_capitalize_title,
    git_text,
    git_copy,
    hg_text,
    hg_copy,
  } = build(resource);

  const objects = { spin_hint, spin_wrap, switch_capitalize_title };
  setupRows({ ...objects, config });
  application.connect("shutdown", () => {
    saveConfig({ ...objects, config });
  });

  window.set_application(application);
  if (__DEV__) window.add_css_class("devel");

  const command = getCommand();

  git_text.label = `<tt>git config --global core.editor "${command}"</tt>`;
  git_copy.connect("clicked", () => {
    git_copy.get_clipboard().set(git_text.get_text());
  });

  hg_text.label = `<tt>[ui]\neditor=${command}</tt>`;
  hg_copy.connect("clicked", () => {
    hg_copy.get_clipboard().set(hg_text.get_text());
  });

  window.present();

  return { window };
}

function getCommand() {
  const FLATPAK_ID = GLib.getenv("FLATPAK_ID");

  if (FLATPAK_ID) {
    return `flatpak run ${FLATPAK_ID}`;
  }

  const { programInvocationName } = system;
  // re.sonny.Commit
  if (programInvocationName === GLib.path_get_basename(programInvocationName)) {
    return programInvocationName;
  }

  // ./re.sonny.commit
  // /home/sonny/re.sonny.Commit
  return GLib.canonicalize_filename(
    programInvocationName,
    GLib.get_current_dir(),
  );
}
