import { DESModule } from "./modules/DESModule";
import { Tracking as TrackingModule } from "./modules/tracking/tracking";
import { Entosis as EntosisModule } from "./modules/entosis/entosis";
import { ZKillboard } from "./modules/zkillboard/zkillboard";
import { Observatories } from "./modules/observatories/observatories";

export class DotlanEnhancementSuite {
    private static instance: DotlanEnhancementSuite;
    
    private dotlanMain: HTMLElement | null = null;
    private dotlanSubmenu: HTMLElement | null = null;

    private headerMenu: HTMLElement;
    private sidebar: HTMLElement;
    private mapOverlay: HTMLElement;

    static getInstance(): DotlanEnhancementSuite {
        if (!this.instance) {
            this.instance = new DotlanEnhancementSuite();
        }
        return this.instance;
    }

    get elements(): { [key: string]: HTMLElement } {
        return {
            'sidebar': this.sidebar,
            'header': this.headerMenu,
            'overlay': this.mapOverlay
        }
    }

    private constructor() {
        // Get some Element refrences
        this.dotlanMain = document.getElementById('main');
        this.dotlanSubmenu = document.getElementById('submenu');

        // Create Elements
        this.headerMenu = document.createElement('div');
        this.headerMenu.id = "des-main";

        this.sidebar = document.createElement('div');
        this.sidebar.id = 'des-sidebar';

        this.mapOverlay = document.createElement('div');
        this.mapOverlay.id = 'des-overlay';

        // Add our menues
        if (this.dotlanMain) {
            this.dotlanMain.insertBefore(this.headerMenu, this.dotlanSubmenu);
            this.dotlanMain.insertBefore(this.sidebar, this.dotlanSubmenu);
        }

        const outerMap = document.getElementById('outermap');
        if (outerMap) {
            outerMap.appendChild(this.mapOverlay);
        }

        // Load Modules
        const trackingModule = new TrackingModule(this.elements);
        const entosisModule = new EntosisModule(this.elements);      
        const zkillModule = new ZKillboard(this.elements);
        const observatoryModule = new Observatories(this.elements);
    }
}