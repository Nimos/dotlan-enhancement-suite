import './entosis.scss';

import { DESModule } from '../DESModule';
import { Campaign } from '../../ESIClasses/Campaign';

export class Entosis extends DESModule {
    private html: string | undefined;
    private campaigns: Campaign[] | undefined;

    constructor(elements: { [key: string]: HTMLElement }) {
        super(elements);

        setInterval(() => {
            this.update();
        }, 10000);
        this.update();

        setInterval(() => {
            this.updateTimers();
        }, 1000)
    }

    private updateTimers() {
        document.querySelectorAll('.des-campaign-timer').forEach((el) => {
            if (!(el instanceof HTMLElement) || !el.dataset.timestamp) {
                return;
            }
            let startDate = parseInt(el.dataset.timestamp);
            let now = (new Date()).getTime();
            let remaining = startDate - now;
            
            let days = Math.floor(remaining / (1000*60*60*24));
            remaining %= (1000*60*60*24)
            let hours = Math.floor(remaining / (1000*60*60));
            remaining %= (1000*60*60);
            let minutes = Math.floor(remaining / (1000*60));
            remaining %= (1000*60);
            let seconds = Math.floor(remaining / 1000);
            
            if (el.dataset.short == "true") {
                el.innerText = `${minutes}m ${seconds}s`;
            } else {
                el.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }

          });
    }


    async update() {
        this.campaigns = await Campaign.get();

        this.campaigns = this.campaigns.sort((a, b) => {
            return new Date(a.start_time).valueOf() - new Date(b.start_time).valueOf();
        })

        for (let campaign of this.campaigns) {
            let system = this.mapDocument.getElementById('sys' + campaign.solar_system_id);
            let rect = system?.getBoundingClientRect();
            if (!rect) continue;

            let element = document.getElementById('des-entosis-system-' + campaign.solar_system_id);
            
            if (!element) {
                element = document.createElement('div')
                element.classList.add('des-entosis-overlay')
                element.id = 'des-entosis-system-' + campaign.solar_system_id;
                element.style.top = rect.y + rect.height + "px";
                element.style.left = rect.x + ( (rect.width - 50) / 2 ) + "px";
                this.elements.overlay.appendChild(element);
            }

            let startTime = new Date(campaign.start_time);
            let now = new Date();

            if (startTime <= now) {
                element.innerHTML  = `<span class="des-campaigns-attacker">${campaign.attackers_score * 100}%</span>`;
                element.innerHTML += `<div class="des-campaigns-progressbar">
                                        <div class="des-campaigns-progressbar-inner" style="width: ${100 * campaign.attackers_score}%"></div>
                                    </div>`;
                element.innerHTML += `<span class="des-campaigns-defender">${Math.round((1 - campaign.attackers_score) * 100)}%</span>`;
            } else if (startTime.valueOf() - now.valueOf() < 60 * 60 * 1000) {
                element.innerHTML = `<span class="des-campaign-timer" data-short="true" data-timestamp="${startTime.valueOf()}"></span>`;
                this.updateTimers();
            }
        }

        this.updateHTML();
    }

    private formatDate(date: Date) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return `${days[date.getUTCDay()]}, ${(""+date.getUTCHours()).padStart(2, '0')}:${(""+date.getUTCMinutes()).padStart(2, '0')}`;
    }

    getSidebarHtml() {
        if (!this.campaigns) {
            return "Loading...";
        }

        let inner = "";
        for (let campaign of this.campaigns) {

            // System not on this map
            if (!this.mapDocument.getElementById('def' + campaign.solar_system_id)) {
                continue;
            }

            let startTime = new Date(campaign.start_time);
            let now = new Date();

            if (startTime <= now) {
                inner += `<div class="des-campaign">
                                <div class="des-campaign-header">
                                    <span class="des-campaign-system">${campaign.solar_system_name}</span>
                                    <span class="des-campaign-defender">${campaign.defender.name}</span>
                                </div>
                                <div class="des-campaigns-progress-wrapper">
                                    <span class="des-campaigns-attacker">${campaign.attackers_score * 100}%</span>
                                    <div class="des-campaigns-progressbar">
                                        <div class="des-campaigns-progressbar-inner" style="width: ${100 * campaign.attackers_score}%"></div>
                                    </div>
                                    <span class="des-campaigns-defender">${Math.round((1 - campaign.attackers_score) * 100)}%</span>
                                </div>
                            </div>`;
            } else {
                inner += `<div class="des-campaign">
                            <div class="des-campaign-header">
                                <span class="des-campaign-system">${campaign.solar_system_name}</span>
                                <span class="des-campaign-defender">${campaign.defender.name}</span>
                            </div>
                            <div class="des-campaign-date">
                            <span class="des-campaign-timer" data-timestamp="${startTime.valueOf()}"></span>                                
                            <span class="des-campaign-start-date">${this.formatDate(startTime)}</span>
                            </div>
                        </div>`
            }
            
        }

        if (inner.length == 0) {
            inner = `<div class="des-campaign">No upcoming or active timers in this Region.</div>`;
        }

        let result = `
            <span class="des-sidebar-headline">Entosis Timers</span>
            <div class="campaign-list">
                ${inner}
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