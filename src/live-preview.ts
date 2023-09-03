import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { SyntaxNode, SyntaxNodeRef } from "@lezer/common";
import { editorLivePreviewField } from "obsidian";
import { QuickLinksSettings, getQuickLinksMap } from "./settings";
import { QuickLinkMacro, RawLink, transformLink } from "./quick-links";

interface QuickLinkSlice {
  linkToInsert: RawLink;
  // was the original link an external link?
  externalLink: boolean;
  from: number;
  to: number;
}

class LivePreviewQuickLinksPluginValue implements PluginValue {
  decorations: DecorationSet;
  private slices: QuickLinkSlice[];

  constructor(view: EditorView) {
    this.slices = [];
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    if (!view.state.field(editorLivePreviewField)) {
      return Decoration.none;
    }

    const builder = new RangeSetBuilder<Decoration>();
    this.slices = [];
    this.findQuickLinks(view, this.slices);
    this.processQuickLinks(view, builder);
    return builder.finish();
  }

  findQuickLinks(view: EditorView, slices: QuickLinkSlice[]): void {
    // TODO: find a better way to access this
    const settings: QuickLinksSettings =
      // @ts-ignore
      app.plugins.plugins["quick-links"].settings;
    const quickLinksMap = getQuickLinksMap(settings);

    // collect nodes into a flat list
    const nodes: SyntaxNode[] = [];
    for (let { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter: (node: SyntaxNodeRef) => {
          nodes.push(node.node);
        },
      });
    }

    // three kinds of links: plain internal, piped internal, and external
    //
    // each consists of a certain sequence of nodes
    if (settings.useWikiLinkSyntax) {
      // e.g., "[[w:New York City]]"
      const plainInternalLinkPattern = [
        "formatting-link_formatting-link-start",
        "hmd-internal-link",
        "formatting-link_formatting-link-end",
      ];
      for (const chunk of findChunks(nodes, plainInternalLinkPattern)) {
        console.assert(chunk.length === 3);
        const from = chunk[0].from;
        const to = chunk[chunk.length - 1].to;
        const target = view.state.sliceDoc(chunk[1].from, chunk[1].to);
  
        const link = { text: "", target };
        this.handleLink(link, false, { from, to }, slices, quickLinksMap);
      }
  
      // e.g., "[[w:Los Angeles|L.A.]]"
      const pipedInternalLinkPattern = [
        "formatting-link_formatting-link-start",
        "hmd-internal-link_link-has-alias",
        "hmd-internal-link_link-alias-pipe",
        "hmd-internal-link_link-alias",
        "formatting-link_formatting-link-end",
      ];
      for (const chunk of findChunks(nodes, pipedInternalLinkPattern)) {
        console.assert(chunk.length === 5);
        const from = chunk[0].from;
        const to = chunk[chunk.length - 1].to;
        const target = view.state.sliceDoc(chunk[1].from, chunk[1].to);
        const text = view.state.sliceDoc(chunk[3].from, chunk[3].to);
  
        const link = { text, target };
        this.handleLink(link, false, { from, to }, slices, quickLinksMap);
      }
    }

    // e.g., "[Buffalo](w:Buffalo, New York)"
    const externalLinkPattern1 = [
      "formatting_formatting-link_link",
      "link",
      "formatting_formatting-link_link",
      "formatting_formatting-link-string_string_url",
      "string_url",
      "formatting_formatting-link-string_string_url",
    ];
    for (const chunk of findChunks(nodes, externalLinkPattern1)) {
      console.assert(chunk.length === 6);
      const from = chunk[0].from;
      const to = chunk[chunk.length - 1].to;
      const target = view.state.sliceDoc(chunk[4].from, chunk[4].to);
      const text = view.state.sliceDoc(chunk[1].from, chunk[1].to);

      const link = { text, target };
      this.handleLink(link, true, { from, to }, slices, quickLinksMap);
    }

    // e.g., "[](w:Miami)"
    const externalLinkPattern2 = [
      "formatting_formatting-link_hmd-barelink_link",
      "formatting_formatting-link-string_string_url",
      "string_url",
      "formatting_formatting-link-string_string_url",
    ];
    for (const chunk of findChunks(nodes, externalLinkPattern2)) {
      console.assert(chunk.length === 4);
      const from = chunk[0].from;
      const to = chunk[chunk.length - 1].to;
      const target = view.state.sliceDoc(chunk[2].from, chunk[2].to);
      const text = "";

      const link = { text, target };
      this.handleLink(link, true, { from, to }, slices, quickLinksMap);
    }
  }

  handleLink(
    link: RawLink,
    externalLink: boolean,
    { from, to }: { from: number; to: number },
    slices: QuickLinkSlice[],
    quickLinksMap: Map<string, QuickLinkMacro>
  ): void {
    const maybeLink = transformLink(link, quickLinksMap);

    if (maybeLink !== null) {
      slices.push({
        linkToInsert: maybeLink,
        externalLink,
        from: from,
        to: to,
      });
    }
  }

  processQuickLinks(
    view: EditorView,
    builder: RangeSetBuilder<Decoration>
  ): void {
    this.slices.sort((a, b) => a.from - b.from);

    const cursorHead = view.state.selection.main.head;
    for (let slice of this.slices) {
      if (slice.from <= cursorHead && cursorHead <= slice.to) {
        continue;
      }

      const widget = new QuickLinksWidget(slice);
      builder.add(slice.from, slice.to, Decoration.replace({ widget }));
    }
  }
}

function findChunks(nodes: SyntaxNode[], pattern: string[]): SyntaxNode[][] {
  const chunks: SyntaxNode[][] = [];

  for (let i = 0; i <= nodes.length - pattern.length; i++) {
    const chunk = nodes.slice(i, i + pattern.length);
    if (doesChunkMatch(chunk, pattern)) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

function doesChunkMatch(chunk: SyntaxNodeRef[], pattern: string[]) {
  for (let i = 0; i < chunk.length; i++) {
    if (!chunk[i].name.startsWith(pattern[i])) {
      return false;
    }
  }

  return true;
}

class QuickLinksWidget extends WidgetType {
  private slice: QuickLinkSlice;

  constructor(slice: QuickLinkSlice) {
    super();
    this.slice = slice;
  }

  toDOM(view: EditorView): HTMLElement {
    const el = document.createElement("a");
    el.innerText = this.slice.linkToInsert.text;

    if (!this.slice.externalLink) {
      el.classList.add("external-link");
    }

    el.setAttribute("href", this.slice.linkToInsert.target);
    el.setAttribute("rel", "noopener");
    el.setAttribute("target", "_blank");
    return el;
  }
}

export const LivePreviewQuickLinksPlugin = ViewPlugin.fromClass(
  LivePreviewQuickLinksPluginValue,
  {
    decorations: (value: LivePreviewQuickLinksPluginValue) => value.decorations,
  }
);
