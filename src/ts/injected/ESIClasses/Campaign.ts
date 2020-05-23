import { SolarSystem } from './SolarSystem';
import { Alliance } from './Alliance';
import { EveESI } from '../EveESI';


export class Campaign {
    attackers_score: number;
    campaign_id: number;
    constellation_id: number;

    defender_id: number;
    defender: Alliance;
    defender_score: number;
    event_type: string;

    solar_system_id: number;
    start_time: number;
    _system: SolarSystem | undefined;
    solar_system_name: string | undefined;

    private constructor(data: any, name: string, defender: Alliance) {

        this.attackers_score = data.attackers_score;
        this.campaign_id = data.campaign_id;
        this.constellation_id = data.constellation_id;
        this.defender_id = data.defender_id;
        this.defender_score = data.defender_scode;
        this.event_type = data.event_type;
        this.solar_system_id = data.solar_system_id;
        this.start_time = data.start_time;

        this.defender = defender;

        this.solar_system_name = name
    }

    static async get(): Promise<Campaign[]> {
        let data = await this.getData();
        let result = [];
        for (let campaign of data) {
            let system = await SolarSystem.get(campaign.solar_system_id);
            let defender = await Alliance.get(campaign.defender_id);
            let campaignObj = new Campaign(campaign, system.solarSystemName, defender);
            result.push(campaignObj)
        }
        return result;
    }

    private static async getData() {
        let { result } = await EveESI.request("/sovereignty/campaigns/");

        return result;
    }

    get system(): Promise<SolarSystem> {
        return new Promise((resolve, reject) => {
            if (!this._system) {
                SolarSystem.get(this.solar_system_id).then((system) => {
                    this._system = system;
                    resolve(system);
                });
            } else {
                resolve(this._system);
            }
        });
    }
}