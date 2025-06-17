class ModuleApplication extends Application {
  internalDependency;

  constructor(options = {}) {
    super(options);
    this.internalDependency = false;
  }

  getData() {
    return {
      internalDependency: this.internalDependency,
    };
  }

  async importDependencies() {
    try {
      this.internalDependency = (await import("./dependency.js")).default;
      console.log("CROSS-IMPORT-MODULE: Imported internal dependency.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-MODULE: Failed to import internal dependency.",
        error
      );
    }
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "cross-import-module",
      title: "Cross Import Module",
      template: `modules/cross-import-module/template.hbs`,
      width: 720,
      height: 720,
    });
  }
}

let module;

Hooks.once("init", () => {
  console.log("CROSS-IMPORT-MODULE: Initialization...");

  module = game.modules.get("cross-import-module");
  module.application = new ModuleApplication();
  module.application.importDependencies().then(() => {

    module.application.render(true);
    console.log("CROSS-IMPORT-MODULE: Application rendered.");
  });
});
