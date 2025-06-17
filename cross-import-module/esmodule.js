import dependencyFunction from "./dependency";

class ModuleApplication extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "cross-import-module",
      title: "Cross Import Module",
      template: `template.hbs`,
      width: 720,
      height: 720,
    });
  }
}

let module;

Hooks.once("init", () => {
  console.log("CROSS-IMPORT-MODULE: Initialization complete.");

  module = game.modules.get("cross-import-module");
  module.application = new ModuleApplication();
  console.log("CROSS-IMPORT-MODULE: Application created.");

  module.internalDependency = dependencyFunction();
  console.log("CROSS-IMPORT-MODULE: Imported internal dependency.");

  module.application.render(true);
  console.log("CROSS-IMPORT-MODULE: Application created and rendered.");
});
