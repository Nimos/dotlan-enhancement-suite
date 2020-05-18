import { EveAuth } from './EveAuth';

export class DotlanEnhancementBackend {
    private static instance: DotlanEnhancementBackend;
    private auth: EveAuth;
    private constructor() { 
        this.auth = EveAuth.getInstance();
    }
    
    static getInstance(): DotlanEnhancementBackend {
        if (!this.instance) {
            this.instance = new DotlanEnhancementBackend();
        }
        return this.instance;
    }
}