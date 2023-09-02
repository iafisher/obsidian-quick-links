import { MarkdownPostProcessorContext, MarkdownRenderChild } from "obsidian";

import { getLinkPrefix } from "./quick-links";
import { QuickLinksSettings } from "./settings";

export function markdownPostProcessor(
  element: HTMLElement,
  context: MarkdownPostProcessorContext,
  settings: QuickLinksSettings,
): void {
  const useWikiLinkSyntax = settings.useWikiLinkSyntax;
  const quickLinks = settings.quickLinks;

  const quickLinksMap = new Map();
  for (const quickLink of quickLinks) {
    if (quickLink.prefix === "") {
      continue;
    }

    quickLinksMap.set(quickLink.prefix, quickLink);
  }

  const linkElements = element.querySelectorAll("a");
  for (let linkElement of linkElements) {
    if (!useWikiLinkSyntax && linkElement.classList.contains("internal-link")) {
      continue;
    }

    const linkHref = linkElement.getAttribute("href") ?? "";
    const linkText = linkElement.innerText ?? "";

    const linkPrefix = getLinkPrefix(linkHref);
    if (linkPrefix === "") {
      continue;
    }

    const quickLink = quickLinksMap.get(linkPrefix);
    if (quickLink === undefined) {
      continue;
    }

    const linkHrefNoPrefix = linkHref.slice(quickLink.prefix.length + 1);
    const displayText =
      // [](w:Whatever) --> linkText === ""
      // [[w:Whatever]] --> linkHref === linkText
      //
      // In either case, we should use "Whatever" as the display text.
      //
      // Otherwise, the user has set some custom display text and we should
      // use that.
      linkText === "" || linkHref === linkText ? linkHrefNoPrefix : linkText;

    const linkTarget = quickLink.target.replace("%s", linkHrefNoPrefix);

    context.addChild(
      new QuickLinkRenderChild(linkElement, linkTarget, displayText)
    );
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
