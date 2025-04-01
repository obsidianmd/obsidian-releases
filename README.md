##📚 Overview

This plugin creates a bridge between your Obsidian vault and Notion workspace, allowing you to:

- ✅ Sync markdown files to Notion pages with preserved formatting
- 📂 Maintain folder structure in Notion
- 🔄 Auto-sync files on save or at timed intervals
- 📝 Keep track of changes for efficient syncing
- 🔁 Perform full resyncs when needed

## ⚙️ Installation

### Manual Installation (Recommended)

1. Download the latest release: `Obsidian-Sync-to-Notion.zip`
2. Extract the contents of the ZIP file (which contains `main.js`, `manifest.json`, and optionally `styles.css`)
3. Copy the extracted folder `Obsidian-Sync-to-Notion` into your vault’s `.obsidian/plugins/` directory
4. Open Obsidian, go to **Settings → Community Plugins → Installed Plugins**
5. Enable **Notion Sync**

> ⚠️ If the `.plugins/` folder doesn’t exist, create it manually.

### From Obsidian Community Plugins (Coming Soon)

1. Open Obsidian Settings  
2. Go to "Community Plugins" and click "Browse"  
3. Search for "Notion Sync"  
4. Click "Install" and then "Enable"

## 🔑 Setup

Before using the plugin, you need:

1. **Notion API Token**:  
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)  
   - Create a new integration  
   - Copy the secret token

2. **Root Page ID**:  
   - Create or choose a page in Notion where your notes will be synced  
   - Share this page with your integration  
   - Copy the page ID from the URL (it's the long string after the workspace name and before any '?')

3. **Configure the Plugin**:  
   - Open Obsidian Settings  
   - Go to "Notion Sync" settings  
   - Paste your API token and root page ID  
   - Configure other settings as needed

## 🚀 Usage

### Commands

The plugin adds these commands to Obsidian:

- **Sync to Notion**: Syncs modified files to Notion  
- **Sync to Notion (Full Resync)**: Clears all pages in Notion and performs a complete resync

### Automatic Sync Options

- **Sync on Save**: Toggle to automatically sync files when you save them  
- **Auto Sync Interval**: Set a timer for periodic syncing (in minutes)

### Settings

- **Excluded Folders**: Specify folders you don't want to sync  
- **Advanced Options**: Configure sync behavior and formatting options

## 🔄 How It Works

1. The plugin scans your vault for markdown files  
2. It tracks which files have been modified since the last sync  
3. It creates a mirror structure in Notion  
4. It converts markdown to Notion blocks, preserving formatting and code blocks  
5. It updates existing pages or creates new ones as needed

## 🔜 Roadmap

- Better support for embeds and transclusions  
- Two-way sync (Notion to Obsidian)  
- Custom property mapping  
- Sync selection dialog  
- Integration with Notion databases

---

<a name="português"></a>
# Português

## 📚 Visão Geral

Este plugin cria uma ponte entre seu vault do Obsidian e seu workspace do Notion, permitindo:

- ✅ Sincronizar arquivos markdown com páginas do Notion mantendo a formatação  
- 📂 Manter a estrutura de pastas no Notion  
- 🔄 Sincronização automática ao salvar ou em intervalos definidos  
- 📝 Acompanhar alterações para sincronização eficiente  
- 🔁 Realizar ressincronizações completas quando necessário

## ⚙️ Instalação

### Instalação Manual (Recomendada)

1. Baixe o arquivo mais recente: `Obsidian-Sync-to-Notion.zip`  
2. Extraia o conteúdo do ZIP (`main.js`, `manifest.json` e opcionalmente `styles.css`)  
3. Copie a pasta `Obsidian-Sync-to-Notion` extraída para `.obsidian/plugins/` dentro do seu vault do Obsidian  
4. Abra o Obsidian, vá em **Configurações → Plugins Comunitários → Plugins Instalados**  
5. Ative o plugin **Notion Sync**

> ⚠️ Se a pasta `.plugins/` não existir, crie-a manualmente.

### Pelos Plugins Comunitários do Obsidian (Em Breve)

1. Abra as Configurações do Obsidian  
2. Vá para "Plugins Comunitários" e clique em "Procurar"  
3. Busque por "Notion Sync"  
4. Clique em "Instalar" e depois "Ativar"

## 🔑 Configuração

Antes de usar o plugin, você precisa:

1. **Token de API do Notion**:  
   - Acesse [Integrações do Notion](https://www.notion.so/my-integrations)  
   - Crie uma nova integração  
   - Copie o token secreto

2. **ID da Página Raiz**:  
   - Crie ou escolha uma página no Notion onde suas notas serão sincronizadas  
   - Compartilhe esta página com sua integração  
   - Copie o ID da página da URL (é a string longa após o nome do workspace e antes de qualquer '?')

3. **Configure o Plugin**:  
   - Abra as Configurações do Obsidian  
   - Vá para configurações de "Notion Sync"  
   - Cole seu token de API e ID da página raiz  
   - Configure outras opções conforme necessário

## 🚀 Uso

### Comandos

O plugin adiciona estes comandos ao Obsidian:

- **Sync to Notion**: Sincroniza arquivos modificados com o Notion  
- **Sync to Notion (Full Resync)**: Limpa todas as páginas no Notion e realiza uma ressincronização completa

### Opções de Sincronização Automática

- **Sincronizar ao Salvar**: Ative para sincronizar automaticamente os arquivos quando salvos  
- **Intervalo de Sincronização Automática**: Define um temporizador para sincronização periódica (em minutos)

### Configurações

- **Pastas Excluídas**: Especifique pastas que não deseja sincronizar  
- **Opções Avançadas**: Configure comportamentos de sincronização e opções de formatação

## 🔄 Como Funciona

1. O plugin escaneia seu vault em busca de arquivos markdown  
2. Ele rastreia quais arquivos foram modificados desde a última sincronização  
3. Cria uma estrutura espelho no Notion  
4. Converte markdown para blocos do Notion, preservando formatação e blocos de código  
5. Atualiza páginas existentes ou cria novas conforme necessário

## 🛠️ Soluções de Problemas

- **Falha na Autenticação**: Verifique se seu token do Notion está correto e ainda é válido  
- **Página Não Encontrada**: Certifique-se de que o ID da página raiz está correto e a página está compartilhada com sua integração  
- **Problemas de Formatação**: Alguns elementos markdown complexos podem não renderizar perfeitamente no Notion

## 🔜 Roadmap

- Melhor suporte para embeds e transclusões  
- Sincronização bidirecional (Notion para Obsidian)  
- Mapeamento de propriedades personalizadas  
- Diálogo de seleção para sincronização  
- Integração com bancos de dados do Notion

## 🧩 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
