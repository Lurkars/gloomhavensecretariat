import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Action, ActionType } from "src/app/game/model/data/Action";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";
import { Element } from "src/app/game/model/data/Element";
import { Enhancement, EnhancementAction, EnhancementType } from "src/app/game/model/data/Enhancement";
import { SummonData } from "src/app/game/model/data/SummonData";
import { ghsDialogClosingHelper } from "src/app/ui/helper/Static";

@Component({
    standalone: false,
    selector: 'ghs-enhancement-dialog',
    templateUrl: 'enhancement-dialog.html',
    styleUrls: ['./enhancement-dialog.scss']
})
export class EnhancementDialogComponent implements OnInit, OnDestroy {

    gameManager: GameManager = gameManager;
    ActionType = ActionType;
    EnhancementType = EnhancementType;
    Elements: Element[] = Object.values(Element);

    action: Action;
    enhanceAction: Action;
    level: number = 1;
    enhancements: number = 0;
    special: 'summon' | 'lost' | 'persistent' | undefined;
    character: Character | undefined;
    customAction: boolean;
    wipSpecial: boolean = false;

    actionTypes: ActionType[] = [];
    enhancementAction: EnhancementAction = "plus1";
    enhancementType: EnhancementType | undefined;

    enhancedCards: number = 0;

    constructor(@Inject(DIALOG_DATA) public data: { action: Action | undefined, actionIndex: string | undefined, enhancementIndex: number | undefined, cardId: number | undefined, character: Character | undefined, summon: SummonData | undefined }, private dialogRef: DialogRef) {
        this.data = data || {};
        this.action = this.data.action ? JSON.parse(JSON.stringify(this.data.action)) : new Action(ActionType.attack, 1);
        this.action.small = false;
        this.character = this.data.character ? JSON.parse(JSON.stringify(this.data.character)) : undefined;
        this.customAction = false;
        this.enhanceAction = new Action(this.action.type, this.action.value, this.action.valueType, this.action.subActions);
        if (this.data.summon) {
            this.action = new Action(ActionType.summon, "summonData");
            this.action.valueObject = this.data.summon;
            this.action.enhancementTypes = [EnhancementType.square, EnhancementType.square, EnhancementType.square, EnhancementType.square];
        }
        this.wipSpecial = this.action != undefined && this.action.type == ActionType.custom && this.action.value == "%character.abilities.wip%";
    }

