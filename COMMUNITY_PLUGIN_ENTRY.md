# Community Plugin Entry for Obsidian Usage Statistics

## Entry for community-plugins.json

Add this entry to the end of the `community-plugins.json` file:

```json
{
  "id": "obsidian-usage-statistic",
  "name": "Usage Statistics",
  "author": "林逍遥",
  "description": "Track time spent in Obsidian with detailed statistics, beautiful charts, and comprehensive analytics. Monitor your productivity with session analysis, file activity tracking, and customizable time periods.",
  "repo": "createitv/obsidian-usage-stats"
}
```

## Required Information

### Plugin ID
- **ID**: `obsidian-usage-statistic`
- **Must match**: The `id` field in your `manifest.json`
- **Format**: Lowercase with hyphens, no spaces

### Plugin Name
- **Name**: "Usage Statistics"
- **Display name**: What users will see in the plugin browser
- **Should be**: Clear, descriptive, and match your branding

### Author
- **Author**: "林逍遥"
- **Display name**: Your name as you want it to appear
- **Should be**: Your real name or consistent pseudonym

### Description
- **Description**: Comprehensive description of plugin functionality
- **Length**: Should be concise but informative
- **Keywords**: Include important features for searchability
- **Format**: Sentence case, no technical jargon

### Repository
- **Repo**: `createitv/obsidian-usage-stats`
- **Format**: `username/repository-name`
- **Must be**: Public GitHub repository
- **Should contain**: Source code, releases, and documentation

## Submission Process

1. **Fork the obsidian-releases repository**
2. **Add your entry** to the end of `community-plugins.json`
3. **Create a pull request** with a descriptive title
4. **Follow the submission checklist** in the pull request template
5. **Wait for review** from the Obsidian team
6. **Address any feedback** if requested
7. **Plugin will be published** once approved

## Important Notes

- **Unique ID**: Ensure your plugin ID is unique and not already taken
- **Repository**: Must be public and contain the plugin source code
- **Releases**: Must have at least one GitHub release with the plugin files
- **Documentation**: Should have a clear README.md with installation instructions
- **License**: Should have an appropriate open source license
- **Code Quality**: Should follow Obsidian's plugin development guidelines

## Release Requirements

Your GitHub repository must contain:

1. **manifest.json**: Plugin metadata and version information
2. **main.js**: Compiled plugin code
3. **styles.css**: Plugin styles (if applicable)
4. **README.md**: Installation and usage instructions
5. **LICENSE**: Open source license file

## Version Management

- **manifest.json**: Contains the current version
- **GitHub Releases**: Tagged with the same version number
- **Release Files**: Include all necessary plugin files
- **Changelog**: Document changes between versions

## Support and Maintenance

- **Issues**: Respond to user issues promptly
- **Updates**: Keep the plugin updated with Obsidian versions
- **Documentation**: Maintain clear and up-to-date documentation
- **Community**: Engage with users on Discord and forums

## Best Practices

- **Testing**: Thoroughly test before each release
- **Documentation**: Provide clear installation and usage instructions
- **Screenshots**: Include screenshots showing the plugin in action
- **Examples**: Provide usage examples and use cases
- **Support**: Be responsive to user questions and issues
