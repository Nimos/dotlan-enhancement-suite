import './zkillboard.scss';

import { DESModule } from '../DESModule';
import { EveESI } from '../../EveESI';
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

        let { result } = await EveESI.request(`/killmails/${kill.killID}/${kill.hash}/`)
        
        let killInfo: Kill = await this.fetchKillInfo(result);
        
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

        this.flashKillOverlay(killInfo.solarSystemId);

        this.kills.pop();
    }

    // Get character names, alliance/corp names and solar system name of a given kill
    private async fetchKillInfo(esiData: any, zkbData?: any): Promise<Kill> {

        let queries: Promise<void>[] = [];
        let fetchedData: any = {};

        // Group name to display. If pilot has an alliance, show alliance name
        // if pilot does not have an alliance, show corp name
        // if pilot does not have a corp, it's probably an NPC, show "Unknown"
        if (esiData.victim.alliance_id) {
            queries.push(new Promise<void>((resolve, reject) => {
                Alliance.get(esiData.victim.alliance_id).then(alliance => {
                    fetchedData.victimGroup = alliance.name;
                    resolve();
                });
            }));
        } else if (esiData.victim.corporation_id) {
            queries.push(new Promise<void>((resolve, reject) => {
                Corporation.get(esiData.victim.corporation_id).then(corp => {
                    fetchedData.victimGroup = corp.name;
                    resolve();
                });
            }))
        } else {
            fetchedData.victimGroup = "Unknown";
        }

        // Find victim character name
        // Not all killmails have a victim with a name, e.g. corp-anchored deployables
        if (esiData.victim.character_id) {
            queries.push(new Promise<void>((resolve, reject) => {
                Character.get(esiData.victim.character_id).then(character => {
                    fetchedData.victimName = character.name;
                    resolve();
                })
            }))
        } else {
            fetchedData.victimName = "-";
        }

        // Find final blow
        let attacker: any;
        for (let atk of esiData.attackers) {
            attacker = atk;
            if (atk.final_blow) {
                break;
            }
        }

        // Find final blow character name
        // Not all final blows have a character name, e.g. NPC killmails
        if (attacker.character_id) {
            queries.push(new Promise<void>((resolve, reject) => {
                Character.get(attacker.character_id).then(character => {
                    fetchedData.attackerName = character.name;
                    resolve();
                })
            }))
        } else {
            fetchedData.attackerName = "-";
        }

        // Group name to display. If pilot has an alliance, show alliance name
        // if pilot does not have an alliance, show corp name
        // if pilot does not have a corp, it's probably an NPC, show "Unknown"
        if (attacker.alliance_id) {
            queries.push(new Promise<void>((resolve, reject) => {
                Alliance.get(attacker.alliance_id).then(alliance => {
                    fetchedData.attackerGroup = alliance.name;
                    resolve();
                });
            }));
        } else if (attacker.corporation_id) {
            queries.push(new Promise<void>((resolve, reject) => {
                Corporation.get(attacker.corporation_id).then(corp => {
                    fetchedData.attackerGroup = corp.name;
                    resolve();
                });
            }))
        } else {
            fetchedData.attackerGroup = "Unknown";
        }

        await Promise.all(queries);
        
        return {
            killId: esiData.killmail_id,
            victimShipTypeId: esiData.victim.ship_type_id,
            victimAlliance: fetchedData.victimGroup,
            victimName: fetchedData.victimName,
            attackerName:  fetchedData.attackerName,
            attackerAlliance:  fetchedData.attackerGroup,
            solarSystemName: (await SolarSystem.get(esiData.solar_system_id)).solarSystemName,
            solarSystemId: esiData.solar_system_id,
            time: new Date(esiData.killmail_time)
        }
    }

    private flashKillOverlay(systemId: number) {
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


        let infoQueries: Promise<Kill>[] = [];
        
        for (let kill of kills) {
            let { result } = await EveESI.request(`/killmails/${kill.killmail_id}/${kill.zkb.hash}/`)
            
            infoQueries.push(this.fetchKillInfo(result));
        }

        let killInfos: Kill[] = await Promise.all(infoQueries);

        // Get full kill information from ESI
        this.kills = [];
        for (let killInfo of killInfos) {
            this.kills.push(killInfo);
        }

        this.updateHTML();


        // Establish zKillboard WebSocket
        this.socket = new WebSocket("wss://zkillboard.com/websocket/");
        
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