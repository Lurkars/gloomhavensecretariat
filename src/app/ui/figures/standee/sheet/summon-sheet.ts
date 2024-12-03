import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Summon } from "src/app/game/model/Summon";

@Component({
	standalone: false,
    selector: 'ghs-summon-sheet',
    templateUrl: './summon-sheet.html',
    styleUrls: ['./summon-sheet.scss']
})
export class SummonSheetComponent implements OnInit, OnDestroy {

    @Input() summon!: Summon;
    @Input() action: boolean = false;
    @Input() additional: boolean = false;
    @Input() item: boolean = false;
    @Input() right: boolean = false;
    @Input() style: 'gh' | 'fh' | false = false;
    fhStyle: boolean = false;

    settingsManager: SettingsManager = settingsManager;

    ngOnInit(): void {
        this.fhStyle = settingsManager.settings.fhStyle && !this.style || this.style == 'fh';
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.fhStyle = settingsManager.settings.fhStyle && !this.style || this.style == 'fh';
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }
}