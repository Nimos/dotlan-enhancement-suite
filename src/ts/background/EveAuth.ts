import { UrlSafeBase64 } from '../utils/url-safe-b64';
import Base64 from 'crypto-js/enc-base64';
import SHA256 from 'crypto-js/sha256';
import { config } from '../config';


declare interface TokenData {
    token: string,
    expires: number,
    refresh_token: string,
    characterId: number,
    characterName: string
}

export class EveAuth {
    private static clientId = config.esiClientId;
    private tokenData: TokenData | null = null;
    private token: string | null | boolean = null;
    private static instance: EveAuth;

    /* Returns the EveAuth instance
        
    */
    static getInstance(): EveAuth {
        if (!this.instance) {
            this.instance = new EveAuth();
        }
        return this.instance;
    }

    
    private constructor() {
        this.getToken().then(tokenData => this.tokenData = tokenData).catch((o) => this.token = false).finally(() => {
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (sender.id != chrome.runtime.id) {
                sendResponse({ "error": "unauthorized" });
            }

            if (request.method == "getToken") {
                this.getToken().then((tokenData) => {
                    sendResponse(tokenData);
                })
            } else {
                sendResponse("no");
            }

            return true;
        })
        
    }

    /* Returns the user's ESI token
       Uses refresh token if the current token is expired
    */
    async getToken(): Promise<TokenData | null> {
        console.log("Getting ESI token...");

        if (this.tokenData && this.tokenData.expires >= (new Date().getTime())) {
            return this.tokenData;
        } else {
            try {
                this.tokenData = await this.getStoredToken();
                
                if (this.tokenData.expires <= (new Date().getTime())) {
                    console.log("Using Refresh Token");
                    // We're past expiry date, so refresh token
                    let token = await EveAuth.refreshToken(this.tokenData.refresh_token);
                    this.tokenData.token = token;
                    
                    let character = await EveAuth.verifyToken(token);
                    this.tokenData.characterId = character.characterId;
                    this.tokenData.characterName = character.characterName;
                }
                return this.tokenData;
            } catch (error) {
                console.warn("Error retrieving stored token:", error);
                EveAuth.doSSO();
                return (null);
            }
        }
    }

    /* Gets the characterId of the token owner 
    */
    private static async verifyToken(token: string) {
        let url = config.esiLoginHost + '/oauth/verify';
        let response = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });

        let data = await response.json();

        console.log(data)

        if (!data.CharacterID) {
            console.log("Verify Token Failed", data, response);
            return { characterId: null, characterName: null };
        }

        return { characterId: data.CharacterID, characterName: data.CharacterName };

    }


    /* 
       Returns stored token data from chrome storage
    */
    private getStoredToken(): Promise<TokenData> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(["token", "expires", "refresh_token", "characterId", "characterName"], (data) => {
                console.log("Stored Data:", data);
                if (data.token && data.expires && data.refresh_token) {
                    resolve({ token: data.token, expires: data.expires, refresh_token: data.refresh_token, characterId: data.characterId, characterName: data.characterName });
                } else {
                    reject("No Data");
                }
            });
        })
    }

    /*
        Returns true if there is currently a token loaded
        Note: Might return false initially while the token is loaded from storage
    */
    get isLoggedIn(): boolean {
        return !!this.tokenData;
    }

    /*
        Gets a new token from refresh token
    */
    static async refreshToken(refresh_token: string): Promise<string> {
        console.log("Using refresh token");
        let url = config.esiLoginHost + "/v2/oauth/token";
        let data = [
            "grant_type=refresh_token",
            "refresh_token=" + refresh_token,
            "client_id=" + this.clientId
        ];
        
        console.info("Posting to:", url);
        let response = await fetch(url, {
            method: 'POST',
            body: data.join("&"),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Host': 'login.eveonline.com'
            }
        });

        let body = await response.json();
        let token = body.access_token;
        let character = await EveAuth.verifyToken(token);

        chrome.storage.local.set({
            token: body.access_token,
            expires: body.expires_in * 1000 + (new Date().getTime()),
            refresh_token: body.refresh_token,
            characterId: character.characterId,
            characterName: character.characterName
        }, () => {
            console.info("Process complete, token:", body.access_token);
        });
        console.info("Refreshed Token:", body);
        return body.access_token;
    } 

    /*
        Starts the SSO process and stores the resulting token in storage
        Returns stored token
    */
    static async doSSO(): Promise<string> {
        console.info("Starting SSO");
        return new Promise((resolve, reject) => {
            // Some basic settings
            let redirectURL = chrome.identity.getRedirectURL('sso');
            let baseURL = config.esiLoginHost + "/v2/oauth";
            let clientId = this.clientId;
            let scopes = ["esi-location.read_location.v1"];
    
            // Generate challenge
            let challengeBytes = crypto.getRandomValues(new Uint8Array(32));
            let challenge = String.fromCharCode(...challengeBytes);
            challenge = UrlSafeBase64.encode(challenge);
            let challengeHash = SHA256(challenge).toString(Base64).replace(/\//g, '_').replace(/\+/g, '-').replace("=", "");

            console.info("Challenge:", challenge);
            console.info("Challenge Hash:", challengeHash);
            
            // Generate random state
            let stateBytes = crypto.getRandomValues(new Uint8Array(4));
            let state = UrlSafeBase64.encode(String.fromCharCode(...stateBytes));
                
            // Build URL
            let url = baseURL;
            url += '/authorize';
            url += "?response_type=code";
            url += "&scope=" + scopes.join(" ");
            url += "&redirect_uri=" + redirectURL;
            url += "&client_id=" + clientId;
            url += "&code_challenge_method=S256";
            url += "&code_challenge=" + challengeHash;
            url += "&state=" + state;

            console.info("Authorization URL:", url);
    
            // Start auth flow
            chrome.identity.launchWebAuthFlow({ url: url, 'interactive': true }, async (result) => {
                if (result) {
                    console.info("Auth Window returned with", result);
                    let data = result.substr(redirectURL.length + 1)
                                     .split('&');
    
                    // Parse response
                    let parsed: {[key: string]: string} = {};
                    for (let chunk of data) {
                        let split = chunk.split("=");
                        let key = split[0], value = split[1];
    
                        parsed[key] = value;
                    }
    
                    // Get access tokens
                    if (parsed.code) {
                        let url = baseURL;
                        url += '/token';
    
                        let data = [
                            "grant_type=authorization_code",
                            "code=" + parsed.code,
                            "client_id=" + clientId,
                            "code_verifier=" + challenge
                        ];
                        
                        console.info("Posting to:", url);
                        let response = await fetch(url, {
                            method: 'POST',
                            body: data.join("&"),
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        });
    
                        let body = await response.json();
                        let character = await this.verifyToken(body.access_token);
    
                        chrome.storage.local.set({
                            token: body.access_token,
                            expires: body.expires_in * 1000 + (new Date().getTime()),
                            refresh_token: body.refresh_token,
                            characterId: character.characterId,
                            characterName: character.characterName
                        }, () => {
                                console.info("Process complete, token:", body.access_token);
                                resolve(body.access_token);
                        });
    
                    }
                }
            });
        });
    }
    
}