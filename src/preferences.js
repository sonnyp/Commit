import resource from "./preferences.blp" with { type: "uri" };

import { build } from "../troll/src/builder.js";
import {
  local as config,
  TITLE_LENGTH_HINT,
  BODY_LENGTH_WRAP,
  MIN_TITLE_LENGTH_HINT,
  MAX_TITLE_LENGTH_HINT,
} from "./settings.js";

export default function Preferences({ application, update }) {
  const { window, spin_hint, spin_wrap } = build(resource);

  setupRows({ spin_hint, spin_wrap, config });
  window.connect("close-request", () => {
    saveConfig({ spin_hint, spin_wrap, config });
    update();
  });

  window.set_transient_for(application.get_active_window());
  window.set_application(application);
  window.present();

  return { window };
}

export function setupRows({ spin_hint, spin_wrap, config }) {
  spin_hint.set_range(MIN_TITLE_LENGTH_HINT, MAX_TITLE_LENGTH_HINT);
  spin_hint.get_adjustment().set_step_increment(1);
  spin_hint.get_adjustment().set_page_increment(10);
  spin_hint.set_value(config[TITLE_LENGTH_HINT]);

  spin_wrap.set_range(MIN_TITLE_LENGTH_HINT, MAX_TITLE_LENGTH_HINT);
  spin_wrap.get_adjustment().set_step_increment(1);
  spin_wrap.get_adjustment().set_page_increment(10);
  spin_wrap.set_value(config[BODY_LENGTH_WRAP]);
}

export function saveConfig({ spin_hint, spin_wrap, config }) {
  config[TITLE_LENGTH_HINT] = spin_hint.value;
  config[BODY_LENGTH_WRAP] = spin_wrap.value;
  config.save();
}
