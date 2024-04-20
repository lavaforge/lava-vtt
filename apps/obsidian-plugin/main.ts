import {
    App,
    Setting,
    FileSystemAdapter,
    Menu,
    Plugin,
    PluginSettingTab,
    TFile,
} from 'obsidian';
import { promises as fs } from 'fs';
import { hashBuffer } from 'shared';

interface LavaVttPluginSettings {
    serverAddress: string;
    serverPort: number;
}

const DEFAULT_SETTINGS: LavaVttPluginSettings = {
    serverAddress: 'localhost',
    serverPort: 3000,
};

export default class LavaVttPlugin extends Plugin {
    settings: LavaVttPluginSettings;
    private apiVersion: string | undefined = undefined;
    baseUrl: String;

    async onload() {
        await this.initBaseUrl();

        this.registerDomEvent(document, 'contextmenu', (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.localName !== 'img') return;

            const imgPath = (target as HTMLImageElement).currentSrc;
            // @ts-expect-error resolveFileUrl is not part of the public API
            const file = this.app.vault.resolveFileUrl(imgPath);

            if (!(file instanceof TFile)) return;
            if (!(this.app.vault.adapter instanceof FileSystemAdapter)) return;

            const adapter = this.app.vault.adapter;

            const menu = new Menu();
            menu.addItem((item) => {
                item.setTitle(`Open ${adapter.getFullPath(file.path)}`).onClick(
                    async () => {
                        if (this.apiVersion === undefined) {
                            // fetch from /api/version. if route is not found, use version v0
                            await this.fetchApiVersion();
                        }

                        if (this.apiVersion === 'v0') {
                            await this.postImageV0(adapter, file);
                        } else if (this.apiVersion === 'v1') {
                            await this.postImageV1(adapter, file);
                        } else {
                            throw new Error(
                                'Unknown API version, please update this plugin!',
                            );
                        }
                    },
                );
            });

            menu.showAtPosition({ x: event.pageX, y: event.pageY });
        });

        this.addSettingTab(new LavaVttSettingTab(this.app, this));
    }

    public async initBaseUrl() {
        await this.loadSettings();
        this.baseUrl =
            'http://' +
            this.settings.serverAddress +
            ':' +
            this.settings.serverPort +
            '/api/';
    }

    private async postImageV1(adapter: FileSystemAdapter, file: TFile) {
        const fileContent = await fs.readFile(adapter.getFullPath(file.path));

        const hash = hashBuffer(fileContent);
        console.log('other hash', hash);

        const headResponse = await fetch(`${this.baseUrl}image/${hash}`, {
            method: 'HEAD',
        });

        if (headResponse.status !== 200) {
            console.log('uploading new image');
            await fetch(`${this.baseUrl}image`, {
                method: 'POST',
                body: fileContent, // Send the file content as the body
                headers: {
                    // Set appropriate headers if needed (e.g., for file type)
                    'Content-Type': 'application/octet-stream',
                },
            });
        } else {
            console.log('image already exists, no upload necessary');
        }

        await fetch(`${this.baseUrl}display`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hash }),
        });
    }

    private async postImageV0(adapter: FileSystemAdapter, file: TFile) {
        await fetch(`${this.baseUrl}new-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: adapter.getFullPath(file.path) }),
        });
    }

    private async fetchApiVersion() {
        await fetch(`${this.baseUrl}version`)
            .then((res) => res.json())
            .then((data) => {
                this.apiVersion = data.version;
                console.log('API VERSION', this.apiVersion);
            })
            .catch(() => {
                this.apiVersion = 'v0';
                console.log('API VERSION', this.apiVersion);
            });
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class LavaVttSettingTab extends PluginSettingTab {
    plugin: LavaVttPlugin;

    constructor(app: App, plugin: LavaVttPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        const heading = containerEl.createEl('h3');
        heading.textContent = 'General Settings';

        new Setting(containerEl)
            .setName('Server address')
            .setDesc('The address of the lava-vtt server')
            .addText((text) =>
                text
                    .setPlaceholder('Enter your server address')
                    .setValue(this.plugin.settings.serverAddress)
                    .onChange(async (value) => {
                        this.plugin.settings.serverAddress = value;
                        await this.plugin.saveSettings();
                        await this.plugin.initBaseUrl();
                    }),
            );

        new Setting(containerEl)
            .setName('Server port')
            .setDesc('The port of the lava-vtt server')
            .addText((text) =>
                text
                    .setPlaceholder('Enter your server port')
                    .setValue(String(this.plugin.settings.serverPort))
                    .onChange(async (value) => {
                        this.plugin.settings.serverPort = Number(value); // TODO: validate server port (int + 0-65... range)
                        await this.plugin.saveSettings();
                        await this.plugin.initBaseUrl();
                    }),
            );
    }
}
