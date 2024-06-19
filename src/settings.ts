import { App, PluginSettingTab, Setting } from "obsidian";

import QuickLinksPlugin from "./main";
import { DEFAULT_QUICK_LINKS, QuickLinkMacro } from "./quick-links";

export interface QuickLinksSettings {
  useWikiLinkSyntax: boolean;
  quickLinks: QuickLinkMacro[];
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

    const quickLinksArray = this.plugin.settings.quickLinks;
    for (let i = 0; i < quickLinksArray.length; i++) {
      const quickLink = quickLinksArray[i];

      const el = containerEl.createEl("div");
      new Setting(el)
        .setName(`Quick link ${i + 1}`)
        .setHeading()
        .addButton((btn) => {
          btn.setButtonText("Delete").setWarning();
          btn.onClick(async (e) => {
            this.plugin.settings.quickLinks.splice(i, 1);
            await this.plugin.saveSettings();

            this.renderQuickLinksSettings(containerEl);
          });
        });

      new Setting(el)
        .setName("Link prefix")
        .setDesc("e.g., 'w' for [[w:...]]")
        .addText((text) => {
          text
            .setValue(quickLink.prefix)
            .onChange(async (value) => {
              quickLink.prefix = value;
              await this.plugin.saveSettings();
            });
        });

      new Setting(el)
        .setName("Target URL")
        .setDesc("Put %s as a placeholder for the text of the link.")
        .addText((text) => {
          text
            .setValue(quickLink.target)
            .onChange(async (value) => {
              quickLink.target = value;
              await this.plugin.saveSettings();
            });
        });

      new Setting(el)
        .setName("Word separator")
        .setDesc("If set, spaces in the link text will be replaced by this character (e.g., an underscore).")
        .addText((text) => {
          text
          .setValue(quickLink.wordSeparator)
          .onChange(async (value) => {
            quickLink.wordSeparator = value;
            await this.plugin.saveSettings();
          });
        });
    }

    new Setting(containerEl)
      .addButton((btn) => {
        btn.setButtonText("New quick link").setCta();
        btn.onClick(async (e) => {
          this.plugin.settings.quickLinks.push({
            prefix: "",
            target: "",
            wordSeparator: "",
          });

          this.renderQuickLinksSettings(containerEl);
        });
      })
      .addButton((btn) => {
        btn.setButtonText("Reset to defaults").setWarning();
        btn.onClick(async (e) => {
          this.plugin.settings.quickLinks = DEFAULT_QUICK_LINKS;
          await this.plugin.saveSettings();

          this.renderQuickLinksSettings(containerEl);
        });
      });
  }
}

export function getQuickLinksMap(settings: QuickLinksSettings): Map<string, QuickLinkMacro> {
  const quickLinks = settings.quickLinks;

  const quickLinksMap = new Map();
  for (const quickLink of quickLinks) {
    if (quickLink.prefix === "") {
      continue;
    }

    quickLinksMap.set(quickLink.prefix, quickLink);
  }

  return quickLinksMap;
}
