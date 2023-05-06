import { MarkdownRenderChild, Plugin } from "obsidian";

const WIKIPEDIA_PREFIX = "w:";

export default class WikipediaLinksPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((element, context) => {
      const linkElements = element.querySelectorAll("a");
      for (let linkElement of linkElements) {
        const linkText = linkElement.innerText;
        if (linkText.startsWith(WIKIPEDIA_PREFIX)) {
          const linkTarget = linkText.slice(WIKIPEDIA_PREFIX.length);
          context.addChild(new WikipediaLink(linkElement, linkTarget));
        }
      }
    });
  }
}

export class WikipediaLink extends MarkdownRenderChild {
  text: string;

  constructor(containerEl: HTMLElement, linkTarget: string) {
    super(containerEl);
    this.linkTarget = linkTarget;
  }

  onload() {
    const element = this.containerEl.createEl("a", {
      attr: {
        href:
          "https://www.wikipedia.org/search-redirect.php?family=wikipedia&language=en,en&go=Go&search=" +
          this.linkTarget,
      },
      text: this.linkTarget,
    });
    this.containerEl.replaceWith(element);
  }
}
