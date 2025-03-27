import { DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, Inject } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Character } from "src/app/game/model/Character";
import { Action, ActionType } from "src/app/game/model/data/Action";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";
import { Element } from "src/app/game/model/data/Element";
import { EnhancementAction, EnhancementType } from "src/app/game/model/data/Enhancement";

@Component({
    standalone: false,
    selector: 'ghs-enhancement-dialog',
    templateUrl: 'enhancement-dialog.html',
    styleUrls: ['./enhancement-dialog.scss']
})
export class EnhancementDialogComponent {

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

    actionTypes: ActionType[] = [];
    enhancementAction: EnhancementAction = "plus1";
    enhancementType: EnhancementType | undefined;

    constructor(@Inject(DIALOG_DATA) private data: { action: Action | undefined, actionIndex: string | undefined, enhancementIndex: number | undefined, cardId: number | undefined, character: Character | undefined }) {
        this.data = data || {};
        this.action = this.data.action || new Action(ActionType.attack, 1);
        this.character = this.data.character;
        this.customAction = !this.data.action || !this.data.actionIndex || !this.data.cardId || this.data.enhancementIndex == undefined || !this.character;
        this.enhanceAction = new Action(this.action.type, this.action.value, this.action.valueType, this.action.subActions);

        if (this.data.cardId && this.character) {
            const ability = gameManager.deckData(this.character).abilities.find((ability) => ability.cardId == this.data.cardId);
            if (ability) {
                this.level = typeof ability.level === 'number' ? ability.level : 1;
                this.enhancements = this.character.progress.enhancements && this.character.progress.enhancements[this.data.cardId] ? Object.keys(this.character.progress.enhancements[this.data.cardId]).map((key) => this.character && this.data.cardId && this.character.progress.enhancements[this.data.cardId] && this.character.progress.enhancements[this.data.cardId][key].length || 0).reduce((a, b) => a + b) : 0;
            }
        }

        this.update();
    }

    update() {
        this.actionTypes = [...gameManager.enhancementsManager.squareActions, ...gameManager.enhancementsManager.circleActions, ...gameManager.enhancementsManager.diamondActions, ...gameManager.enhancementsManager.diamonPlusActions, ...gameManager.enhancementsManager.hexActions].filter((type, index, self) => index === self.indexOf(type));

        if (this.special === 'summon') {
            this.actionTypes = [...gameManager.enhancementsManager.summonActions];
        }

        if (this.actionTypes.indexOf(this.action.type) == -1) {
            this.action = new Action(ActionType.attack, 1);
        }

        if (!this.action.enhancementTypes || !this.action.enhancementTypes.length) {
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

        if (this.enhancementAction == "plus1") {
            this.enhanceAction = new Action(this.action.type, this.action.value, this.action.valueType);
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
}