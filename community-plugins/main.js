const { Plugin, Setting, PluginSettingTab } = require('obsidian');

const DEFAULT_SETTINGS = {
    ocrLanguage: 'rus+eng',
    enhanceContrast: true,
    toGrayscale: false
};

function processImage(img, { enhanceContrast, toGrayscale }) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    // Грейскейл
    if (toGrayscale) {
        for (let i = 0; i < data.length; i += 4) {
            const avg = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            data[i] = data[i+1] = data[i+2] = avg;
        }
    }
    // Контраст
    if (enhanceContrast) {
        const contrast = 40;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i+1] = factor * (data[i+1] - 128) + 128;
            data[i+2] = factor * (data[i+2] - 128) + 128;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

function showCustomNotice(message, duration = 2000) {
    let notice = document.createElement('div');
    notice.className = 'custom-bc-notice';
    notice.innerText = message;
    notice.style = 'position:fixed;top:20px;right:20px;z-index:9999;background:#222;color:#fff;padding:12px 24px;border-radius:8px;box-shadow:0 2px 8px #0008;font-size:1.1em;opacity:0.97;transition:opacity 0.3s;';
    document.body.appendChild(notice);
    setTimeout(() => {
        notice.style.opacity = '0';
        setTimeout(() => notice.remove(), 300);
    }, duration);
}

