import '../css/injected.scss';
import { DotlanEnhancementSuite } from './injected/DotlanEnhancementSuite';
let suite;


suite = DotlanEnhancementSuite.getInstance();

window.addEventListener('DOMContentReady', () => {
    console.log("LOADED!");
})


document.addEventListener('click', (event) => {
    if (event.target && (<HTMLElement>event.target).classList.contains('des-esi-login-hint')) {
        
    }
})

