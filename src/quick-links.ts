export interface QuickLinkMacro {
  prefix: string;
  target: string;
  wordSeparator: string;
}

export const DEFAULT_QUICK_LINKS: QuickLinkMacro[] = [
  // Wikipedia
  {
    prefix: "w",
    target:
      "https://www.wikipedia.org/w/index.php?title=Special:Search&search=%s",
    wordSeparator: "",
  },
  // Blank entry for the settings editor
  {
    prefix: "",
    target: "",
    wordSeparator: "",
  },
];

export interface RawLink {
  text: string;
  target: string;
  em: boolean,
}

export function transformLink(
  link: RawLink,
  quickLinksMap: Map<string, QuickLinkMacro>,
): RawLink | null {
  const linkPrefix = getLinkPrefix(link.target);
  if (linkPrefix === "") {
    return null;
  }

  const quickLink = quickLinksMap.get(linkPrefix);
  if (quickLink === undefined) {
    return null;
  }

  const linkHrefNoPrefix = link.target.slice(quickLink.prefix.length + 1);
  const displayText =
    // [](w:Whatever) --> linkText === ""
    // [[w:Whatever]] --> linkHref === linkText
    //
    // In either case, we should use "Whatever" as the display text.
    //
    // Otherwise, the user has set some custom display text and we should
    // use that.
    link.text === "" || link.target === link.text
      ? linkHrefNoPrefix
      : link.text;

  let linkTarget = quickLink.target.replace("%s", linkHrefNoPrefix);

  if (quickLink.wordSeparator !== "") {
    linkTarget = linkTarget.replace(/ +/g, quickLink.wordSeparator);
  }

  return { target: linkTarget, text: displayText, em: link.em };
}

export function getLinkPrefix(linkHref: string): string {
  const linkSplit = linkHref.split(":", 2);
  if (linkSplit.length !== 2) {
    return "";
  }
  return linkSplit[0];
}
