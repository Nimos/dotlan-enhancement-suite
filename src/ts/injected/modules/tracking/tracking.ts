import './tracking.scss';

import { DESModule } from '../DESModule';
import { EveESI } from '../../EveESI';
import { SolarSystem } from '../../ESIClasses/SolarSystem';
import { config } from '../../../config';

export class Tracking extends DESModule {
    private loaded = false;
    private following: boolean;
    private solarSystem: SolarSystem | undefined;
    private characterName = "";
    private regionId: number = 0;
    private overlay: HTMLElement;

    constructor(elements: { [key: string]: HTMLElement }) {
        super(elements);

        this.following = localStorage.getItem('des-option-following') === "true" ;

        setInterval(() => {
            this.update();
        }, 2500);
        this.update();

        this.overlay = document.createElement('div');
        this.overlay.id = 'des-tracking-overlay';   
        this.elements.overlay.appendChild(this.overlay);
        
    }

    async update() {
        let characterId = await EveESI.getCharacterId();
        let characterName = await EveESI.getCharacterName();

        let { result } = await EveESI.request("/characters/" + characterId + "/location/");
        let location = result;

        let solarSystem = await SolarSystem.get(location.solar_system_id);

        this.characterName = characterName;
        
        if (solarSystem.solarSystemId != this.solarSystem?.solarSystemId) {
            this.solarSystem = solarSystem;
            this.loaded = true;
            this.updateHTML();
            
            let system = this.mapDocument.getElementById('sys' + location.solar_system_id);
            let rect = system?.getBoundingClientRect();

            if (rect) {
                this.overlay.style.display = "";
                this.overlay.style.top = rect.y + "px";
                this.overlay.style.left = rect.x + "px";
            } else {
                this.overlay.style.display = "none";
            }
            
            if (this.following) {
                if (this.regionId !== (await solarSystem.constellation).regionId) {
                    let regionName = (await (await solarSystem.constellation).region).regionName.replace(' ', '_');
                    let newMap = config.dotlanHost + "/map/" + regionName;
                    
                    if (!window.location.href.includes(regionName)) {
                        console.log("New Map:", newMap);
                        window.location.href = newMap;
                    }
                }
            }
        }
    }

    getHeaderHtml() {
        if (!this.solarSystem) {
            return `
                <span class="des-menu-headline">Tracking</span>
                <span class="des-character">Character: <span class="des-esi-login-hint">(Login)</span></span>
                <span class="des-character">Location: </span>
            `
        } else {
            return ` 
                <div class="des-menu-headline">
                    <span class="des-menu-headline">Tracking</span>
                    <span class="des-menu-checkbox">Follow <input type="checkbox" ${this.following ? 'checked' : ''}></span>
                </div>
                <span class="des-character">Character: <span id="des-character-name">${this.characterName}</span></span>
                <span class="des-character">Location: <span id="des-character-location">${this.solarSystem.solarSystemName}</span></span>
            `
        }
    }
}