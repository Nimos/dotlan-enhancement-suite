export abstract class DESModule {
    protected map: SVGElement;
    protected mapDocument: Document;
    protected target = "header";
    
    constructor(public elements: { [key: string]: HTMLElement }) {
        let mapObject = <HTMLObjectElement>document.getElementById('map');
        if (mapObject && mapObject.contentDocument) {
            this.mapDocument = mapObject.contentDocument;
            let svg = mapObject.contentDocument.querySelector('svg');
            if (svg) {
                this.map = svg;
            } else {
                throw "No SVG Element Found, cannot create module!";
            }
        } else {
            throw "No Map Object Element Found, cannot create module!";
        }

        this.elements.header.innerHTML += this.getHeaderOuter();
        this.elements.sidebar.innerHTML += this.getSidebarOuter();
    };

    get id(): string {
        return 'des-module-' + this.constructor.name.toLowerCase();
    }

    getHeaderOuter(): string | false {
        let html = this.getHeaderHtml();
        if (!html) {
            return "";
        }
        return `<div class="des-header-module" id="${this.id}-header">${html}</div>`;
    }

    getSidebarOuter(): string | false {
        let html = this.getSidebarHtml();
        if (!html) {
            return "";
        }
        return `<div class="des-sidebar-module" id="${this.id}-sidebar">${html}</div>`;
    }

    updateHTML() {

        let header = this.getHeaderHtml();

        if (header) {
            let self = document.getElementById(this.id + "-header");
            
            if (self) {
                self.innerHTML = header;
            }
        }

        let sidebar = this.getSidebarHtml();

        if (sidebar) {
            let self = document.getElementById(this.id + "-sidebar");
            
            if (self) {
                self.innerHTML = sidebar;
            }
        }
    }

    getHeaderHtml(): string | false {
        return false;
    };
    getSidebarHtml(): string | false {
        return false;
    };
}