import { config } from "../config"

export class EveESI {
    private static characterId: number = 0;

    // Sends an authenticated request to the specified ESI Endpoint
    // or returns the cached result if one exists
    static async request(endpoint: string, data?: object): Promise<{ result: any, responseData: any }> {
        let url = config.esiHost;
        url += endpoint;

        // Get cached result
        let cached = this.checkCache(url, this.hashData(data));

        if (cached) {
            return { result: cached, responseData: { from: "cache" } };
        }

        // Send Request
        let token = await this.getToken();
        let options: RequestInit = { headers: { "Authorization": "Bearer " + token }}
        

        // Add Data if needed
        if (data) {
            options.body = JSON.stringify(data);
            options.method = 'POST';
        }

        let response = await fetch(url, options);
        let result = await response.json();

        if (!result) {
            console.error("No result");
            return { result: false, responseData: response };
        }


        // Store in cache
        let expiresHeader = response.headers.get("expires");

        let expires;
        if (expiresHeader) {
            expires = (new Date(expiresHeader)).getTime();
        } else {
            expires = (new Date()).getTime() + 3600 * 24 * 30;
        }

        this.setCache(url, this.hashData(data), { data: result, expires: expires });
 
        return { result: result, responseData: result };
    } 

    // Gets the stored token from the EveAuth module
    private static getToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({method: "getToken"}, function(response) {
                resolve(response.token);
            });            
        })
    }

    // Gets the stored token as well as character name and character Id
    private static getTokenData(): Promise<any> {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ method: "getToken" }, function (response) {
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




