const dotlanMain = document.getElementById('main');
import '../css/injected.scss';

const dotlanSubMenu = document.getElementById('submenu');

let extensionMenu = document.createElement('div');
extensionMenu.id = "des-main";

extensionMenu.innerHTML = `
    TEST TEST TEST
`
if (dotlanMain) {

    dotlanMain.insertBefore(extensionMenu, dotlanSubMenu);

    chrome.storage.local.get('token', (token) => {
        extensionMenu.innerHTML = token.token;
    })

}