    ngOnInit(): void {
        if (this.data.action && this.data.actionIndex && this.data.cardId && this.data.enhancementIndex != undefined && this.data.character) {
            const ability = gameManager.deckData(this.data.character).abilities.find((ability) => ability.cardId == this.data.cardId);

            if (ability) {
                this.level = typeof ability.level === 'number' ? ability.level : 1;
                if (this.data.actionIndex.indexOf('bottom') != -1) {
                    if (ability.bottomLost || ability.bottomActions.find((action) => action.type == ActionType.card && action.value.toString().indexOf('lost') != -1)) {
                        this.special = 'lost';
                    }
                    if (ability.bottomPersistent || ability.bottomActions.find((action) => action.type == ActionType.card && action.value.toString().indexOf('persistent') != -1)) {
                        this.special = 'persistent';
                    }
                } else {
                    if (ability.lost || ability.actions.find((action) => action.type == ActionType.card && action.value.toString().indexOf('lost') != -1)) {
                        this.special = 'lost';
                    }
                    if (ability.persistent || ability.actions.find((action) => action.type == ActionType.card && action.value.toString().indexOf('persistent') != -1)) {
                        this.special = 'persistent';
                    }
                }

                if (this.data.summon) {
                    this.special = 'summon';
                }
            }

            this.enhancements = this.data.character.progress.enhancements && this.data.character.progress.enhancements.filter((enhancement) => enhancement.cardId == this.data.cardId && (!gameManager.enhancementsManager.fh || this.data.actionIndex && enhancement.actionIndex.indexOf('bottom') == this.data.actionIndex.indexOf('bottom'))).length || 0;

            this.enhancedCards = this.data.character.progress.enhancements && this.data.character.progress.enhancements.filter((e) => !e.inherited).map((e) => e.cardId).filter((cardId, index, self) => index == self.indexOf(cardId)).length;
        } else {
            this.customAction = true;
        }

        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                if (this.data.character && this.data.cardId) {
                    this.enhancements = this.data.character.progress.enhancements && this.data.character.progress.enhancements.filter((enhancement) => enhancement.cardId == this.data.cardId && (!gameManager.enhancementsManager.fh || this.data.actionIndex && enhancement.actionIndex.indexOf('bottom') == this.data.actionIndex.indexOf('bottom'))).length || 0;

                    this.enhancedCards = this.data.character.progress.enhancements && this.data.character.progress.enhancements.filter((e) => !e.inherited).map((enhancement) => enhancement.cardId).filter((cardId, index, self) => index == self.indexOf(cardId)).length;
                }
            }
        })
        this.update();
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    update() {
        this.actionTypes = [...gameManager.enhancementsManager.squareActions, ...gameManager.enhancementsManager.circleActions, ...gameManager.enhancementsManager.diamondActions, ...gameManager.enhancementsManager.diamonPlusActions, ...gameManager.enhancementsManager.hexActions].filter((type, index, self) => index === self.indexOf(type));

        if (this.special === 'summon') {
            this.actionTypes = [...gameManager.enhancementsManager.summonActions];
        } else if (this.actionTypes.indexOf(this.action.type) == -1) {
            this.action = new Action(ActionType.attack, 1);
        }

        if (!this.action.enhancementTypes || !this.action.enhancementTypes.length || this.wipSpecial) {
            if (gameManager.enhancementsManager.squareActions.indexOf(this.action.type) != -1) {
                this.enhancementType = EnhancementType.square;
            }
            if (gameManager.enhancementsManager.circleActions.indexOf(this.action.type) != -1) {
                this.enhancementType = EnhancementType.circle;
            }
            if (gameManager.enhancementsManager.diamondActions.indexOf(this.action.type) != -1 && (this.action.type != ActionType.condition || new Condition('' +
                this.action.value).types.indexOf(ConditionType.negative) != -1)) {
                this.enhancementType = EnhancementType.diamond;
            }
            if (gameManager.enhancementsManager.diamonPlusActions.indexOf(this.action.type) != -1 && (this.action.type != ActionType.condition || new Condition('' +
                this.action.value).types.indexOf(ConditionType.positive) != -1)) {
                this.enhancementType = EnhancementType.diamond_plus;
            }
            if (gameManager.enhancementsManager.hexActions.indexOf(this.action.type) != -1) {
                this.enhancementType = EnhancementType.hex;
            }
        } else if (this.data.enhancementIndex != undefined) {
            this.enhancementType = this.action.enhancementTypes[this.data.enhancementIndex];
        }

        if (this.special === 'summon') {
            this.enhancementType = EnhancementType.square;
            this.enhancementAction = "plus1";
        }

        if (this.data.action && (this.enhancementAction == "plus1" || this.enhancementAction == "hex")) {
            if (this.wipSpecial) {
                this.enhanceAction = this.action;
            } else {
                this.enhanceAction = new Action(this.data.action.type, this.data.action.value, this.data.action.valueType);
            }
        } else if (Object.values(ConditionName).includes(this.enhancementAction as ConditionName)) {
            this.enhanceAction = new Action(ActionType.condition, this.enhancementAction);
        } else if (Object.values(Element).includes(this.enhancementAction as Element)) {
            this.enhanceAction = new Action(ActionType.element, this.enhancementAction);
        } else if (this.enhancementAction == ActionType.jump) {
            this.enhanceAction = new Action(ActionType.jump);
        }
        if (this.action.subActions) {
            this.enhanceAction.subActions = JSON.parse(JSON.stringify(this.action.subActions));
        }

        if (this.enhancementType == "hex") {
            this.enhancementAction = "hex";
        }

        if (this.data.actionIndex && this.data.cardId && this.data.enhancementIndex != undefined && this.character) {
            this.character.tags = [];
            this.character.progress.enhancements = this.data.character && this.data.character.progress.enhancements && JSON.parse(JSON.stringify(this.data.character.progress.enhancements)) || [];

            this.character.progress.enhancements.push(new Enhancement(this.data.cardId, this.data.actionIndex, this.data.enhancementIndex, this.enhancementAction));
        }

        gameManager.uiChange.emit();
    }

    setEnhancementAction(enhancementAction: EnhancementAction) {
        this.enhancementAction = enhancementAction;
        this.update();
    }

    toggleSpecial(special: 'summon' | 'lost' | 'persistent' | undefined) {
        if (this.special == special) {
            this.special = undefined;
        } else {
            this.special = special;
        }
        this.update();
    }

    close() {
        ghsDialogClosingHelper(this.dialogRef);
    }

    apply(force: boolean = false) {
        const costs = gameManager.enhancementsManager.calculateCosts(this.enhanceAction, this.level, this.special, this.enhancements);
        if (this.data.actionIndex && this.data.cardId && this.data.enhancementIndex != undefined && this.data.character && (this.data.character.progress.gold >= costs && (gameManager.enhancementsManager.fh || this.enhancedCards < gameManager.prosperityLevel()) || force)) {
            gameManager.stateManager.before('enhanceCard', gameManager.characterManager.characterName(this.data.character), this.data.cardId);

            if (!this.data.character.progress.enhancements) {
                this.data.character.progress.enhancements = [];
            }

            this.data.character.progress.enhancements.push(new Enhancement(this.data.cardId, this.data.actionIndex, this.data.enhancementIndex, this.enhancementAction));

            if (!force) {
                this.data.character.progress.gold -= costs;
            }

            gameManager.stateManager.after();
            ghsDialogClosingHelper(this.dialogRef);
        }
    }
}