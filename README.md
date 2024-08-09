<<<<<<< HEAD
# Obsidian Plugin: Auto Generator Plugin

This is a plugin for Obsidian (https://obsidian.md).

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

This plugin is designed specially for iWhaleCloud users, it can do:
- Take advantage of the Docchain and ChatGPT API to automatically generate texts
- Automatically generate the index according to your requirements
- Automatically generate the document according to the existing index, paragraph by paragraph, marked by ##
- Able to save your file to another address

## Settings:

You need to provide the server address and the ChatGPT token. These two shall be fit in the settings.

## Use:
You need to provide the Docchain username, Docchain password and the assigned Docchain topic-id for the input, as well as offer your requirements.
Attention: topic-id should be chosen carefully according to the exact type of document you wish to generate, such as the esg report of all varieties of industries.
Moreover, you should make sure that the Docchain username and Docchain password are valid and the topic-id does exists in the name of the corresponding Docchain user.


## Example:
It is allowed that you input your own index to generate the document. But make sure that it is of the right format as follows:
The index should possess 1 title marked by #, all the sub-indexes should be marked by ##, and ### marks their subtitles.It is ok if there isn't ###.
An instance is shown below:
#ESG报告
## 1. 产品与服务
1. SHS-5
2. SHS-6
3. 416-1
4. 416-2
5. 417-1

## 2. 供应链管理
1. SOC-2
2. SOC-3

## 3. 重人本的员工发展
1. 员工权益
2. SOC-6

## 4. 成长平台
1. SOC-4
2. SOC-7

## 5. 报告内容
1. IPIECA/API（2020）
2. GRI 2021

## 6. 心理健康与关爱员工
1. SHS-1
2. SHS-2
3. 403-3

## 7. 社会责任与社区关系
1. 本土化与多元化
2. SOC-4
3. SOC-5
4. SOC-15

## 8. 绿色环保
1. 绿色动力
2. 储量接替率

## 9. 技术创新
1. 中国石油年度十大科技进展
2. 研发经费投入

## 10. 企业数字化与智能化转型
1. 信息技术
2. 智慧能源与化工产业

## 11. 社区沟通与参与
1. 哈法亚公司
2. 印度尼西亚公司
3. 社区权益保障

## 12. ESG（环境、社会、治理）实践总结

## 13. 石油精神与企业文化
1. 感动石油人物
2. 石油精神与铁人精神



## Attention

- Once you click the Document button, the index is saved inside the program and all your effort to change the index will fail, which means that all the document generated will be based on your previous index.
- If you click on the Reset button, the index will be shown(But you should probably save the document before clicking on for the ducument will be missing once you click on it).
- You should not click on the Document button or the Regenerate button when the generating process is not complete!


## API Documentation

See https://github.com/obsidianmd/obsidian-api
=======
## About this repo

This repo is used for hosting public releases of Obsidian, as well as our community plugins & themes directories.

Obsidian is not open source software and this repo _DOES NOT_ contain the source code of Obsidian. However, if you wish to contribute to Obsidian, you can easily do so with our extensive plugin system. A plugin guide can be found here: https://docs.obsidian.md

This repo does not accept issues, if you have questions or issues with plugins, please go to their own repo to file them. If you have questions or issues about core Obsidian itself, please post them to our community: https://obsidian.md/community

## Submit your plugin or theme

When opening a pull request, please switch to preview mode and select the option to go through our submission checklist. Submit your entry by following the convention in the JSON file and we will review your submission.

Thanks for submitting your creations!

You can find a detailed explanation for submitting your [plugin here](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin) and your [theme here](https://docs.obsidian.md/Themes/App+themes/Submit+your+theme).

## Policies

All submissions must conform with our [developer policies](https://docs.obsidian.md/Developer+policies)

## Community Theme

To add your theme to our theme store, make a pull request to the `community-css-theme.json` file. Please add your theme to the end of the list.

- `name`: a unique name for your theme. Must not collide with other themes.
- `author`: the author's name for display.
- `repo`: the GitHub repository identifier, in the form of `user-name/repo-name`, if your GitHub repo is located at `https://github.com/user-name/repo-name`.
- `screenshot`: path to the screenshot of your theme.
- `modes`: if your theme supports both dark and light mode, put `["dark", "light"]`. Otherwise, put `["dark"]` if your theme only supports dark mode, or  `["light"]` if your theme only supports light mode.
- `publish`: if your theme supports Obsidian Publish, set this to `true`. Omit it otherwise.

To get your theme compatible with Obsidian Publish, you can use `applyCss` and `applyCssByLink` to test out your CSS in the developer console of Obsidian Publish sites, so that you don't actually need to own sites to test your `publish.css`. You can test it out on our help site here: https://help.obsidian.md/

`applyCss` takes a CSS string, you can use backtick (template strings) for multiline CSS. `applyCssByLink` takes a link and loads the CSS, would recommend GitHub raw file URLs.

## Community Plugin

### Community Plugins format

To add your plugin to the list, make a pull request to the `community-plugins.json` file. Please add your plugin to the end of the list.

- `id`: A unique ID for your plugin. Make sure this is the same one you have in your `manifest.json`.
- `name`: The name of your plugin.
- `author`: The author's name.
- `description`: A short description of what your plugin does.
- `repo`: The GitHub repository identifier, in the form of `user-name/repo-name`, if your GitHub repo is located at `https://github.com/user-name/repo-name`.

### How community plugins are pulled

- Obsidian will read the list of plugins in `community-plugins.json`.
- The `name`, `author` and `description` fields are used for searching.
- When the user opens the detail page of your plugin, Obsidian will pull the `manifest.json` and `README.md` from your GitHub repo).
- The `manifest.json` in your repo will only be used to figure out the latest version. Actual files are fetched from your GitHub releases.
- If your `manifest.json` requires a version of Obsidian that's higher than the running app, your `versions.json` will be consulted to find the latest version of your plugin that is compatible.
- When the user chooses to install your plugin, Obsidian will look for your GitHub releases tagged identically to the version inside `manifest.json`.
- Obsidian will download `manifest.json`, `main.js`, and `styles.css` (if available), and store them in the proper location inside the vault.

### Announcing the First Public Release of your Plugin/Theme

- Once admitted to the plugin/theme browser, you can announce the public availability of your plugin/theme:
  - [in the forums](https://forum.obsidian.md/c/share-showcase/9) as a showcase, and
  - [on the Discord Server](https://discord.gg/veuWUTm) in the channel `#updates`. (You need the `developer` role to be able to post in that channel; [you can get that role here](https://discord.com/channels/686053708261228577/702717892533157999/830492034807758859).)
- You can also announce the first working version of your plugin as a public beta before "officially" submitting it to the plugin/theme browser. That way, you can acquire some beta testers for feedback. It's recommended to use the [BRAT Plugin](https://obsidian.md/plugins?id=obsidian42-brat) to make the installation as easy as possible for interested beta testers.
>>>>>>> 33759aeadcc4ecb8a3b4aa3d8371ba1ec3f327c5
