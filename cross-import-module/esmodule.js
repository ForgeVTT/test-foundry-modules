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
    
    try {
      this.samePackage = (await import("/modules/cross-import-module/dependency.js")).default;
      console.log("CROSS-IMPORT-MODULE: Imported same package dependency.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-MODULE: Failed to import same package dependency.",
        error
      );
    }
    
    try {
      this.otherPackage = (await import("/systems/cross-import-system/dependency.js")).default;
      console.log("CROSS-IMPORT-MODULE: Imported other package dependency.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-MODULE: Failed to import other package dependency.",
        error
      );
    }

    try {
      this.foundryScript = !!((await import("/scripts/foundry.mjs")).default);
      console.log("CROSS-IMPORT-MODULE: Imported foundry script.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-MODULE: Failed to import foundry script.",
        error
      );
    }
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "cross-import-module",
      title: "Cross Import Module",
      template: `modules/cross-import-module/template.hbs`,
      width: 480,
      height: 240,
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
