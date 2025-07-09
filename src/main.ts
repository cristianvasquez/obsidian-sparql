import {App, Modal, Notice, Plugin, PluginSettingTab, Setting, MarkdownView} from 'obsidian';
import {extract_all} from "./extract";
import {serialize} from "./serialize";

const PLUGIN_NAME = 'Obsidian-SPARQL'

interface MyPluginSettings {
    mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: 'default'
}

export default class MyPlugin extends Plugin {

    private settings: MyPluginSettings;

    async onload() {
        console.log(`loading ${PLUGIN_NAME} plugin`);
        await this.loadSettings();
        this.addCommand({
            id: 'rdf-sparql-test',
            name: 'Test',
            callback: () => this.extractCurrent(),
        });
    }


    extractCurrent() {
        const view = this.app.workspace.activeLeaf.view;
        if (view instanceof MarkdownView) {
            // Do work here
            const editor = view.editor

            let document = editor.getDoc().getValue()
            let line = editor.getCursor().line

            let data = extract_all(document)
            let turtle = serialize(data)
            console.log('hello')
            new FeedbackModal(this.app, turtle).open();

        }
    }

    onunload() {
        console.log(`unloading ${PLUGIN_NAME} plugin`);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}


class FeedbackModal extends Modal {
    private readonly data: any;

    constructor(app: App, data: any) {
        super(app);
        this.data = data
    }

    onOpen() {
        let {contentEl} = this;
        contentEl.setText(`${this.data}`);
    }

    onClose() {
        let {contentEl} = this;
        contentEl.empty();
    }
}
