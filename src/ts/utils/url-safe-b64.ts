export class UrlSafeBase64 {
    static encode(str: string) {
        let result = btoa(str).replace(/\//g, '_').replace(/\+/g, '-');
        return result;
    }

    static decode(str: string) {
        return atob(str.replace(/_/g, '/').replace(/-/g, '+'));
    }
}