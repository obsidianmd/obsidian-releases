## About this repo

This repo is used for hosting public releases of Obsidian, as well as our community plugins & themes directories.

Obsidian is not open source software and this repo _DOES NOT_ contain the source code of Obsidian. However, if you wish to contribute to Obsidian, you can easily do so with our extensive plugin system. A plugin guide can be found here: https://docs.obsidian.md

This repo does not accept issues, if you have questions or issues with plugins, please go to their own repo to file them. If you have questions or issues about core Obsidian itself, please post them to our community: https://obsidian.md/community

## Submit your plugin or theme

You can find a detailed explanation for submitting your [plugin here](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin) and your [theme here](https://docs.obsidian.md/Themes/App+themes/Submit+your+theme).

## Policies

All submissions must conform with our [developer policies](https://docs.obsidian.md/Developer+policies)

### How community plugins are pulled

- Obsidian will read the list of plugins in `community-plugins.json`.
- The `name`, `author` and `description` fields are used for searching.
- When the user opens the detail page of your plugin, Obsidian will pull the `manifest.json` and `README.md` from your GitHub repo).
- The `manifest.json` in your repo will only be used to figure out the latest version. Actual files are fetched from your GitHub releases.
- If your `manifest.json` requires a version of Obsidian that's higher than the running app, your `versions.json` will be consulted to find the latest version of your plugin that is compatible.
- When the user chooses to install your plugin, Obsidian will look for your GitHub releases tagged identically to the version inside `manifest.json`.
- Obsidian will download `manifest.json`, `main.js`, and `styles.css` (if available), and store them in the proper location inside the vault.

### Announcing the First Public Release of your Plugin/Theme

- Once admitted to the plugin/theme community, you can announce the public availability of your plugin/theme:
  - [in the forums](https://forum.obsidian.md/c/share-showcase/9) as a showcase, and
  - [on the Discord Server](https://discord.gg/veuWUTm) in the channel `#updates`. (You need the `developer` role to be able to post in that channel; [you can get that role here](https://discord.com/channels/686053708261228577/702717892533157999/830492034807758859).)
- You can also announce the first working version of your plugin as a public beta before "officially" submitting it to the plugin/theme browser. That way, you can acquire some beta testers for feedback. It's recommended to use the [BRAT Plugin](https://obsidian.md/plugins?id=obsidian42-brat) to make the installation as easy as possible for interested beta testers.
