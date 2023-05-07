import {
  App,
  MarkdownRenderChild,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

interface WikipediaLinksSettings {
  convertExternalLinks: boolean;
  quickLinks: QuickLink[];
}

interface QuickLink {
  prefix: string;
  target: string;
}

const DEFAULT_SETTINGS: WikipediaLinksSettings = {
  convertExternalLinks: true,
  quickLinks: [
    {
      prefix: "w",
      target:
        "https://www.wikipedia.org/search-redirect.php?family=wikipedia&language=en&go=Go&search=%s",
    },
  ],
};

export default class WikipediaLinksPlugin extends Plugin {
  settings: WikipediaLinksSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new WikipediaLinksSettingTab(this.app, this));

    this.registerMarkdownPostProcessor((element, context) => {
      const convertExternalLinks = this.settings.convertExternalLinks;
      const quickLinks = this.settings.quickLinks;

      const linkElements = element.querySelectorAll("a");
      for (let linkElement of linkElements) {
        const linkText = linkElement.innerText;
        if (
          convertExternalLinks &&
          (linkText.startsWith("http://") || linkText.startsWith("https://"))
        ) {
          context.addChild(
            new QuickLinkRenderChild(linkElement, linkText, linkText)
          );
        } else {
          for (const quickLink of quickLinks) {
            if (linkText.startsWith(quickLink.prefix)) {
              const displayText = linkText.slice(quickLink.prefix.length + 1);
              const linkTarget = quickLink.target.replace("%s", displayText);
              context.addChild(
                new QuickLinkRenderChild(linkElement, linkTarget, displayText)
              );
            }
          }
        }
      }
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class QuickLinkRenderChild extends MarkdownRenderChild {
  linkTarget: string;
  displayText: string;

  constructor(
    containerEl: HTMLElement,
    linkTarget: string,
    displayText: string
  ) {
    super(containerEl);
    this.linkTarget = linkTarget;
    this.displayText = displayText;
  }

  onload() {
    const element = this.containerEl.createEl("a", {
      attr: {
        class: "external-link",
        href: this.linkTarget,
        rel: "noopener",
        target: "_blank",
      },
      text: this.displayText,
    });
    this.containerEl.replaceWith(element);
  }
}

class WikipediaLinksSettingTab extends PluginSettingTab {
  plugin: WikipediaLinksPlugin;

  constructor(app: App, plugin: WikipediaLinksPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    new Setting(this.containerEl)
      .setName("Convert external links")
      .setDesc(
        "Treat links beginning with http:// or https:// as external links"
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.convertExternalLinks)
          .onChange(async (value) => {
            this.plugin.settings.convertExternalLinks = value;
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
        btn.setButtonText("Create new quick link").setCta();

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
            this.renderQuickLinksSettings(containerEl);
          });
        });
    }
  }
}
