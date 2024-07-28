# Obsidian Quick Links
Create shortcuts to quickly link to external sites in [Obsidian](https://obsidian.md).

For example, you can link to "New York City" on Wikipedia by writing `[[w:New York City]]`.

You can also define your own custom shortcuts. For instance, you could create a `twitter:` prefix to link to a Twitter profile with `[[twitter:some-twitter-handle]]`.

## FAQs
### Can I make a custom quick link to another Obsidian vault?
Yes. If your vault is called `my-vault`, then set the target URL in the "Manage quick links" settings pane to `obsidian://vault/my-vault/%s`.

### Wiki links are showing up in my graph view. How do I hide them?
There are two options:

- Uncheck the "Use wiki link syntax" box in the Quick Links settings. This means you will have to write quick links as `[](w:Whatever)` instead of `[[w:Whatever]]`.
- In your graph view settings, enable the "Existing files only" option.

### I changed a setting/added a new link but the result is still the same.
Obsidian only re-renders your content when it changes, so open tabs may show the results of outdated settings. Closing and reopening the file will force Obsidian to re-render with the latest settings.

## Development
*This section is for developers of the plugin, not for users.*

- `npm run dev` to build in dev mode and automatically rebuild on changes.
- `npm run build` to build in prod mode and run the type-checker.
- `npm run check` to run the type-checker by itself.

To set up the plugin for development, clone this repository and create a symlink in your vault's `.obsidian/plugins` folder.

After each rebuild, you will need to disable and reenable the plugin to load the latest code.

Since Obsidian only re-renders the changed parts of a file, you may need to close and reopen the file to see the rendered result of the latest code.

The plugin produces a lot of debugging output, so make sure that Debug/Verbose output isn't filtered out in the console logs.
