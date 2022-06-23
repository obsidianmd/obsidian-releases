## About this repo

This repo is used for hosting public releases of Obsidian, as well as our community plugins & themes directories.

Obsidian is not open source software and this repo _DOES NOT_ contain the source code of Obsidian. However, if you wish to contribute to Obsidian, you can easily do so with our extensive plugin system. A plugin guide can be found here: https://marcus.se.net/obsidian-plugin-docs/

This repo does not accept issues, if you have questions or issues with plugins, please go to their own repo to file them. If you have questions or issues about core Obsidian itself, please post them to our community: https://obsidian.md/community

## Submit your plugin or theme

When opening a pull request, please switch to preview mode and select the option to go through our submission checklist. Submit your entry by following the convention in the JSON file and we will review your submission.

Thanks for submitting your creations!

You can find a detailed explanation for submitting your [plugin here](https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+add+your+plugin+to+the+community+plugin+list) and your [theme here](https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/Guides/How+to+add+your+theme+to+the+community+theme+store).

## Community Theme

To add your theme to our theme store, make a pull request to the `community-css-theme.json` file. Please add your theme to the end of the list.

- `name`: a unique name for your theme. Must not collide with other themes.
- `author`: the author's name for display.
- `repo`: the GitHub repository identifier, in the form of `user-name/repo-name`, if your GitHub repo is located at `https://github.com/user-name/repo-name`.
- `screenshot`: path to the screenshot of your theme.
- `modes`: if your theme supports both dark and light mode, put `["dark", "light"]`. Otherwise, put `["dark"]` if your theme only supports dark mode, or  `["light"]` if your theme only supports light mode.
- `branch`: which branch to use for your reposity. You can omit it if you're using `master`.
- `publish`: if your theme supports Obsidian Publish, set this to `true`. Omit it otherwise.

To get your theme compatible with Obsidian Publish, you can now use `applyCss` and `applyCssByLink` to test out your CSS in the developer console of Obsidian Publish sites, so that you don't actually need to own sites to test your `publish.css`. You can test it out on our help site here: https://help.obsidian.md/

`applyCss` takes a CSS string, you can use backtick (template strings) for multiline CSS. `applyCssByLink` takes a link and loads the CSS, would recommend GitHub raw file URLs.

## Community Plugin

### Community Plugins format

To add your plugin to the list, make a pull request to the `community-plugins.json` file. Please add your plugin to the end of the list.

- `id`: A unique ID for your plugin. Make sure this is the same one you have in your `manifest.json`.
- `name`: The name of your plugin.
- `author`: The author's name.
- `description`: A short description of what your plugin does.
- `repo`: The GitHub repository identifier, in the form of `user-name/repo-name`, if your GitHub repo is located at `https://github.com/user-name/repo-name`.
- `branch`: (optional) A branch if you prefer to use a specific branch of your repo. Defaults to `master`.

### How community plugins are pulled

- Obsidian will read the list of plugins in `community-plugins.json`.
- The `name`, `author` and `description` fields are used for searching.
- When the user opens the detail page of your plugin, Obsidian will pull the `manifest.json` and `README.md` from your GitHub repo using the specified branch (or `master`).
- The `manifest.json` in your repo will only be used to figure out the latest version. Actual files are fetched from your GitHub releases.
- If your `manifest.json` requires a version of Obsidian that's higher than the running app, your `versions.json` will be consulted to find the latest version of your plugin that is compatible.
- When the user chooses to install your plugin, Obsidian will look for your GitHub releases tagged identically to the version inside `manifest.json`.
- Obsidian will download `manifest.json`, `main.js`, and `styles.css` (if available), and store them in the proper location inside the vault.

### Announcing the First Public Release of your Plugin/Theme

- Once admitted to the plugin/theme browser, you can announce the public availability of your plugin/theme:
  - [in the forums](https://forum.obsidian.md/c/share-showcase/9) as a showcase, and
  - [on the Discord Server](https://discord.gg/veuWUTm) in the channel `#updates`. (You need the `developer` role to be able to post in that channel; [you can get that role here](https://discord.com/channels/686053708261228577/702717892533157999/830492034807758859).)
- You can also announce the first working version of your plugin as a public beta before "officially" submitting it to the plugin/theme browser. That way, you can acquire some beta testers for feedback. It's recommended to use the [BRAT Plugin](https://obsidian.md/plugins?id=obsidian42-brat) to make the installation as easy as possible for interested beta testers.
