import { Dialog } from "@angular/cdk/dialog";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Ability } from "src/app/game/model/Ability";
import { Action, ActionType, ActionValueType } from "src/app/game/model/Action";
import { Character } from "src/app/game/model/Character";
import { CharacterStat } from "src/app/game/model/CharacterStat";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { DeckData } from "src/app/game/model/data/DeckData";
import { Monster } from "src/app/game/model/Monster";
import { EditorActionDialogComponent } from "../action/action";

@Component({
    selector: 'ghs-deck-editor',
    templateUrl: './deck.html',
    styleUrls: ['../editor.scss', './deck.scss']
})
export class DeckEditorComponent implements OnInit {

    @ViewChild('inputDeckData', { static: true }) inputDeckData!: ElementRef;
    @Input() character: Character | undefined;
    @Input() monster: Monster | undefined;

    gameManager: GameManager = gameManager;
    ActionType = ActionType;
    ActionValueType = ActionValueType;
    encodeURIComponent = encodeURIComponent;
    deckData: DeckData;
    deckError: any;

    constructor(private dialog: Dialog) {
        this.deckData = new DeckData("", [], "");
        this.deckData.abilities.push(new Ability());
    }

    async ngOnInit() {
        if (!this.character && !this.monster) {
            await settingsManager.init();
        } else if (this.character) {
            this.deckData.character = true;
        }
        this.deckDataToJson();
        this.inputDeckData.nativeElement.addEventListener('change', (event: any) => {
            this.deckDataFromJson();
        });
    }

    decksData(): DeckData[] {
        return gameManager.decksData(true).filter((deckData) => {
            if (this.character) {
                return deckData.character;
            } else if (this.monster) {
                return !deckData.character;
            }

            return true;
        });
    }

    deckDataToJson() {
        let compactData: any = JSON.parse(JSON.stringify(this.deckData));

        Object.keys(compactData).forEach((key) => {
            if (!compactData[key] || compactData[key] == false) {
                compactData[key] = undefined;
            }
        })

        compactData.abilities.forEach((ability: any) => {
            Object.keys(ability).forEach((key) => {
                if (!ability[key] && ability[key] != 0 || typeof ability[key] == 'boolean' && ability[key] == false) {
                    ability[key] = undefined;
                }

                if (ability.actions && ability.actions.length == 0) {
                    ability.actions = undefined;
                } else if (ability.actions) {
                    ability.actions.forEach((action: any) => {
                        this.compactAction(action);
                    })
                }

                if (ability.bottomActions && ability.bottomActions.length == 0) {
                    ability.bottomActions = undefined;
                } else if (ability.bottomActions) {
                    ability.bottomActions.forEach((action: any) => {
                        this.compactAction(action);
                    })
                }
            })
        })

        this.inputDeckData.nativeElement.value = JSON.stringify(compactData, null, 2);
    }

    deckDataFromJson() {
        this.deckError = "";
        if (this.inputDeckData.nativeElement.value) {
            try {
                this.deckData = JSON.parse(this.inputDeckData.nativeElement.value);
                return;
            } catch (e) {
                this.deckData = new DeckData("", [], "");
                this.deckData.abilities.push(new Ability());
                this.deckError = e;
            }
        }
    }

    compactAction(action: any) {
        if (action.valueType && action.valueType == ActionValueType.fixed) {
            action.valueType = undefined;
        }

        if (action.subActions && action.subActions.length == 0) {
            action.subActions = undefined;
        } else if (action.subActions) {
            action.subActions.forEach((action: any) => {
                this.compactAction(action);
            })
        }

        if (action.type == ActionType.summon) {
            try {
                let value = JSON.parse(action.value);
                if (typeof value != 'string') {

                    Object.keys(value).forEach((key) => {
                        if (!value[key] || value[key] == false) {
                            value[key] = undefined;
                        }
                    })

                    if (value.action) {
                        this.compactAction(value.action);
                    }
                    if (value.additionalAction) {
                        this.compactAction(value.additionalAction);
                    }
                }
                action.value = JSON.stringify(value);
            } catch (e) {

            }
        }

        if (!action.value && action.value != 0) {
            action.value = undefined;
        }
    }

    valueChange(value: string): number | string {
        if (value && !isNaN(+value)) {
            return +value;
        }
        return value;
    }

