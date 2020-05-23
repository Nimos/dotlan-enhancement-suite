import './zkillboard.scss';

import { DESModule } from '../DESModule';
import { EveESI } from '../../EveESI';
import { DotlanEnhancementSuite } from '../../DotlanEnhancementSuite';
import { Alliance } from '../../ESIClasses/Alliance';
import { Character } from '../../ESIClasses/Character';
import { SolarSystem } from '../../ESIClasses/SolarSystem';
import { Corporation } from '../../ESIClasses/Corporation';

interface Kill {
    killId: number,
    victimShipTypeId: number,
    victimAlliance: string,
    victimName: string,
    attackerName: string,
    attackerAlliance: string,
    solarSystemId: number,
    solarSystemName: string,
    time: Date,
}

export class ZKillboard extends DESModule {
    private html?: string;
    private kills: Kill[] = [];
    private socket?: WebSocket;
    private killList?: HTMLDivElement;

    constructor(elements: { [key: string]: HTMLElement }) {
        super(elements);

        this.getData();
    }

    private async addKill(kill: any) {
        
        let killInfo: Kill = {
            killId: kill.killmail_id,
            victimShipTypeId: kill.victim.ship_type_id,
            victimAlliance: kill.victim.alliance_id ? (await Alliance.get(kill.victim.alliance_id)).name : (await Corporation.get(kill.victim.corporation_id)).name,
            victimName: (await Character.get(kill.victim.character_id)).name,
            attackerName: kill.attackers[0].character_id ? (await Character.get(kill.attackers[0].character_id)).name : "-",
            attackerAlliance: kill.attackers[0].alliance_id ? (await Alliance.get(kill.attackers[0].alliance_id)).name : (await Corporation.get(kill.attackers[0].corporation_id)).name,
            solarSystemId: kill.solar_system_id,
            solarSystemName: (await SolarSystem.get(kill.solar_system_id)).solarSystemName,
            time: new Date(kill.killmail_time),
        } 
        
        this.kills.unshift(killInfo);

        const listEl = document.getElementById('des-kills-list');
        if (!listEl) {
            return;
        }
        const killEl = this.renderKill(killInfo);
        killEl.classList.add('inserted');


        listEl.prepend(killEl);

        if (listEl.lastChild) {
            listEl.removeChild(listEl.lastChild);
        }

        this.flashKillOverlay(kill.solarSystemId);

        this.kills.slice(0, 20);
    }

    private flashKillOverlay(systemId: number) {
        console.log("Flash Start", systemId);
        let system = this.mapDocument.getElementById('sys' + systemId);
        let rect = system?.getBoundingClientRect();

        if (!rect) {
            return;
        }

        let flash = document.createElement('div');
        flash.classList.add('des-killmail-flash');

        flash.style.top = rect.y + "px";
        flash.style.left = rect.x + "px";

        let bgUrl = chrome.runtime.getURL('img/skull.png');
        flash.style.backgroundImage = `url(${bgUrl})`; 

        flash.onanimationend = () => {
            console.log("Flash Done", systemId);
            flash.remove();
        }

        this.elements.overlay.appendChild(flash);

    }

    private async getData() {

        // Get Region name from current page
        let regionNameEl = document.querySelector('#submenu_left > h2');
        let regionName;
            
        if (regionNameEl instanceof HTMLElement) {
            regionName = regionNameEl.innerText
        } else {
            regionName = "unknown";
        }
        
        // resolve region name to region ID
        let { result } = await EveESI.request('/universe/ids/', [regionName]);
        let regionId = result.regions[0].id;

        // Get kills from ZKB
        let kills = await (await fetch(`https://zkillboard.com/api/regionID/${regionId}/`)).json();
        kills = kills.slice(0, 20);

        // Get full kill information from ESI
        this.kills = [];
        for (let kill of kills) {
            let { result } = await EveESI.request(`/killmails/${kill.killmail_id}/${kill.zkb.hash}/`)

            let killInfo: Kill = {
                killId: kill.killmail_id,
                victimShipTypeId: result.victim.ship_type_id,
                victimAlliance: result.victim.alliance_id ? (await Alliance.get(result.victim.alliance_id)).name : (await Corporation.get(result.victim.corporation_id)).name,
                victimName: (await Character.get(result.victim.character_id)).name,
                attackerName: result.attackers[0].character_id ? (await Character.get(result.attackers[0].character_id)).name : "-",
                attackerAlliance: result.attackers[0].alliance_id ? (await Alliance.get(result.attackers[0].alliance_id)).name : (await Corporation.get(result.attackers[0].corporation_id)).name,
                solarSystemName: (await SolarSystem.get(result.solar_system_id)).solarSystemName,
                solarSystemId: result.solar_system_id,
                time: new Date(result.killmail_time),
            } 
            this.kills.push(killInfo);
        }

        this.updateHTML();


        // Establish zKillboard WebSocket
        this.socket = new WebSocket("wss://zkillboard.com:2096");
        
        this.socket.addEventListener('message', (ev: any) => this.addKill(JSON.parse(ev.data)));
        this.socket.addEventListener('open', (ev) => {
            if (!this.socket) return;
            this.socket.send(JSON.stringify({ 'action': 'sub', 'channel': 'region:'+regionId }));
        });
    }

    private formatTime(time: Date) {
        return `${time.getUTCHours().toString().padStart(2, "0")}:${time.getUTCMinutes().toString().padStart(2, "0")}`
    }

    private renderKill(kill: Kill): HTMLAnchorElement {
        const el = document.createElement('a');
        el.href = `http://zkillboard.com/kill/${kill.killId}`;
        el.target = "_blank";
        el.classList.add("des-kill");

        el.innerHTML = `
        <div class="des-kill-info">
            <span class="des-kill-time">${this.formatTime(kill.time)}</span>
            <span class="des-kill-system">${kill.solarSystemName}</span>
        </div>
        <div class="des-kill-ship">
            <span style="background-image: url(https://images.evetech.net/types/${kill.victimShipTypeId}/render)" class="des-kill-image"></span>
        </div>
        <div class="des-kill-victim">
            <span class="des-kill-victim-name">${kill.victimName}</span>
            <span class="des-kill-victim-alliance">${kill.victimAlliance}</span>
        </div>
        <div class="des-kill-killer">
            <span class="des-kill-killer-name">${kill.attackerName}</span>
            <span class="des-kill-killer-alliance">${kill.attackerAlliance}</span>
        </div>`;

        return el;

    }


    getSidebarHtml() {
        if (!this.kills) {
            return "Loading...";
        }

        this.killList = document.createElement('div');

        for (let kill of this.kills) {
            this.killList.appendChild(this.renderKill(kill));
        }

        let result = `
            <span class="des-sidebar-headline">Recent Kills</span>
            <div id="des-kills-list">
                ${this.killList.innerHTML}
            </div>
        `

        // Only update when there is a change
        if (result !== this.html) {
            this.html = result;
            return result;
        } else {
            return false;
        }
    }
}