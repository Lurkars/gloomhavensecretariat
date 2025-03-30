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
    wipSpecialIndex: string = "";
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
        this.slots = [];
        if (this.action.enhancementTypes) {
            this.slots = this.slotIndex != undefined ? [this.action.enhancementTypes[this.slotIndex]] : [...this.action.enhancementTypes];
            this.wipSpecialIndex = this.slots[0] == EnhancementType.any ? (this.actionIndex.indexOf('bottom') == -1 ? 'custom' : 'custom-bottom') : '';
            this.enhancements = [];
            if (this.character && this.cardId && this.character.progress && this.character.progress.enhancements) {
                this.character.progress.enhancements.filter((e) => e.cardId == this.cardId && (!this.wipSpecialIndex && e.actionIndex == this.actionIndex || this.wipSpecialIndex && e.actionIndex == this.wipSpecialIndex)).forEach((e) => {
                    this.enhancements[e.index] = e.action;
                    if (this.wipSpecialIndex) {
                        this.slots[e.index] = EnhancementType.any;
                    }
                });
            }

            if (this.wipSpecialIndex && this.enhancements.length > 0) {
                this.slots[this.enhancements.length] = EnhancementType.any;
            }
        }
        this.edit = this.character && this.character.tags.indexOf('edit-abilities') != -1 || false;
    }

    enhance(index: number, event: any) {
        if (this.edit) {
            if (!this.enhancements[this.slotIndex != undefined ? this.slotIndex : index]) {
                this.dialog.open(EnhancementDialogComponent, {
                    panelClass: ['dialog'],
                    data: { action: this.action, actionIndex: this.wipSpecialIndex || this.actionIndex, cardId: this.cardId, enhancementIndex: index, character: this.character, summon: this.summon }
                });
            }
            event.stopPropagation();
            event.preventDefault();
        }
    }

    removeEnhancement(index: number, event: any) {
        if (this.edit) {
            if (this.character && this.cardId && this.enhancements[this.slotIndex != undefined ? this.slotIndex : index]) {
                const enhancement = this.character.progress.enhancements.find((e) => e.cardId == this.cardId && (!this.wipSpecialIndex && e.actionIndex == this.actionIndex || this.wipSpecialIndex && e.actionIndex == this.wipSpecialIndex) && e.index == index)
                if (enhancement && !enhancement.inherited) {
                    gameManager.stateManager.before('removeEnhancement', gameManager.characterManager.characterName(this.character), this.cardId);
                    this.character.progress.enhancements = this.character.progress.enhancements.filter((e) => e != enhancement);
                    gameManager.stateManager.after();
                }
            } else if (this.wipSpecialIndex) {
                this.slots.push(EnhancementType.any);
            }
            event.stopPropagation();
            event.preventDefault();
        }
    }
}