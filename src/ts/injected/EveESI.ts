import { config } from "../config"

export class EveESI {
    private static characterId: number = 0;

    static async request(endpoint: string, data?: object) {
        console.groupCollapsed("ESI Request to", endpoint);

        let url = config.esiHost;
        url += endpoint;

        let cached = this.checkCache(url, this.hashData(data));

        if (cached) {
            console.log("Returning from Cache");
            console.groupEnd();
            return cached;
        }

        if (data) {
            console.warn("WARNING: You're trying to do a POST request, but that's not yet implemented.")
        }

        let token = await this.getToken();

        let response = await fetch(url, { headers: { "Authorization": "Bearer " +  token} });
        let result = await response.json();

        if (!result) {
            console.error("No result");
            console.groupEnd();
            return false;
        }


        let expiresHeader = response.headers.get("expires");

        let expires;
        if (expiresHeader) {
            expires = (new Date(expiresHeader)).getTime();
        } else {
            expires = (new Date()).getTime() + 3600 * 24 * 30;
        }

        this.setCache(url, this.hashData(data), { data: result, expires: expires });
 
        console.log("Result", result);
        console.groupEnd();
        return result;
    } 

    private static getToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({method: "getToken"}, function(response) {
                resolve(response.token);
            });            
        })
    }

    private static getTokenData(): Promise<any> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({method: "getToken"}, function(response) {
                resolve(response);
            });            
        })
    }

    static async getCharacterName(): Promise<string> {
        return (await this.getTokenData()).characterName;
    }

    
    static async getCharacterId(): Promise<string> {
        return (await this.getTokenData()).characterId;
    }

    /*
        Returns an "identifier-friendly" representation of an object
    */
    private static hashData(data?: object) {
        if (!data) {
            return "";
        }
        // TODO: actually use a hash function
        return btoa(JSON.stringify(data));
    }

    private static setCache(url: string, dataHash: string = "", data: object) {
        const identifier = 'esicache-' + url + '#' + dataHash;

        localStorage.setItem(identifier, JSON.stringify(data));
    }

    private static checkCache(url: string, dataHash: string = "") {
        const identifier = 'esicache-' + url + '#' + dataHash;
        let cached = localStorage.getItem(identifier);

        
        if (cached) {
            let cachedData = JSON.parse(cached);

            if (cachedData.expires < (new Date().getTime())) {
                localStorage.removeItem(identifier)
                return false;
            }

            return cachedData.data;
        }

        return false;
    }
}