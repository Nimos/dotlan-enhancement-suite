import '../css/injected.scss';
import { DotlanEnhancementSuite } from './injected/DotlanEnhancementSuite';

let suite = DotlanEnhancementSuite.getInstance();


document.addEventListener('click', (event) => {
    if (event.target && (<HTMLElement>event.target).classList.contains('des-esi-login-hint')) {
        
    }
})

