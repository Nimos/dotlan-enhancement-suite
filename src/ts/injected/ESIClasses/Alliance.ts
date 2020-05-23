import { EveESI } from '../EveESI';

export class Alliance {
    name: string;
    ticker: string;

    private constructor(data: any) {
        this.name = data.name;
        this.ticker = data.ticker;
    }

    static async get(allianceId: number): Promise<Alliance> {
        let data = await this.getData(allianceId);
        let result = new Alliance(data);
        return result;
    }

    private static async getData(allianceId: number) {
        let { result } = await EveESI.request(`/alliances/${allianceId}/`);

        return result;
    }
}