import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Action, ActionType } from "src/app/game/model/data/Action";
import { EnhancementType } from "src/app/game/model/data/Enhancement";
import { SummonData } from "src/app/game/model/data/SummonData";
import { Summon } from "src/app/game/model/Summon";

@Component({
    standalone: false,
    selector: 'ghs-summon-sheet',
    templateUrl: './summon-sheet.html',
    styleUrls: ['./summon-sheet.scss']
})
export class SummonSheetComponent implements OnInit, OnDestroy {

    @Input() summon!: Summon;
    @Input() summonData: SummonData | undefined;
    @Input() action: boolean = false;
    @Input() additional: boolean = false;
    @Input() item: boolean = false;
    @Input() right: boolean = false;
    @Input() style: 'gh' | 'fh' | false = false;
    @Input('index') actionIndex: string = "";
    @Input('cardId') cardId: number | undefined;
    @Input('character') character: Character | undefined;
    fhStyle: boolean = false;

    settingsManager: SettingsManager = settingsManager;
    enhancementActions: Action[] = [];
    hasSummon: boolean = false;

    ngOnInit(): void {
        this.update();
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.hasSummon = this.summon != undefined;
        this.fhStyle = settingsManager.settings.fhStyle && !this.style || this.style == 'fh';
        this.enhancementActions = [];
        if (this.summonData) {
            this.enhancementActions.push(new Action(ActionType.heal, this.summonData.health));
            this.enhancementActions.push(new Action(ActionType.attack, this.summonData.attack));
            this.enhancementActions.push(new Action(ActionType.move, this.summonData.movement));
            this.enhancementActions.push(new Action(ActionType.range, this.summonData.range));

            this.enhancementActions.forEach((action) => {
                action.enhancementTypes = [EnhancementType.square, EnhancementType.square, EnhancementType.square, EnhancementType.square];
            })
        }
    }
}