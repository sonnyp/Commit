import resource from "./preferences.blp" with { type: "uri" };

import { build } from "../troll/src/builder.js";
import {
  local as config,
  TITLE_LENGTH_HINT,
  BODY_LENGTH_WRAP,
  MIN_TITLE_LENGTH_HINT,
  MAX_TITLE_LENGTH_HINT,
  AUTO_CAPITALIZE_TITLE,
} from "./settings.js";

export default function Preferences({ application, update }) {
  const { window, spin_hint, spin_wrap, switch_capitalize_title } =
    build(resource);

  const objects = { spin_hint, spin_wrap, switch_capitalize_title };
  setupRows({ ...objects, config });
  window.connect("closed", () => {
    saveConfig({ ...objects, config });
    update();
  });

  window.present(application.get_active_window());

  return { window };
}

export function setupRows({
  spin_hint,
  spin_wrap,
  switch_capitalize_title,
  config,
}) {
  spin_hint.set_range(MIN_TITLE_LENGTH_HINT, MAX_TITLE_LENGTH_HINT);
  spin_hint.get_adjustment().set_step_increment(1);
  spin_hint.get_adjustment().set_page_increment(10);
  spin_hint.set_value(config[TITLE_LENGTH_HINT]);

  spin_wrap.set_range(MIN_TITLE_LENGTH_HINT, MAX_TITLE_LENGTH_HINT);
  spin_wrap.get_adjustment().set_step_increment(1);
  spin_wrap.get_adjustment().set_page_increment(10);
  spin_wrap.set_value(config[BODY_LENGTH_WRAP]);

  switch_capitalize_title.active = config[AUTO_CAPITALIZE_TITLE];
}

export function saveConfig({
  spin_hint,
  spin_wrap,
  switch_capitalize_title,
  config,
}) {
  config[TITLE_LENGTH_HINT] = spin_hint.value;
  config[BODY_LENGTH_WRAP] = spin_wrap.value;
  config[AUTO_CAPITALIZE_TITLE] = switch_capitalize_title.active;
  config.save();
}