    changeInitiative(event: any, ability: Ability) {
        if (event.target.value) {
            ability.initiative = +event.target.value;
        } else {
            ability.initiative = 0;
        }
        event.target.value = (ability.initiative < 10 ? '0' : '') + ability.initiative;
        this.deckDataToJson();
    }

    changeCardId(event: any, ability: Ability) {
        if (event.target.value) {
            ability.cardId = +event.target.value;
            event.target.value = (ability.cardId < 100 ? '0' : '') + (ability.cardId < 10 ? '0' : '') + ability.cardId;
        } else {
            ability.cardId = undefined;
        }
        this.deckDataToJson();
    }

    addAbility() {
        this.deckData.abilities.push(new Ability());
        this.deckDataToJson();
    }

    removeAbility(ability: Ability) {
        this.deckData.abilities.splice(this.deckData.abilities.indexOf(ability), 1);
        this.deckDataToJson();
    }

    addAbilityAction(ability: Ability) {
        let action = new Action(ActionType.attack);
        if (!ability.actions) {
            ability.actions = [];
        }
        ability.actions.push(action);
        const dialog = this.dialog.open(EditorActionDialogComponent, {
            panelClass: 'dialog',
            data: { action: action }
        });

        dialog.closed.subscribe({
            next: (value) => {
                if (value == false) {
                    ability.actions.splice(ability.actions.indexOf(action), 1);
                }
                this.deckDataToJson();
            }
        })
    }

    editAbilityAction(ability: Ability, action: Action) {
        const dialog = this.dialog.open(EditorActionDialogComponent, {
            panelClass: 'dialog',
            data: { action: action }
        });

        dialog.closed.subscribe({
            next: (value) => {
                if (value == false) {
                    ability.actions.splice(ability.actions.indexOf(action), 1);
                }
                this.deckDataToJson();
            }
        })
    }

    dropAction(actions: Action[], event: CdkDragDrop<number>) {
        moveItemInArray(actions, event.previousIndex, event.currentIndex);
        gameManager.uiChange.emit();
    }

    addAbilityActionBottom(ability: Ability) {
        let action = new Action(ActionType.move);
        if (!ability.bottomActions) {
            ability.bottomActions = [];
        }
        ability.bottomActions.push(action);
        const dialog = this.dialog.open(EditorActionDialogComponent, {
            panelClass: 'dialog',
            data: { action: action }
        });

        dialog.closed.subscribe({
            next: (value) => {
                if (value == false) {
                    ability.bottomActions.splice(ability.bottomActions.indexOf(action), 1);
                }
                this.deckDataToJson();
            }
        })
    }

    editAbilityActionBottom(ability: Ability, action: Action) {
        const dialog = this.dialog.open(EditorActionDialogComponent, {
            panelClass: 'dialog',
            data: { action: action }
        });

        dialog.closed.subscribe({
            next: (value) => {
                if (value == false) {
                    ability.bottomActions.splice(ability.actions.indexOf(action), 1);
                }
                this.deckDataToJson();
            }
        })
    }

    divider(actions: Action[], index: number): boolean {
        if (index < 1) {
            return false;
        }

        const action = actions[index];

        if (!action) {
            return false;
        }

        if (((action.type == ActionType.element || action.type == ActionType.elementHalf) && action.valueType != ActionValueType.minus)) {
            return false;
        }

        if (action.type == ActionType.card) {
            return false;
        }

        if (actions[index - 1].type == ActionType.box) {
            return false;
        }

        if (action.type == ActionType.concatenation && action.subActions.every((subAction) => subAction.type == ActionType.card || subAction.type == ActionType.element || subAction.type == ActionType.elementHalf)) {
            return false;
        }

        return true;
    }

    getCharacter(): Character | undefined {
        if (this.character) {
            return this.character;
        }

        if (this.deckData.character) {
            const characterData = new CharacterData();
            characterData.iconUrl = './assets/images/warning.svg';
            for (let i = 0; i < 9; i++) {
              characterData.stats.push(new CharacterStat(i, i));
            }
            return new Character(characterData, 1);
        }

        return undefined;
    }

    loadDeckData(event: any) {
        const index = +event.target.value;
        this.deckData = index != -1 ? this.decksData()[index] : new DeckData("", [], "");
        this.deckDataToJson();
    }
} 