import { EveESI } from '../EveESI';

export interface RegionObj {
    region_id: number,
    name: string
}

export class Region {
    regionId: number;
    regionName: string;

    private constructor(data: RegionObj) {
        this.regionId = data.region_id;
        this.regionName = data.name;
    }

    static async get(regionId: number): Promise<Region> {
        let data = await this.getData(regionId);
        return new Region(data);
    }

    static async getData(regionId: number): Promise<RegionObj> {
        let { result } = await EveESI.request("/universe/regions/" + regionId + "/");

        return {
            "region_id": result.region_id,
            "name": result.name
        }
    }
}
