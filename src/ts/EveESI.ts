import { UrlSafeBase64 } from './utils/url-safe-b64';
import Base64 from 'crypto-js/enc-base64';
import SHA256 from 'crypto-js/sha256';


export class EveESI {
    static async doSSO(): Promise<string> {
        console.group("EVE SSO process");
        console.info("Starting SSO");
        return new Promise((resolve, reject) => {
            // Some basic settings
            let redirectURL = chrome.identity.getRedirectURL('sso');
            let baseURL = "https://login.eveonline.com/v2/oauth";
            let clientId = "573ad16b087e4b0eb20658274c099d2c";
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
    
                        chrome.storage.local.set({
                            token: body.access_token,
                            expires: body.expires_in * 1000 + (new Date().getTime()),
                            refresh_token: body.refresh_token
                        }, () => {
                                console.info("Process complete, token:", body.access_token);
                                console.groupEnd();
                                resolve(body.access_token);
                        });
    
                    }
                }
            });
        });
    }
    
}