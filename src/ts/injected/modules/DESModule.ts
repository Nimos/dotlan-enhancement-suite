export abstract class DESModule {
    protected html: string;
    
    constructor() {
        this.html = this.getLoadingTemplate()
    };

    getLoadingTemplate(): string {
        return `<div id="${this.id}" class="des-header-module des-module-loading"></div>`;
    }

    get id(): string {
        return 'des-module-' + this.constructor.name.toLowerCase();
    }

    getHTML(): string {
        return `<div class="des-header-module" id="${this.id}">${this.html}</div>`;
    }

    updateHTML() {
        let self = document.getElementById(this.id);
        
        if (self) {
            self.innerHTML = this.getTemplate();
        }
    }

    abstract getTemplate(): string;
}