function fixOcrErrors(str) {
    if (!str) return str;
    return str
        .replace(/[0О]/g, 'О') // латинский/русский ноль на русскую О
        .replace(/[1ІI]/g, 'И') // единица/латинская I на русскую И
        .replace(/[5S]/g, 'S') // латинская S/цифра 5 на S
        .replace(/[6G]/g, 'G') // латинская G/цифра 6 на G
        .replace(/[8B]/g, 'В') // латинская B/цифра 8 на русскую В
        .replace(/[4A]/g, 'A') // латинская A/цифра 4 на A
        .replace(/[3E]/g, 'E') // латинская E/цифра 3 на E
        .replace(/[\|]/g, 'I') // вертикальная черта на I
        .replace(/[^\w\s@.\-+()",]/g, '') // убираем мусор
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function extractBusinessCardData(text) {
    const data = {
        company: '',
        fullName: '',
        phones: [],
        email: '',
        address: '',
        position: '',
        website: '',
        rawText: text
    };
    const excludeWords = [
        'тел', 'email', 'e-mail', 'директор', 'менеджер', 'отдел', 'sales', 'manager', 'representative', 'company', 'inc', 'ltd', 'corp', 'group', 'logistic', 'руководитель', 'представитель', 'проспект', 'улица', 'г.', 'office', 'suite', 'street', 'avenue', 'building', 'bldg', 'room', 'St.', 'Ave.', 'Blvd.', 'Rd.', 'Str.', 'apt', 'apartment', 'моб', 'мобильный', 'office', 'офис', 'www', 'com', 'ru', 'net', 'org', 'info', 'mail', 'почта', 'e-mail', 'e.mail', 'e_mail', 'e mail', 'mail:', 'e-mail:', 'e.mail:', 'e_mail:', 'e mail:'
    ];
    const lines = text.split(/\r?\n|\u2028|\u2029/).map(l => l.trim().replace(/^000 /, 'ООО ').replace(/ 000 /g, ' ООО ')).filter(Boolean);
    // 1. ФИО: фамилия и имя/отчество могут быть на разных строках подряд
    for (let i = 0; i < lines.length - 1; i++) {
        const l1 = lines[i], l2 = lines[i+1];
        if (/^[А-ЯЁA-Z][а-яёa-z]+$/.test(l1) && /^([А-ЯЁA-Z][а-яёa-z]+[\s\-]+){1,2}[А-ЯЁA-Z][а-яёa-z]+$/.test(l2) && !/ООО|ЗАО|ОАО|ПАО|АО|ИП|Inc|Ltd|Corp|LLC|GmbH|S\.A\.|S\.R\.L\.|S\.P\.A\.|«|"|логистик|групп|company|group|logistic/i.test(l2)) {
            data.fullName = l1 + ' ' + l2;
            break;
        }
    }
    // Если не нашли, ищем ФИО в одной строке
    if (!data.fullName) {
        for (const line of lines) {
            if (/^([А-ЯЁA-Z][а-яёa-z]+[\s\-]+){1,2}[А-ЯЁA-Z][а-яёa-z]+$/.test(line) && !/\d/.test(line)) {
                let lower = line.toLowerCase();
                if (!excludeWords.some(w => lower.includes(w)) && !/(ооо|зао|оао|пао|ао|ип|inc|ltd|corp|llc|gmbh|s\.a\.|s\.r\.l\.|s\.p\.a\.|«|"|логистик|групп|company|group|logistic)/i.test(lower)) {
                    data.fullName = line;
                    break;
                }
            }
        }
    }
    // 2. Компания: если строка содержит 'ООО' и до этого есть ФИО — брать только часть после 'ООО'
    for (const line of lines) {
        let fixed = line.replace(/^000 /, 'ООО ').replace(/ 000 /g, ' ООО ');
        let lower = fixed.toLowerCase();
        const companyMatch = fixed.match(/(ООО|ЗАО|ОАО|ПАО|АО|ИП|Inc|Ltd|Corp|LLC|GmbH|S\.A\.|S\.R\.L\.|S\.P\.A\.|«|"|логистик|групп|company|group|logistic)(.*)$/i);
        if (companyMatch) {
            let comp = (companyMatch[1] + (companyMatch[2] || '')).trim();
            if (data.fullName && fixed.includes(data.fullName)) {
                comp = comp.replace(data.fullName, '').replace(/\s{2,}/g, ' ').trim();
            }
            data.company = comp;
            break;
        }
    }
    // Если не нашли, ищем компанию отдельно
    if (!data.company) {
        for (const line of lines) {
            let fixed = line.replace(/^000 /, 'ООО ').replace(/ 000 /g, ' ООО ');
            let lower = fixed.toLowerCase();
            if (/(ооо|зао|оао|пао|ао|ип|inc|ltd|corp|llc|gmbh|s\.a\.|s\.r\.l\.|s\.p\.a\.|«|"|логистик|групп|company|group|logistic)/i.test(lower)) {
                data.company = fixed;
                break;
            }
        }
    }
    // 3. Адрес: собираем все строки с индексом, городом, улицей, домом, офисом и т.д.
    let addressParts = [];
    for (const line of lines) {
        let lower = line.toLowerCase();
        if (/\d{6}|г\.|город|ул\.|улица|пр\.|проспект|пер\.|переулок|офис|строение|корпус|дом|кв\.|suite|street|avenue|building|bldg|room|office|st\.|ave\.|blvd\.|rd\.|str\.|apt|apartment/i.test(lower)) {
            let addr = line;
            if (data.fullName && addr.includes(data.fullName)) {
                addr = addr.replace(data.fullName, '').replace(/\s{2,}/g, ' ').trim();
            }
            if (data.company && addr.includes(data.company)) {
                addr = addr.replace(data.company, '').replace(/\s{2,}/g, ' ').trim();
            }
            if (addr.length > 0) addressParts.push(addr);
        }
    }
    if (addressParts.length) data.address = addressParts.join(', ');
    // Должность
    for (const line of lines) {
        let lower = line.toLowerCase();
        if (/(представитель|руководитель|отдел|менеджер|директор|sales|manager|head|chief|lead|engineer|developer|designer|analyst|consultant|officer|specialist|account|partner|owner|president|founder|co-founder|administrator|администратор|бухгалтер|юрист|lawyer|юрисконсульт|hr|маркетолог|marketing|pr|public relations)/i.test(lower)) {
            data.position = line;
            break;
        }
    }
    // Сайт
    for (const line of lines) {
        if (/www\.|http|\.ru|\.com|\.org|\.net/i.test(line)) {
            data.website = line;
            break;
        }
    }
    // Телефоны
    const phoneMatches = text.match(/(?:\+7|8|\+\d{1,3})[\s\-]?\(?\d{3,4}\)?[\s\-]?\d{2,3}[\s\-]?\d{2,4}[\s\-]?[\d]{2,4}/g);
    if (phoneMatches) data.phones = phoneMatches.map(p => p.trim());
    // Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) data.email = emailMatch[0].trim();
    return data;
}

function createNoteContent(data) {
    return `# Визитка: ${data.fullName || 'Не определено'}\n\n**Компания:** ${data.company || 'Не определено'}\n**ФИО:** ${data.fullName || 'Не определено'}\n**Должность:** ${data.position || 'Не определено'}\n**Телефоны:** ${(data.phones && data.phones.length) ? data.phones.join(', ') : 'Не определено'}\n**Email:** ${(data.email && data.email.length) ? data.email : 'Не определено'}\n**Адрес:** ${data.address || 'Не определено'}\n**Сайты:** ${(data.website && data.website.length) ? data.website : 'Не определено'}\n\n---\n**Исходный текст:**\n${data.rawText}\n`;
}

class EditCardModal {
    constructor(app, card, onSave, imageDataUrl, ocrLines = []) {
        this.app = app;
        this.card = card;
        this.onSave = onSave;
        this.modal = null;
        this.imageDataUrl = imageDataUrl;
        this.ocrLines = ocrLines;
    }
    open() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal mod-settings';
        this.modal.style = 'position:fixed;top:10vh;left:50%;transform:translateX(-50%);z-index:1000;background:var(--background-primary);padding:2em;border-radius:8px;box-shadow:0 2px 8px #0008;max-width:90vw;';
        // Заголовок и картинка
        const title = document.createElement('h2');
        title.innerText = 'Проверьте и исправьте данные визитки';
        this.modal.appendChild(title);
        const imgDiv = document.createElement('div');
        imgDiv.style = 'text-align:center;margin-bottom:1em';
        const img = document.createElement('img');
        img.src = this.imageDataUrl;
        img.style = 'max-width:300px;max-height:200px;border:1px solid #ccc;border-radius:4px;';
        imgDiv.appendChild(img);
        this.modal.appendChild(imgDiv);
        // ФИО
        const fioLabel = document.createElement('label');
        fioLabel.innerText = 'ФИО:';
        this.modal.appendChild(fioLabel);
        this.modal.appendChild(this.createDropdown('fio', this.card.fullName));
        // Компания
        const companyLabel = document.createElement('label');
        companyLabel.innerText = 'Компания:';
        this.modal.appendChild(companyLabel);
        this.modal.appendChild(this.createDropdown('company', this.card.company));
        // Должность
        const positionLabel = document.createElement('label');
        positionLabel.innerText = 'Должность:';
        this.modal.appendChild(positionLabel);
        this.modal.appendChild(this.createDropdown('position', this.card.position));
        // Телефоны
        const phonesLabel = document.createElement('label');
        phonesLabel.innerText = 'Телефоны:';
        this.modal.appendChild(phonesLabel);
        const phonesInput = document.createElement('input');
        phonesInput.type = 'text';
        phonesInput.id = 'phones';
        phonesInput.value = this.card.phones && this.card.phones.length ? this.card.phones.join(', ') : '';
        phonesInput.style = 'width:100%';
        this.modal.appendChild(phonesInput);
        // Email
        const emailLabel = document.createElement('label');
        emailLabel.innerText = 'Email:';
        this.modal.appendChild(emailLabel);
        const emailInput = document.createElement('input');
        emailInput.type = 'text';
        emailInput.id = 'email';
        emailInput.value = this.card.email || '';
        emailInput.style = 'width:100%';
        this.modal.appendChild(emailInput);
        // Адрес
        const addressLabel = document.createElement('label');
        addressLabel.innerText = 'Адрес:';
        this.modal.appendChild(addressLabel);
        this.modal.appendChild(this.createDropdown('address', this.card.address));
        // Сайт
        const websiteLabel = document.createElement('label');
        websiteLabel.innerText = 'Сайт:';
        this.modal.appendChild(websiteLabel);
        const websiteInput = document.createElement('input');
        websiteInput.type = 'text';
        websiteInput.id = 'website';
        websiteInput.value = this.card.website || '';
        websiteInput.style = 'width:100%';
        this.modal.appendChild(websiteInput);
        // Кнопки
        const btnDiv = document.createElement('div');
        btnDiv.style = 'text-align:right;margin-top:1em';
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelBtn';
        cancelBtn.innerText = 'Отмена';
        const saveBtn = document.createElement('button');
        saveBtn.id = 'saveBtn';
        saveBtn.innerText = 'Сохранить';
        saveBtn.style = 'margin-left:1em';
        btnDiv.appendChild(cancelBtn);
        btnDiv.appendChild(saveBtn);
        this.modal.appendChild(btnDiv);
        document.body.appendChild(this.modal);
        cancelBtn.onclick = () => this.close();
        saveBtn.onclick = () => {
            this.card.fullName = this.modal.querySelector('#fio').value;
            this.card.company = this.modal.querySelector('#company').value;
            this.card.position = this.modal.querySelector('#position').value;
            this.card.phones = this.modal.querySelector('#phones').value.split(',').map(p => p.trim());
            this.card.email = this.modal.querySelector('#email').value;
            this.card.address = this.modal.querySelector('#address').value;
            this.card.website = this.modal.querySelector('#website').value;
            this.card.rawText = this.modal.querySelector('#rawText') ? this.modal.querySelector('#rawText').value : '';
            this.close();
            this.onSave(this.card);
        };
    }
    createDropdown(id, value) {
        const wrapper = document.createElement('div');
        wrapper.style = 'position:relative;width:100%;margin-bottom:0.5em;';
        const input = document.createElement('input');
        input.type = 'text';
        input.id = id;
        input.value = value || '';
        input.style = 'width:100%';
        input.autocomplete = 'off';
        const dropdown = document.createElement('div');
        dropdown.style = 'display:none;position:absolute;top:100%;left:0;width:100%;max-height:120px;overflow:auto;background:var(--background-secondary);border:1px solid #888;border-radius:0 0 6px 6px;z-index:1001;';
        dropdown.className = 'dropdown-candidates';
        this.ocrLines.forEach(line => {
            const opt = document.createElement('div');
            opt.innerText = line;
            opt.style = 'padding:4px 8px;cursor:pointer;';
            opt.onmousedown = () => {
                input.value = line;
                dropdown.style.display = 'none';
            };
            dropdown.appendChild(opt);
        });
        input.onfocus = () => { dropdown.style.display = 'block'; };
        input.onblur = () => { setTimeout(() => { dropdown.style.display = 'none'; }, 200); };
        wrapper.appendChild(input);
        wrapper.appendChild(dropdown);
        return wrapper;
    }
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

class BusinessCardOCRSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Настройки Business Card OCR' });
        new Setting(containerEl)
            .setName('Язык OCR')
            .setDesc('Языки для распознавания текста (например, rus, eng, rus+eng)')
            .addText(text => text
                .setPlaceholder('rus+eng')
                .setValue(this.plugin.settings.ocrLanguage)
                .onChange(async (value) => {
                    this.plugin.settings.ocrLanguage = value;
                    await this.plugin.saveSettings();
                }));
        new Setting(containerEl)
            .setName('Улучшать контраст')
            .setDesc('Автоматически повышать контраст изображения перед распознаванием')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enhanceContrast)
                .onChange(async (value) => {
                    this.plugin.settings.enhanceContrast = value;
                    await this.plugin.saveSettings();
                }));
        new Setting(containerEl)
            .setName('Переводить в ч/б')
            .setDesc('Преобразовывать изображение в оттенки серого перед распознаванием')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.toGrayscale)
                .onChange(async (value) => {
                    this.plugin.settings.toGrayscale = value;
                    await this.plugin.saveSettings();
                }));
    }
}

module.exports = class extends Plugin {
    async onload() {
        await this.loadSettings();
        showCustomNotice('Business Card OCR New: Плагин успешно загружен!', 2000);
        this.addRibbonIcon('image', 'Обработать визитку (OCR)', async () => {
            await this.processBusinessCard();
        });
        this.addCommand({
            id: 'process-business-card',
            name: 'Обработать визитку (OCR)',
            callback: async () => {
                await this.processBusinessCard();
            }
        });
        this.addSettingTab(new BusinessCardOCRSettingTab(this.app, this));
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    async processBusinessCard() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.jpg,.jpeg,.png,.webp';
        input.onchange = async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) {
                showCustomNotice('Файл не выбран');
                return;
            }
            showCustomNotice('Распознаю текст...');
            // --- КРОССПЛАТФОРМЕННОСТЬ: Проверка iOS/Mac ---
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isMac = /Macintosh/.test(navigator.userAgent);
            // --- Загрузка Tesseract.js с fallback ---
            if (!window.Tesseract) {
                try {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/tesseract.min.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                } catch (e) {
                    showCustomNotice('Ошибка загрузки OCR движка. Проверьте интернет-соединение.');
                    return;
                }
            }
            // Читаем файл как dataURL
            const reader = new FileReader();
            reader.onload = async () => {
                const imageDataUrl = reader.result;
                // Создаём img для canvas
                const img = new window.Image();
                img.onload = async () => {
                    // Обработка изображения
                    let processedDataUrl = imageDataUrl;
                    if (this.settings.enhanceContrast || this.settings.toGrayscale) {
                        processedDataUrl = processImage(img, {
                            enhanceContrast: this.settings.enhanceContrast,
                            toGrayscale: this.settings.toGrayscale
                        });
                    }
                    // OCR
                    window.Tesseract.recognize(
                        processedDataUrl,
                        this.settings.ocrLanguage,
                        { logger: m => {/* можно добавить прогресс */} }
                    ).then(async ({ data: { text } }) => {
                        if (!text || text.trim().length < 5) {
                            showCustomNotice('Текст не распознан');
                            return;
                        }
                        const card = extractBusinessCardData(text);
                        const ocrLines = text.split(/\r?\n|\u2028|\u2029/).map(l => l.trim()).filter(Boolean);
                        (new EditCardModal(this.app, card, async (editedCard) => {
                            const fileName = (editedCard.fullName || editedCard.company || 'Визитка') + ' ' + new Date().toISOString().slice(0,10);
                            const safeName = fileName.replace(/[^a-zA-Zа-яА-Я0-9\-_ ]/g, '').replace(/\s+/g, ' ').trim();
                            const notePath = safeName + '.md';
                            await this.app.vault.create(notePath, createNoteContent(editedCard));
                            showCustomNotice('Заметка создана: ' + notePath);
                        }, processedDataUrl, ocrLines)).open();
                    }).catch(err => {
                        showCustomNotice('Ошибка OCR: ' + err.message);
                    });
                };
                img.src = imageDataUrl;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
}; 