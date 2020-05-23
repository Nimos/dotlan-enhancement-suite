import { EveESI } from '../EveESI';
import { Constellation } from './Constellation';

export interface SolarSystemObj {
    constellation_id: number,
    name: string,
    security_status: number,
    system_id: number
}


export class SolarSystem {
    solarSystemId: number;
    solarSystemName: string;
    constellationId: number;
    
    private _constellation: Constellation | null = null;

    private constructor(data: SolarSystemObj) {
        this.solarSystemId = data.system_id;
        this.solarSystemName = data.name;
        this.constellationId = data.constellation_id;
    }

    static async get(solarSystemId: number) {
        let data = await this.getData(solarSystemId);

        return new this(data);
    }

    private static async getData(solarSystemId: number): Promise<SolarSystemObj> {

        let { result } = await EveESI.request("/universe/systems/" + solarSystemId + "/");

        return {
            "system_id": result.system_id,
            "constellation_id": result.constellation_id,
            "name": result.name,
            "security_status": result.security_status
        }
    }
    
    get constellation(): Promise<Constellation> {
        return new Promise((resolve, reject) => {
            if (!this._constellation) {
                Constellation.get(this.constellationId).then((constellation) => {
                    this._constellation = constellation;
                    resolve(constellation);
                });
            } else {
                resolve(this._constellation);
            }
        });
    }
}