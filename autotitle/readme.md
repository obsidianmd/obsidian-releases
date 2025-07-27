# AutoTitle - AI-Powered Title Generator for Obsidian

<div align="center">

![AutoTitle Logo](https://img.shields.io/badge/AutoTitle-AI%20Powered-blue?style=for-the-badge&logo=obsidian)

[![License](https://img.shields.io/github/license/zaharenok/obsidian-autotitle?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/github/v/release/zaharenok/obsidian-autotitle?style=flat-square)](https://github.com/zaharenok/obsidian-autotitle/releases)
[![Downloads](https://img.shields.io/github/downloads/zaharenok/obsidian-autotitle/total?style=flat-square)](https://github.com/zaharenok/obsidian-autotitle/releases)

*Automatically generate meaningful titles for your Obsidian notes using OpenAI's powerful language models*

[🚀 Installation](#-installation) • [⚙️ Configuration](#️-configuration) • [🎯 Usage](#-usage) • [🛠️ Development](#️-development)

</div>

## ✨ Features

- 🤖 **AI-Powered Title Generation** - Leverages GPT latest models to create meaningful, contextual titles
- 🔄 **Automatic Mode** - Suggests titles automatically as you write your notes
- 🌍 **Multi-language Support** - Automatic language detection or manual language selection
- ⚡ **Quick Commands** - Hotkeys for instant title generation
- 🎛️ **Flexible Settings** - Customize AI model, creativity level, and behavior modes
- 📝 **Smart Replacement** - Update existing titles or create new ones intelligently
- 🎨 **Seamless Integration** - Works naturally within your Obsidian workflow

## 🚀 Installation

### Method 1: From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Navigate to **Community Plugins** and disable **Safe Mode**
3. Click **Browse** and search for "AutoTitle"
4. Install and enable the plugin

### Method 2: Manual Installation
```bash
git clone https://github.com/zaharenok/obsidian-autotitle.git
cd obsidian-autotitle
npm install
npm run build
```

Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/autotitle/` folder.

## ⚙️ Configuration

### Getting Your OpenAI API Key

1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Navigate to [API Keys](https://platform.openai.com/api-keys)
3. Create a new secret key
4. Copy the key to the plugin settings

### Plugin Settings

1. Open Obsidian Settings
2. Go to **Community Plugins** → **AutoTitle**
3. Enter your OpenAI API key
4. Customize settings to your preference

| Setting | Description | Default |
|---------|-------------|---------|
| **OpenAI API Key** | Your API key for OpenAI access | - |
| **AI Model** | AI model for generation | gpt-4o-mini |
| **Creativity Level** | Controls randomness (0.0-1.0) | 0.3 |
| **Auto-generation** | Automatically suggest titles | Enabled |
| **Language** | Target language for titles | Auto-detect |
| **Replace Mode** | Replace titles without confirmation | Disabled |
| **Timeout** | Delay after typing (ms) | 3000 |

## � Usage

### Hotkeys
- `Ctrl+Shift+H` (Windows/Linux) or `Cmd+Shift+H` (Mac) - Generate title for current note

### Generation Methods
1. **Automatic** - Enable auto-generation mode for suggestions while writing
2. **Command Palette** - Use "Generate AI Title" command
3. **Context Menu** - Right-click on file → "Generate AI Title"
4. **Ribbon Button** - Click the AutoTitle icon in the sidebar

### Example Workflow

**Original Note:**
```markdown
In this note, I want to discuss the best practices for organizing 
a productive workspace. Key factors include proper lighting, 
ergonomic furniture, and minimizing distractions...
```

**Generated Title:**
```markdown
# Best Practices for Organizing a Productive Workspace

In this note, I want to discuss the best practices for organizing 
a productive workspace. Key factors include proper lighting, 
ergonomic furniture, and minimizing distractions...
```

## �️ Development

### Project Structure
```
obsidian-autotitle/
├── main.ts              # Main plugin file
├── settings.ts          # Settings interface
├── SettingTab.ts        # Settings UI
├── utils.ts             # Utility functions
├── styles.css           # Plugin styles
├── manifest.json        # Plugin manifest
└── package.json         # Dependencies
```

### Development Setup
```bash
# Clone the repository
git clone https://github.com/zaharenok/obsidian-autotitle.git
cd obsidian-autotitle

# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build
```

### Contributing
We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🐛 Troubleshooting

### Plugin Not Working
- ✅ Verify your OpenAI API key is correct
- ✅ Check your OpenAI account has available credits
- ✅ Ensure internet connectivity

### Wrong Language Generation
- ✅ Set your preferred language in settings
- ✅ Ensure sufficient text content for language detection
- ✅ Try manual language selection instead of auto-detect

### Auto-generation Not Triggering
- ✅ Enable "Auto-generation" in settings
- ✅ Increase timeout if generation occurs too frequently
- ✅ Ensure notes have sufficient content (minimum 50 characters)

## � Supported Languages

AutoTitle supports title generation in multiple languages including:
- English
- Spanish
- French
- German
- Italian
- Portuguese
- Russian
- Chinese
- Japanese
- Korean
- And many more!

## �📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/zaharenok/obsidian-autotitle/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/zaharenok/obsidian-autotitle/discussions)
- 📧 **Contact**: Create an issue for any questions

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md/) team for the amazing platform
- [OpenAI](https://openai.com/) for powerful language models
- The Obsidian plugin development community
- All contributors and users who make this project better

## ⭐ Star History

If you find AutoTitle useful, please consider giving it a star on GitHub!

---

<div align="center">

**Made with ❤️ for the Obsidian community**

[🏠 Homepage](https://github.com/zaharenok/obsidian-autotitle) • [📚 Documentation](https://github.com/zaharenok/obsidian-autotitle/wiki) • [🐛 Report Bug](https://github.com/zaharenok/obsidian-autotitle/issues)

</div>

