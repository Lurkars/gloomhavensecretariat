import { ActionHex, ActionHexFromString, ActionHexType } from "../model/ActionHex";
import { Action, ActionType } from "../model/data/Action";
import { ConditionName } from "../model/data/Condition";
import { Element } from "../model/data/Element";
import { Game } from "../model/Game";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class EnhancementsManager {

    game: Game;
    fh: boolean = false;
    temporary: boolean = false;
    enhancerLevel: number = 0;

    squareActions: ActionType[] = [ActionType.move, ActionType.attack, ActionType.range, ActionType.shield, ActionType.push, ActionType.pull, ActionType.pierce, ActionType.retaliate, ActionType.heal, ActionType.target, ActionType.teleport];
    circleActions: ActionType[] = [ActionType.move, ActionType.attack, ActionType.range, ActionType.shield, ActionType.push, ActionType.pull, ActionType.pierce, ActionType.retaliate, ActionType.heal, ActionType.target, ActionType.teleport];
    diamondActions: ActionType[] = [ActionType.attack, ActionType.condition, ActionType.push, ActionType.pull];
    diamondPlusActions: ActionType[] = [ActionType.heal, ActionType.condition, ActionType.shield, ActionType.retaliate];
    hexActions: ActionType[] = [ActionType.area];
    summonActions: ActionType[] = [ActionType.move, ActionType.attack, ActionType.range, ActionType.heal];
    diamondConditions: ConditionName[] = [ConditionName.poison, ConditionName.wound, ConditionName.muddle, ConditionName.immobilize, ConditionName.disarm, ConditionName.curse];
    diamondPlusConditions: ConditionName[] = [ConditionName.strengthen, ConditionName.bless, ConditionName.regenerate];

    constructor(game: Game) {
        this.game = game;
    }

    update() {
        this.fh = gameManager.fhRules(true) || settingsManager.settings.alwaysFhEnhancements;
        this.temporary = settingsManager.settings.temporaryEnhancements;
        this.enhancerLevel = this.fh && this.game.party.buildings.find((buildingModel) => buildingModel.name == "enhancer" && buildingModel.level && buildingModel.state != "wrecked")?.level || 0;
        if (this.fh) {
            this.diamondConditions = [ConditionName.poison, ConditionName.wound, ConditionName.muddle, ConditionName.immobilize, ConditionName.curse];
            this.diamondPlusConditions = [ConditionName.strengthen, ConditionName.bless, ConditionName.regenerate, ConditionName.ward];
        } else {
            this.diamondConditions = [ConditionName.poison, ConditionName.wound, ConditionName.muddle, ConditionName.immobilize, ConditionName.disarm, ConditionName.curse];
            this.diamondPlusConditions = [ConditionName.strengthen, ConditionName.bless, ConditionName.regenerate];
        }
    }

    calculateCosts(action: Action, level: number = 1, special: 'summon' | 'lost' | 'persistent' | undefined, enhancements: number, temporaryOff: boolean = false): number {
        let costs = 0;
        costs += this.calculateBaseCosts(action, special);

        if (costs > 0) {
            // double multi target
            if (gameManager.actionsManager.isMultiTarget(action)) {
                costs *= 2;
            }

            if (this.fh && special == 'lost') {
                costs /= 2;
            }

            if (this.fh && !gameManager.gh2eRules() && special == 'persistent') {
                costs *= 3;
            }

            // level costs
            costs += this.levelCosts(level);
            // enhancements costs 
            costs += this.enhancementCosts(enhancements);

            if (this.fh && this.temporary) {
                if (enhancements) {
                    costs -= 20;
                }
                if (!temporaryOff) {
                    costs = Math.ceil(costs * 0.8);
                }
            }

            if (this.enhancerLevel > 1 && !temporaryOff) {
                costs -= 10;
            }
        }

        return costs;
    }

    calculateBaseCosts(action: Action, special: 'summon' | 'lost' | 'persistent' | undefined = undefined): number {
        let costs = 0;
        if (special == 'summon') {
            switch (action.type) {
                case ActionType.move:
                    costs += this.fh ? 60 : (this.temporary ? 40 : 100);
                    break;
                case ActionType.attack:
                    costs += (!this.fh && this.temporary) ? 60 : 100;
                    break;
                case ActionType.range:
                    costs += (!this.fh && this.temporary) ? 40 : 50;
                    break;
                case ActionType.heal: // as HP
                    costs += this.fh ? 40 : (this.temporary ? 30 : 50);
                    break;
            }
        } else {
            switch (action.type) {
                case ActionType.move:
                    costs += (!this.fh && this.temporary) ? 20 : 30;
                    break;
                case ActionType.attack:
                    costs += (!this.fh && this.temporary) ? 35 : 50;
                    break;
                case ActionType.range:
                    costs += (!this.fh && this.temporary) ? 20 : 30;
                    break;
                case ActionType.target:
                    costs += this.fh ? 75 : (this.temporary ? 40 : 50);
                    break;
                case ActionType.shield:
                    costs += this.fh ? 80 : (this.temporary ? 60 : 100);
                    break;
                case ActionType.retaliate:
                    costs += this.fh ? 60 : (this.temporary ? 40 : 100);
                    break;
                case ActionType.pierce:
                    costs += (!this.fh && this.temporary) ? 15 : 30;
                    break;
                case ActionType.heal:
                    costs += (!this.fh && this.temporary) ? 20 : 30;
                    break;
                case ActionType.push:
                    costs += (!this.fh && this.temporary) ? 20 : 30;
                    break;
                case ActionType.pull:
                    costs += this.fh ? 20 : (this.temporary ? 15 : 30);
                    break;
                case ActionType.teleport:
                    costs += this.fh ? 50 : 40;
                    break;
                case ActionType.jump:
                    costs += this.fh ? 60 : (this.temporary ? 35 : 50);
                    break;
                case ActionType.element:
                    if (action.value as Element != Element.wild) {
                        costs += (!this.fh && this.temporary) ? 60 : 100;
                    } else {
                        costs += (!this.fh && this.temporary) ? 90 : 150;
                    }
                    break;
                case ActionType.condition: {
                    switch (action.value as ConditionName) {
                        case ConditionName.poison:
                            costs += this.fh ? 50 : (this.temporary ? 30 : 75);
                            break;
                        case ConditionName.wound:
                            costs += (!this.fh && this.temporary) ? 45 : 75;
                            break;
                        case ConditionName.muddle:
                            costs += this.fh ? 40 : (this.temporary ? 25 : 50);
                            break;
                        case ConditionName.immobilize:
                            costs += this.fh ? 150 : 100;
                            break;
                        case ConditionName.disarm:
                            costs += this.fh ? 0 : 150;
                            break;
                        case ConditionName.curse:
                            costs += this.fh ? 150 : (this.temporary ? 100 : 75);
                            break;
                        case ConditionName.strengthen:
                            costs += this.fh ? 100 : (this.temporary ? 100 : 50);
                            break;
                        case ConditionName.bless:
                            costs += this.fh ? 75 : 50;
                            break;
                        case ConditionName.regenerate:
                            costs += this.fh ? 40 : 50;
                            break;
                        case ConditionName.ward:
                            costs += this.fh ? 75 : 0;
                            break;
                    }
                    break;
                }
                case ActionType.area: {
                    const hexes: ActionHex[] = ('' + action.value).split('|').map((value) => ActionHexFromString(value)).filter((value) => value).map((value) => value as ActionHex);
                    costs += Math.ceil(200 / (hexes.filter((actionHex) => actionHex.type == ActionHexType.target).length || 1));
                    break;
                }
            }
        }

        return costs;
    }

    levelCosts(level: number): number {
        if (level < 1) {
            level = 1;
        } else if (level > 9) {
            level = 9;
        }
        return (level - 1) * (!this.fh && this.temporary ? 10 : (this.enhancerLevel > 2 ? 15 : 25));
    }

    enhancementCosts(enhancements: number): number {
        if (enhancements < 0) {
            enhancements = 0;
        }
        return enhancements * (!this.fh && this.temporary ? 20 : (this.enhancerLevel > 3 ? 50 : 75));
    }
}