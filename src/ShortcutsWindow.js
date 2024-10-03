import resource from "./ShortcutsWindow.blp" with { type: "uri" };
import { build } from "../troll/src/builder.js";

export default function ShortcutsWindow({ application }) {
  const { window } = build(resource, {
    /* Blueprint fails to compile if it fails to find an object
       even though the object can be exposed at runtime
       "error: Could not find object with ID app"
       TODO: file a bug report
    */
    // app: application,
    // win: application.get_active_window(),
  });
  window.set_transient_for(application.get_active_window());
  window.set_application(application);
  window.present();
}
