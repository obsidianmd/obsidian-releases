module.exports = async ({ github, context, core }) => {

    if (context.payload.pull_request.additions <= context.payload.pull_request.deletions) {
        // Don't run any validation checks if the user is just modifying existing plugin config
        return;
    }

    if (context.payload.pull_request.changed_files > 1) {
        addError('You modified files other than `community-plugins.json`.');
    }

    const escapeHtml = (unsafe) => unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const errors = [];
    const addError = (error) => {
        errors.push(`:x: ${error}`);
        console.log('Found issue: ' + error);
    };

    const warnings = [];
    const addWarning = (warning) => {
        warnings.push(`:warning: ${warning}`);
        console.log('Found issue: ' + warning);
    }

    const createMessage = async (plugin = undefined) => {
        if (errors.length > 0 || warnings.length > 0) {
            let message = `#### Hello ${author}!<a href="https://obsidian.md"><img align="right" height="30px" src="https://user-images.githubusercontent.com/59741989/139557624-63e6e31f-e617-4041-89ae-78b534a8de5c.png"/></a>\n`;
            if (plugin) {
                message += `**I found the following issues in your plugin, ${plugin.name}:**\n\n`;
            } else {
                message += `**I found the following issues in your plugin submission**\n\n`;
            }

            if (errors.length > 0) {
                message += `**Errors:**\n\n${errors.join('\n')}\n\n---\n`;
            }
            if (warnings.length > 0) {
                message += `**Warnings:**\n\n${warnings.join('\n')}\n\n---\n`;
            }
            message += `<sup>This check was done automatically.</sup>`;

            await github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: message
            });

            //remove label from previous runs
            if (context.payload.pull_request.labels.includes('Ready for review')) {
                await github.rest.issues.removeLabel({
                    issue_number: context.issue.number,
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    name: 'Ready for review'
                })
            }

            core.setFailed("Failed to validate plugin");
        }
        if (errors.length === 0) {
            if (!context.payload.pull_request.labels.includes('Changes requested')) {
                await github.rest.issues.addLabels({
                    issue_number: context.issue.number,
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    labels: ['Ready for review']
                });
            }
        }
    }

    const fs = require('fs');
    const author = context.payload.pull_request.user.login;
    let plugins = [];
    try {
        plugins = JSON.parse(fs.readFileSync('community-plugins.json', 'utf8'));
    } catch (e) {
        addError('Could not parse `community-plugins.json`');
        await createMessage();
        return;
    }

    const plugin = plugins[plugins.length - 1];

    // Validate plugin repo
    let repoInfo = plugin.repo.split('/');
    if (repoInfo.length !== 2) {
        addError(`It seems like you made a typo in the repository field ${plugin.repo}`);
    }

    let [owner, repo] = repoInfo;
    let manifest = {};
    console.log(`Repo info: ${owner}/${repo}`);

    if (owner.toLowerCase() !== author.toLowerCase()) {
        try {
            const isInOrg = await github.rest.orgs.checkMembershipForUser({ org: owner, username: author });
            if (!isInOrg) {
                throw undefined;
            }
        } catch (e) {
            addError(`The newly added entry is not at the end, or you are submitting on someone else's behalf. Last plugin in the list is: ${plugin.repo}`);
        }

    }
    try {
        const repository = await github.rest.repos.get({ owner, repo });
        if (!repository.data.has_issues) {
            addWarning('Your repository does not have issues enabled. Users will not be able to report bugs and request features.');
        }
    } catch (e) {
        addError(`It seems like you made a typo in the repository field ${plugin.repo}`);
    }

    try {
        let manifestFile = await github.rest.repos.getContent({
            owner,
            repo,
            path: 'manifest.json',
        });

        manifest = JSON.parse(Buffer.from(manifestFile.data.content, 'base64').toString('utf-8'));
        if (manifest.id != plugin.id) {
            addError('Plugin ID mismatch, the ID in this repo is not the same as the one in your repo.');
        }

        if (manifest.name != plugin.name) {
            addError('Plugin name mismatch, the name in this repo is not the same as the one in your repo.');
        }

        if (manifest.name.toLowerCase().startsWith('obsidian')) {
            addError(`We're asking plugins to avoid using the word "Obsidian" at the start of their plugin name to avoid over-saturating the brand name and reserve the naming for first-party plugins (like Obsidian Publish, Obsidian Sync, etc).`);
        } else if (manifest.name.toLowerCase().includes('obsidian')) {
            addWarning(`We discourage plugins from including the word "Obsidian" in their name since it's redundant and makes the plugin sidebar harder to visually parse.`);
        }

        if (manifest.id.toLowerCase().includes('obsidian')) {
            addWarning(`There's no need to include 'obsidian' in the plugin ID. The ID is used for your plugin's settings folder so it should closely match your plugin name for user convenience.`);
        }

        if (manifest.name.toLowerCase().includes('plugin')) {
            addWarning(`We discourage plugins from including the word "Plugin" in their name since it's redundant and makes the plugin sidebar harder to visually parse.`);
        }

        if (!(/^[a-z0-9-_]+$/i.test(plugin.id))) {
            addError('The plugin ID is not valid. Only alphanumeric characters and dashes are allowed.');
        }

        if (plugins.filter(p => p.name === plugin.name).length > 1) {
            addError('There is already a plugin with this name.');
        }

        if (plugins.filter(p => p.id === plugin.id).length > 1) {
            addError('There is already a plugin with this ID.');
        }
        if (plugins.filter(p => p.repo === plugin.repo).length > 1) {
            addError(`There is already a entry pointing to the ${plugin.repo} repository.`);
        }
        if (plugin.branch) {
            addWarning('You do not need to include the `branch` parameter when submitting your PR, it is no longer used.');
        }

        if (plugin.authorUrl === "https://obsidian.md") {
            addError(`\`authorUrl\` should not point to the Obsidian Website. If you don't have a website you can just point it to your GitHub profile`);
        }

        if (plugin.authorUrl.toLowerCase().includes("github.com/" + plugin.repo.toLowerCase())) {
            addWarning('\`authorUrl\` should not point to the GitHub repository of the plugin');
        }

        if (plugin.fundingUrl && plugin.fundingUrl === "https://obsidian.md/pricing") {
            addError('`fundingUrl` should not point to the Obsidian Website, If you don\'t have a link were users can donate to you, you can just omit this.');
        }

    } catch (e) {
        addError(`You don't have a \`manifest.json\` at the root of your repo, or it could not be parsed`);
    }

    try {
        let release = await github.rest.repos.getReleaseByTag({
            owner,
            repo,
            tag: manifest.version,
        });

        const assets = release.data.assets || [];
        if (!assets.find(p => p.name === 'main.js')) {
            addError('Your latest Release is missing the `main.js` file.');
        }
        if (!assets.find(p => p.name === 'manifest.json')) {
            addError('Your latest Release is missing the `manifest.json` file.');
        }
    } catch (e) {
        addError(`Unable to find a release with the tag "${manifest.version}". Make sure that the manifest.json file in your repo points to the correct Github Release\n<details><summary>Log</summary><pre>${escapeHtml(e.toString())}</pre></details>`);
    }
    try {
        await github.rest.licenses.getForRepo({ owner, repo });
    } catch (e) {
        addWarning('Your repository does not include a license. It is generally recommended for open-source projects to have a license. Go to <https://choosealicense.com/> to compare different open source licenses.');
    }

    if (!(/^[0-9.]+$/i.test(manifest.version))) {
        addError('Your latest version number is not valid. Only numbers and dots are allowed.');
    }

    if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(manifest.author)) {
        addWarning('We generally discourage from including email addresses in the `author` field.');
    }

    try {
        await github.rest.licenses.getForRepo({ owner, repo });
    } catch (e) {
        addWarning('Your repository does not include a license. It is generally recommended for open-source projects to have a license. Go to <https://choosealicense.com/> to compare different open source licenses.');
    }

    await createMessage(plugin);
}