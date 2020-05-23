import { EveESI } from '../EveESI';

export class Character {
    name: string;

    private constructor(data: any) {
        this.name = data.name;
    }

    static async get(characterId: number): Promise<Character> {
        let data = await this.getData(characterId);
        let result = new Character(data);
        return result;
    }

    private static async getData(characterId: number) {
        let { result } = await EveESI.request(`/characters/${characterId}/`);

        return result;
    }
}