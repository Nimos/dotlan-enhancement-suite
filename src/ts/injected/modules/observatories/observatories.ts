import { DESModule } from "../DESModule";

import './observatories.scss';

export interface Observatory {
    id: number,
    name: string,
}

export class Observatories extends DESModule {

    private observatories?: Observatory[];

    constructor(elements: { [key: string]: HTMLElement }) {
        super(elements);

        this.loadObservatories();
    }

    private async loadObservatories() {
        let observatoryUrl = chrome.runtime.getURL('observatories.json');

        let response = await fetch(observatoryUrl);
        this.observatories = await response.json();

        if (!this.observatories) {
            console.warn("Failed to load Jove Observatories")
            return false;
        }

        for (let observatory of this.observatories) {
            if (this.mapDocument.querySelector('#sys' + observatory.id)) {
                this.addSystemIcon(observatory.id, "observatory");
            };
        }
    }
}