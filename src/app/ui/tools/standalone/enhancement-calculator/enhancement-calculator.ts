import { Component, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { storageManager } from "src/app/game/businesslogic/StorageManager";
import { environment } from "src/environments/environment";

@Component({
    standalone: false,
    selector: 'ghs-enhancement-calculator-standalone',
    templateUrl: './enhancement-calculator.html',
    styleUrls: ['./enhancement-calculator.scss']
})
export class EnhancementCalculatorStandaloneComponent implements OnInit {

    async ngOnInit() {
        try {
            await storageManager.init();
        } catch (e) {
            // continue
        }
        await settingsManager.init(!environment.production);
        await gameManager.stateManager.init(true);
    }
}

