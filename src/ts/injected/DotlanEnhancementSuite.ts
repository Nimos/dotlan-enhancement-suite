import { DESModule } from "./modules/DESModule";
import { Tracking as TrackingModule } from "./modules/tracking";
import { EveESI } from "./EveESI";

export class DotlanEnhancementSuite {
    private static instance: DotlanEnhancementSuite;
    
    private dotlanSubmenu: HTMLElement | null = null;
    private extensionMenu: HTMLElement | null = null;
    private dotlanMain: HTMLElement | null = null;

    private modules: Array<DESModule> = [];

    static getInstance(): DotlanEnhancementSuite {
        if (!this.instance) {
            this.instance = new DotlanEnhancementSuite();
        }
        return this.instance;
    }

    private constructor() {
        // Get some Element refrences
        this.dotlanMain = document.getElementById('main');
        this.dotlanSubmenu = document.getElementById('submenu');
        this.extensionMenu = document.createElement('div');
        this.extensionMenu.id = "des-main";

        // Add our menu
        if (this.dotlanMain) {
            this.dotlanMain.insertBefore(this.extensionMenu, this.dotlanSubmenu);
        }

        // Load Modules
        const trackingModule = new TrackingModule();
        this.modules.push(trackingModule);

        this.extensionMenu.innerHTML += trackingModule.getHTML();
    }
}