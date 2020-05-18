import { DESModule } from './DESModule';
import { EveESI } from '../EveESI';

export class Tracking extends DESModule {
    private loaded = false;
    private solarSystem = "HED-GP";
    private characterName = "Nimos Endashi";

    constructor() {
        super();
        this.html = this.getTemplate()

        setInterval(() => {
            this.update();
        }, 10000);
    }

    async update() {
        let characterId = await EveESI.getCharacterId();
        let characterName = await EveESI.getCharacterName();

        let location = await EveESI.request("/characters/" + characterId + "/location/");

        this.characterName = characterName;
        this.solarSystem = location.solar_system_id;
        this.loaded = true;

        this.updateHTML();
    }

    getTemplate() {
        if (!this.solarSystem) {
            return `
                <span class="des-menu-headline">Tracking</span>
                <span class="des-character">Character: <span class="des-esi-login-hint">(Login)</span></span>
                <span class="des-character">Location: </span>
            `
        } else if (this.loaded) {
            return `
                <span class="des-menu-headline">Tracking</span>
                <span class="des-character">Character: <span id="des-character-name">${this.characterName}</span></span>
                <span class="des-character">Location: <span id="des-character-location">${this.solarSystem}</span></span>
            `
        } else {
            return this.getLoadingTemplate();
        }
    }
}