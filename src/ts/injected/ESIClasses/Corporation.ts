import { EveESI } from '../EveESI';

export class Corporation {
    name: string;
    ticker: string;

    private constructor(data: any) {
        this.name = data.name;
        this.ticker = data.ticker;
    }

    static async get(corporationId: number): Promise<Corporation> {
        if (!corporationId) {
            console.warn("Trying to find a corporation with ID", corporationId);
            return new Corporation({ name: "undefined", ticker: "FIXME"});
        }
        let data = await this.getData(corporationId);
        let result = new Corporation(data);
        return result;
    }

    private static async getData(corporationId: number) {
        let { result } = await EveESI.request(`/corporations/${corporationId}/`);

        return result;
    }
}