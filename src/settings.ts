import { App, PluginSettingTab, Setting } from "obsidian";

import QuickLinksPlugin from "./main";
import { DEFAULT_QUICK_LINKS, QuickLink } from "./quick-links";

export interface QuickLinksSettings {
  useWikiLinkSyntax: boolean;
  quickLinks: QuickLink[];
}

export const DEFAULT_SETTINGS: QuickLinksSettings = {
  useWikiLinkSyntax: true,
  quickLinks: DEFAULT_QUICK_LINKS,
};

export class QuickLinksSettingTab extends PluginSettingTab {
  plugin: QuickLinksPlugin;

  constructor(app: App, plugin: QuickLinksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName("Use wiki link syntax")
      .setDesc(
        "Use [[w:My link]] syntax instead of [](w:My link). Note that this will cause Obsidian to treat custom links as internal links, for example in autocompletion and graph view."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useWikiLinkSyntax)
          .onChange(async (value) => {
            this.plugin.settings.useWikiLinkSyntax = value;
            await this.plugin.saveSettings();
          })
      );

    const div = this.containerEl.createEl("div");
    this.renderQuickLinksSettings(div);
  }

  renderQuickLinksSettings(containerEl: HTMLElement) {
    containerEl.empty();
    containerEl.createEl("hr");

    new Setting(containerEl)
      .setName("Manage quick links")
      .setHeading()
      .addButton((btn) => {
        btn.setButtonText("New quick link").setCta();
        btn.onClick(async (e) => {
          this.plugin.settings.quickLinks.push({
            prefix: "",
            target: "",
          });

          this.renderQuickLinksSettings(containerEl);
        });
      });

    const quickLinksArray = this.plugin.settings.quickLinks;
    for (let i = 0; i < quickLinksArray.length; i++) {
      const quickLink = quickLinksArray[i];
      new Setting(containerEl)
        .setName(`Quick link ${i + 1}`)
        .addText((text) => {
          text
            .setPlaceholder("Link prefix")
            .setValue(quickLink.prefix)
            .onChange(async (value) => {
              quickLink.prefix = value;
              await this.plugin.saveSettings();
            });
        })
        .addText((text) => {
          text
            .setPlaceholder("Target URL with %s")
            .setValue(quickLink.target)
            .onChange(async (value) => {
              quickLink.target = value;
              await this.plugin.saveSettings();
            });
        })
        .addButton((btn) => {
          btn.setButtonText("Delete").setWarning();
          btn.onClick(async (e) => {
            this.plugin.settings.quickLinks.splice(i, 1);
            await this.plugin.saveSettings();

            this.renderQuickLinksSettings(containerEl);
          });
        });
    }

    new Setting(containerEl).addButton((btn) => {
      btn.setButtonText("Reset to defaults").setWarning();
      btn.onClick(async (e) => {
        this.plugin.settings.quickLinks = DEFAULT_QUICK_LINKS;
        await this.plugin.saveSettings();

        this.renderQuickLinksSettings(containerEl);
      });
    });
  }
}
