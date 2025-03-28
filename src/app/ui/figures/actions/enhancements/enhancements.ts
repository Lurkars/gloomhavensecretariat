import { Dialog } from "@angular/cdk/dialog";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Action } from "src/app/game/model/data/Action";
import { ConditionName } from "src/app/game/model/data/Condition";
import { Element } from "src/app/game/model/data/Element";
import { EnhancementAction, EnhancementType } from "src/app/game/model/data/Enhancement";
import { SummonData } from "src/app/game/model/data/SummonData";
import { EnhancementDialogComponent } from "../../character/sheet/abilities/enhancements/enhancement-dialog";

@Component({
    standalone: false,
    selector: 'ghs-action-enhancements',
    templateUrl: './enhancements.html',
    styleUrls: ['./enhancements.scss']
})
export class ActionEnhancementsComponent implements OnInit, OnDestroy {

    @Input('action') action!: Action;
    @Input('index') actionIndex: string = "";
    @Input('cardId') cardId: number | undefined;
    @Input('character') character: Character | undefined;
    @Input('slot') slotIndex: number | undefined;
    @Input('summon') summon: SummonData | undefined;

    Elements: EnhancementAction[] = Object.values(Element);
    Conditions: EnhancementAction[] = Object.values(ConditionName);

    slots: EnhancementType[] = [];
    enhancements: EnhancementAction[] = [];
    edit: boolean = false;

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;

    constructor(private dialog: Dialog) { }

    ngOnInit() {
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
        if (this.action.enhancementTypes) {
            this.slots = this.slotIndex != undefined ? [this.action.enhancementTypes[this.slotIndex]] : this.action.enhancementTypes;
            if (this.character && this.cardId && this.character.progress && this.character.progress.enhancements) {
                this.enhancements = [];
                this.action.enhancementTypes.forEach((value, index) => {
                    if (this.character && this.character.progress.enhancements) {
                        const enhancement = this.character.progress.enhancements.find((e) => e.cardId == this.cardId && e.actionIndex == this.actionIndex && e.index == index);
                        if (enhancement) {
                            this.enhancements[index] = enhancement.action;
                        }
                    }
                })
            }
        }

        this.edit = this.character && this.character.tags.indexOf('edit-abilities') != -1 || false;
    }

    enhance(index: number, event: any) {
        if (this.edit && !this.enhancements[this.slotIndex != undefined ? this.slotIndex : index]) {
            this.dialog.open(EnhancementDialogComponent, {
                panelClass: ['dialog'],
                data: { action: this.action, actionIndex: this.actionIndex, cardId: this.cardId, enhancementIndex: index, character: this.character, summon: this.summon }
            });
            event.stopPropagation();
            event.preventDefault();
        }
    }

    removeEnhancement(index: number, event: any) {
        if (this.edit && this.character && this.cardId && this.enhancements[this.slotIndex != undefined ? this.slotIndex : index]) {
            const enhancement = this.character.progress.enhancements.find((e) => e.cardId == this.cardId && e.actionIndex == this.actionIndex && e.index == index)
            if (enhancement && !enhancement.inherited) {
                gameManager.stateManager.before('removeEnhancement', gameManager.characterManager.characterName(this.character), this.cardId);
                this.character.progress.enhancements = this.character.progress.enhancements.filter((e) => e != enhancement);
                gameManager.stateManager.after();
            }
            event.stopPropagation();
            event.preventDefault();
        }
    }
}