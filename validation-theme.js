module.exports = async ({ github, context, core, probe }) => {

    if (context.payload.pull_request.additions <= context.payload.pull_request.deletions) {
        // Don't run any validation checks if the user is just modifying existing theme config
        return;
    }

    if (context.payload.pull_request.changed_files > 1) {
        addError('You modified files other than `community-css-themes.json`.');
    }

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

    const createMessage = async (theme = undefined) => {
        if (errors.length > 0 || warnings.length > 0) {
            let message = `#### Hello ${author}!<a href="https://obsidian.md"><img align="right" height="30px" src="https://user-images.githubusercontent.com/59741989/139557624-63e6e31f-e617-4041-89ae-78b534a8de5c.png"/></a>\n`;
            if (theme) {
                message += `**I found the following issues in your theme, ${theme.name}:**\n\n`;
            } else {
                message += `**I found the following issues in your theme submission**\n\n`;
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

            core.setFailed("Failed to validate theme");
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
    let themes = [];
    try {
        themes = JSON.parse(fs.readFileSync('community-css-themes.json', 'utf8'));
    } catch (e) {
        addError('Could not parse `community-css-themes.json`');
        await createMessage();
        return;
    }

    const theme = themes[themes.length - 1];

    // Validate theme repo
    let repoInfo = theme.repo.split('/');
    if (repoInfo.length !== 2) {
        addError(`It seems like you made a typo in the repository field ${theme.repo}`);
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
        addError(`It seems like you made a typo in the repository field ${theme.repo}`);
    }

    try {
        let manifestFile = await github.rest.repos.getContent({
            owner,
            repo,
            path: 'manifest.json',
        });

        manifest = JSON.parse(Buffer.from(manifestFile.data.content, 'base64').toString('utf-8'));

        if (manifest.name != theme.name) {
            addError('Theme name mismatch, the name in this repo is not the same as the one in your repo.');
        }

        if (manifest.name.toLowerCase().includes('obsidian')) {
            addWarning(`We discourage themes from including the word "Obsidian" in their name since it's redundant and makes the theme selection screen harder to visually parse.`);
        }

        if (themes.filter(t => t.name === theme.name).length > 1) {
            addError('There is already a theme with this name.');
        }

        if (themes.filter(t => t.repo === theme.repo).length > 1) {
            addError('There is already a entry pointing to the `' + theme.repo + '` repository.');
        }

        if (manifest.authorUrl === "https://obsidian.md") {
            addError(`\`authorUrl\` should not point to the Obsidian Website. If you don't have a website you can just point it to your GitHub profile`);
        }

    } catch (e) {
        addWarning(`You don't have a \`manifest.json\` at the root of your repo, or it could not be parsed.`);
    }

    try {
        await github.rest.repos.getContent({
            owner, repo, path: 'theme.css'
        });
    } catch (e) {
        addError('Your repository does not include a `theme.css` file.');
    }

    try {
        await github.rest.repos.getContent({
            owner, repo, path: 'obsidian.css'
        });
        addWarning('Your repository includes a `obsidian.css` file, this is only used in legacy versions of Obsidian.');
    } catch (e) { }

    if (!(/^[0-9.]+$/i.test(manifest.version))) {
        addError('Your latest version number is not valid. Only numbers and dots are allowed.');
    }

    if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(manifest.author)) {
        addWarning('We generally discourage from including email addresses in the `author` field.');
    }

    try {
        const screenshot = await github.rest.repos.getContent({
            owner, repo, path: theme.screenshot
        });
        const imageMeta = await probe(screenshot.data.download_url);
        if (imageMeta.type !== "png" && imageMeta.type !== "jpg") {
            addError('Theme screenshots can either be `.png` or `.jpg` files.');
        }
        const recommendedSize = "we generally recommend a size around 512 by 288 px.";
        if (imageMeta.width > 1000 || imageMeta.height > 500) {
            addWarning(`Your theme screenshot is too big, ${recommendedSize}`);
        }
        if (imageMeta.width < 250 || imageMeta.height < 100) {
            addWarning(`Your theme screenshot is too small, ${recommendedSize}`);
        }
    } catch (e) {
        addError('The theme screenshot cannot be found.');
    }

    try {
        let release = await github.rest.repos.getReleaseByTag({
            owner,
            repo,
            tag: manifest.version,
        });

        const assets = release.data.assets || [];
        if (!assets.find(p => p.name === 'theme.css')) {
            addError('Your latest Release is missing the `theme.css` file.');
        }
        if (!assets.find(p => p.name === 'manifest.json')) {
            addError('Your latest Release is missing the `manifest.json` file.');
        }
    } catch (e) { }

    try {
        await github.rest.licenses.getForRepo({ owner, repo });
    } catch (e) {
        addWarning('Your repository does not include a license. It is generally recommended for open-source projects to have a license. Go to <https://choosealicense.com/> to compare different open source licenses.');
    }
    createMessage(theme);
}