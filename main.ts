import {
  App,
  MarkdownRenderChild,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

interface WikipediaLinksSettings {
  prefix: string;
  language: string;
  convertExternalLinks: boolean;
}

const DEFAULT_SETTINGS: WikipediaLinksSettings = {
  prefix: "w",
  language: "en",
  convertExternalLinks: true,
};

export default class WikipediaLinksPlugin extends Plugin {
  settings: WikipediaLinksSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new WikipediaLinksSettingTab(this.app, this));

    this.registerMarkdownPostProcessor((element, context) => {
      const prefix = this.settings.prefix + ":";
      const language = this.settings.language;
      const convertExternalLinks = this.settings.convertExternalLinks;

      const linkElements = element.querySelectorAll("a");
      for (let linkElement of linkElements) {
        const linkText = linkElement.innerText;
        if (linkText.startsWith(prefix)) {
          const linkTarget = linkText.slice(prefix.length);
          context.addChild(
            new WikipediaLink(linkElement, linkTarget, language)
          );
        } else if (
          convertExternalLinks &&
          (linkText.startsWith("http://") || linkText.startsWith("https://"))
        ) {
          context.addChild(new ExternalLink(linkElement, linkText));
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

class WikipediaLink extends MarkdownRenderChild {
  linkTarget: string;
  language: string;

  constructor(containerEl: HTMLElement, linkTarget: string, language: string) {
    super(containerEl);
    this.linkTarget = linkTarget;
    this.language = language;
  }

  onload() {
    const element = this.containerEl.createEl("a", {
      attr: {
        class: "external-link",
        href: `https://www.wikipedia.org/search-redirect.php?family=wikipedia&language=${this.language}&go=Go&search=${this.linkTarget}`,
        rel: "noopener",
        target: "_blank",
      },
      text: this.linkTarget,
    });
    this.containerEl.replaceWith(element);
  }
}

class ExternalLink extends MarkdownRenderChild {
  linkTarget: string;

  constructor(containerEl: HTMLElement, linkTarget: string) {
    super(containerEl);
    this.linkTarget = linkTarget;
  }

  onload() {
    const element = this.containerEl.createEl("a", {
      attr: {
        class: "external-link",
        href: this.linkTarget,
        rel: "noopener",
        target: "_blank",
      },
      text: this.linkTarget,
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
    this.containerEl.createEl("h2", { text: "Wikipedia Links settings" });

    new Setting(this.containerEl)
      .setName("Link prefix")
      .setDesc(
        "The prefix, followed by a colon, to turn an internal link into a Wikipedia link"
      )
      .addText((text) =>
        text.setValue(this.plugin.settings.prefix).onChange(async (value) => {
          this.plugin.settings.prefix = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(this.containerEl)
      .setName("Language")
      .setDesc("The language version of Wikipedia to use, as a language code")
      .addText((text) =>
        text.setValue(this.plugin.settings.language).onChange(async (value) => {
          this.plugin.settings.language = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(this.containerEl)
      .setName("Convert external links")
      .setDesc(
        "Treat links beginning with http:// or https:// as external links"
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.convertExternalLinks)
          .onChange(async (value) => {
            this.plugin.setings.convertExternalLinks = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
