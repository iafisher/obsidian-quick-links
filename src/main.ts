import { Plugin } from "obsidian";

import {
  DEFAULT_SETTINGS,
  QuickLinksSettings,
  QuickLinksSettingTab,
} from "./settings";
import { markdownPostProcessor } from "./reading-mode";

export default class QuickLinksPlugin extends Plugin {
  settings: QuickLinksSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new QuickLinksSettingTab(this.app, this));
    this.registerMarkdownPostProcessor((element, context) =>
      markdownPostProcessor(element, context, this.settings)
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
