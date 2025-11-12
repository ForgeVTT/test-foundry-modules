class SystemApplication extends Application {
  internalDependency;

  constructor(options = {}) {
    super(options);
    this.internalDependency = false;
  }

  getData() {
    return {
      internalDependency: this.internalDependency,
      samePackage: this.samePackage,
      otherPackage: this.otherPackage,
      foundryScript: this.foundryScript,
    };
  }

  async importDependencies() {
    try {
      this.internalDependency = (await import("./dependency.js")).default;
      console.log("CROSS-IMPORT-SYSTEM: Imported internal dependency.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-SYSTEM: Failed to import internal dependency.",
        error
      );
    }

    try {
      this.samePackage = (
        await import("/systems/cross-import-system/dependency.js")
      ).default;
      console.log("CROSS-IMPORT-SYSTEM: Imported same package dependency.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-SYSTEM: Failed to import same package dependency.",
        error
      );
    }

    try {
      this.otherPackage = (
        await import("/modules/cross-import-module/dependency.js")
      ).default;
      console.log("CROSS-IMPORT-SYSTEM: Imported other package dependency.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-SYSTEM: Failed to import other package dependency.",
        error
      );
    }

    try {
      this.foundryScript = !!(await import("/scripts/foundry.mjs")).default;
      console.log("CROSS-IMPORT-SYSTEM: Imported foundry script.");
    } catch (error) {
      console.error(
        "CROSS-IMPORT-SYSTEM: Failed to import foundry script.",
        error
      );
    }
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "cross-import-system",
      title: "Cross Import System",
      template: `systems/cross-import-system/template.hbs`,
      width: 480,
      height: 240,
    });
  }
}

Hooks.once("init", () => {
  console.log("CROSS-IMPORT-SYSTEM: Initialization...");

  const application = new SystemApplication();
  application.importDependencies().then(() => {
    application.render(true);
    console.log("CROSS-IMPORT-SYSTEM: Application rendered.");
  });
});
