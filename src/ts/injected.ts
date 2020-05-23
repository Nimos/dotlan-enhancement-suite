import '../css/injected.scss';
import { DotlanEnhancementSuite } from './injected/DotlanEnhancementSuite';
let suite;


console.group('Dotlan Enhancement Suite Starting...')
suite = DotlanEnhancementSuite.getInstance();
console.groupEnd();

window.addEventListener('DOMContentReady', () => {
    console.log("LOADED!");
})


document.addEventListener('click', (event) => {
    if (event.target && (<HTMLElement>event.target).classList.contains('des-esi-login-hint')) {
        
    }
})

