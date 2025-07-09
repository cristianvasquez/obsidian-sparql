import {App, Modal} from "obsidian";

export class ModalWrapper extends Modal {
    constructor(app, view) {
        super(app);
        this.view = view
    }

    onOpen() {
        const {contentEl} = this;
        this.view.mount(contentEl)
    }

    onClose() {
        const {contentEl} = this;
        this.view.unmount(contentEl)
    }
}