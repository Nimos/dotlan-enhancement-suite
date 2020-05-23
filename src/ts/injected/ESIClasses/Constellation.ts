import { EveESI } from '../EveESI';
import { Region } from './Region';

export interface ConstellationObj {
    constellation_id: number,
    name: string,
    region_id: number
}

export class Constellation {
    constellationId: number;
    constellationName: string;
    regionId: number;

    private _region: Region | null = null;

    private constructor(data: ConstellationObj) {
        this.constellationId = data.constellation_id;
        this.constellationName = data.name;
        this.regionId = data.region_id;
    }

    static async get(constellationId: number): Promise<Constellation> {
        let data = await this.getData(constellationId);
        return new Constellation(data);
    }

    static async getData(constellationId: number): Promise<ConstellationObj> {
        let { result } = await EveESI.request("/universe/constellations/" + constellationId + "/");

        return {
            "constellation_id": result.constellation_id,
            "region_id": result.region_id,
            "name": result.name
        }
    }

    get region(): Promise<Region> {
        return new Promise((resolve, reject) => {
            if (!this._region) {
                Region.get(this.regionId).then((region) => {
                    this._region = region;
                    resolve(region);
                });
            } else {
                resolve(this._region);
            }
        });
    }
}