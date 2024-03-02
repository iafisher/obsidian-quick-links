import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";

import { RawLink, getLinkPrefix, transformLink } from "./quick-links";
import { QuickLinksSettings, getQuickLinksMap } from "./settings";

export function markdownPostProcessor(
  element: HTMLElement,
  context: MarkdownPostProcessorContext,
  settings: QuickLinksSettings
): void {
  const useWikiLinkSyntax = settings.useWikiLinkSyntax;
  const quickLinksMap = getQuickLinksMap(settings);

  const linkElements = element.querySelectorAll("a");
  for (let linkElement of linkElements) {
    if (!useWikiLinkSyntax && linkElement.classList.contains("internal-link")) {
      continue;
    }

    const linkHref = linkElement.getAttribute("href") ?? "";
    const linkText = linkElement.innerText ?? "";
    const rawLink = { text: linkText, target: linkHref, em: false };
    const maybeLink = transformLink(rawLink, quickLinksMap);
    if (maybeLink !== null) {
      context.addChild(new QuickLinkRenderChild(linkElement, maybeLink));
    }
  }
}

class QuickLinkRenderChild extends MarkdownRenderChild {
  link: RawLink;

  constructor(containerEl: HTMLElement, link: RawLink) {
    super(containerEl);
    this.link = link;
  }

  onload() {
    const element = this.containerEl.createEl("a", {
      attr: {
        class: "external-link",
        href: this.link.target,
        rel: "noopener",
        target: "_blank",
      },
      text: this.link.text,
    });
    this.containerEl.replaceWith(element);
  }
}
