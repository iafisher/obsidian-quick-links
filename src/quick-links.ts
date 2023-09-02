export interface QuickLink {
  prefix: string;
  target: string;
}

export const DEFAULT_QUICK_LINKS: QuickLink[] = [
  // Wikipedia
  {
    prefix: "w",
    target:
      "https://www.wikipedia.org/search-redirect.php?family=wikipedia&language=en&go=Go&search=%s",
  },
  // Blank entry for the settings editor
  {
    prefix: "",
    target: "",
  },
];

export function getLinkPrefix(linkHref: string): string {
  const linkSplit = linkHref.split(":", 2);
  if (linkSplit.length !== 2) {
    return "";
  }
  return linkSplit[0];
}
