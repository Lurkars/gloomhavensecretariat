import { Dialog } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Condition } from "src/app/game/model/data/Condition";
import { RoomData } from "src/app/game/model/data/RoomData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { HiddenScenarioFigureRuleTypes, ScenarioFigureRule, ScenarioRule } from "src/app/game/model/data/ScenarioRule";
import { ScenarioSummaryComponent } from "../scenario/summary/scenario-summary";

@Component({
    standalone: false,
    selector: 'ghs-scenario-rules',
    templateUrl: './scenario-rules.html',
    styleUrls: ['./scenario-rules.scss']
})
export class ScenarioRulesComponent {

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    EntityValueFunction = EntityValueFunction;

    constructor(private dialog: Dialog) { }

    randomDungeonsMonsterLabel(rule: ScenarioRule): string[] {
        if (!rule.randomDungeon || !rule.randomDungeon.monsterCards || !rule.randomDungeon.monsterCards.length) {
            return [];
        }

        return rule.randomDungeon.monsterCards.filter((cardId) => !gameManager.game.scenario || !gameManager.game.scenario.additionalSections || gameManager.game.scenario.additionalSections.indexOf(cardId) == -1).map((cardId) => {
            if (gameManager.game.scenario) {
                const section = gameManager.sectionData(gameManager.game.scenario.edition, true).find((sectionData) => sectionData.index == cardId && sectionData.group == 'randomMonsterCard');
                if (section) {
                    return "&nbsp%" + gameManager.scenarioManager.scenarioTitle(section, true) + '% (#' + section.index + ")";
                }
            }

            return '&nbsp' + cardId;
        })
    }

    randomDungeonsDungeonLabel(rule: ScenarioRule): string[] {
        if (!rule.randomDungeon || !rule.randomDungeon.dungeonCards || !rule.randomDungeon.dungeonCards.length) {
            return [];
        }

        return rule.randomDungeon.dungeonCards.filter((cardId) => !gameManager.game.scenario || !gameManager.game.scenario.additionalSections || gameManager.game.scenario.additionalSections.indexOf(cardId) == -1).map((cardId) => {
            if (gameManager.game.scenario) {
                const section = gameManager.sectionData(gameManager.game.scenario.edition, true).find((sectionData) => sectionData.index == cardId && sectionData.group == 'randomDungeonCard');
                if (section) {
                    return "&nbsp%" + gameManager.scenarioManager.scenarioTitle(section, true) + '% (#' + section.index + ")";
                }
            }

            return '&nbsp' + cardId;
        })
    }

    prevent(event: any) {
        event.preventDefault();
        event.stopPropagation();
    }

    sections(index: number): ScenarioData[] {
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule && rule.sections) {
                    return gameManager.sectionData(scenario.edition).filter((sectionData) => !gameManager.game.sections.find((active) => active.edition == sectionData.edition && active.group == scenario.group && active.index == sectionData.index) && sectionData.group == scenario.group && rule.sections.indexOf(sectionData.index) != -1);
                }
            }
        }
        return [];
    }

    rooms(index: number): RoomData[] {
        let rooms: RoomData[] = [];
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier).scenario;
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule && rule.rooms) {
                    rule.rooms.forEach((roomNumber) => {
                        const roomData = scenario.rooms.find((roomData) => roomData.roomNumber == roomNumber);
                        if (roomData && gameManager.game.scenario && gameManager.game.scenario.revealedRooms.indexOf(roomNumber) == -1) {
                            rooms.push(roomData);
                        }
                    })
                }
            }
        }
        return rooms;
    }

    figureRules(rule: ScenarioRule): ScenarioFigureRule[] {
        return rule.figures && rule.figures.filter((figureRule) => {
            if (HiddenScenarioFigureRuleTypes.indexOf(figureRule.type) != -1) {
                return false;
            }

            const figures = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, rule);
            if (figures.length == 0) {
                return false;
            }

            if (figureRule.type == "gainCondition" || figureRule.type == "permanentCondition" || figureRule.type == "loseCondition") {
                return figures.some((figure) => {
                    if (figureRule.type == "gainCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let gainCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition))) {
                            return false
                        }
                    } else if (figureRule.type == "permanentCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let gainCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition, true))) {
                            return false
                        }
                    } else if (figureRule.type == "loseCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let loseCondition = new Condition(figureRule.value);
                        if (entities.every((entity) => !gameManager.entityManager.hasCondition(entity, loseCondition))) {
                            return false
                        }
                    }
                    return true;
                });
            } else if (figureRule.type == "toggleOn" || figureRule.type == "toggleOff") {
                return figures.some((figure) => figure.off == (figureRule.type == "toggleOn"));
            }

            return true;
        }) || [];
    }

    visible(index: number): boolean {
        if (gameManager.game.scenarioRules[index]) {
            const rule = gameManager.game.scenarioRules[index].rule;

            if (rule.disablingRules && rule.disablingRules.length > 0 && rule.disablingRules.some((value) => gameManager.game.scenarioRules.find((ruleModel, otherRuleIndex) => index != otherRuleIndex && value.edition == ruleModel.identifier.edition && value.group == ruleModel.identifier.group && (value.index == ruleModel.identifier.index || value.index == -1) && value.scenario == ruleModel.identifier.scenario && value.section == ruleModel.identifier.section && this.visible(otherRuleIndex)))) {
                return false;
            }

            if (gameManager.scenarioRulesManager.spawns(rule).length > 0 || rule.objectiveSpawns && rule.objectiveSpawns.length > 0 || rule.elements && rule.elements.length > 0 && rule.elements.some((elementModel) => gameManager.game.elementBoard.find((element) => element.type == elementModel.type)?.state != elementModel.state) || this.sections(index).length > 0 || this.rooms(index).length > 0 || this.figureRules(rule).length > 0 || rule.note || rule.finish || rule.randomDungeon || rule.statEffects && rule.statEffects.length) {
                return true;
            }
        }
        return false;
    }

    apply(rule: ScenarioRule) {
        return gameManager.scenarioRulesManager.spawns(rule).length > 0 || rule.objectiveSpawns && rule.objectiveSpawns.length > 0 || rule.elements && rule.elements.length > 0 || rule.finish || settingsManager.settings.scenarioRooms && rule.rooms && rule.rooms.length > 0 || rule.sections && rule.sections.length > 0 || rule.randomDungeon || rule.figures && rule.figures.length > 0 && rule.figures.some((figureRule) => HiddenScenarioFigureRuleTypes.indexOf(figureRule.type) == -1) || rule.statEffects && rule.statEffects.length;
    }

    applyRule(element: HTMLElement, index: number) {
        if (gameManager.game.scenarioRules[index]) {
            const rule = gameManager.game.scenarioRules[index].rule;
            const identifier = gameManager.game.scenarioRules[index].identifier;
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule(identifier).scenario;
            if (scenario) {
                gameManager.stateManager.before("applyScenarioRule");
                if (!rule.alwaysApplyTurn) {
                    gameManager.scenarioRulesManager.applyRule(rule, identifier);

                    if (rule.rooms) {
                        this.rooms(index).forEach((roomData) => {
                            gameManager.scenarioManager.openRoom(roomData, scenario, gameManager.game.scenarioRules[index].identifier.section);
                        })
                    }

                    if (rule.sections) {
                        this.sections(index).forEach((sectionData) => {
                            if (sectionData.conclusion) {
                                this.dialog.open(ScenarioSummaryComponent, {
                                    panelClass: ['dialog'],
                                    data: {
                                        scenario: gameManager.game.scenario,
                                        success: true,
                                        conclusion: sectionData
                                    }
                                })
                            } else {
                                gameManager.scenarioManager.addSection(sectionData);
                            }
                        })
                    }

                    if (rule.finish && ["won", "lost"].indexOf(rule.finish) != -1) {
                        this.dialog.open(ScenarioSummaryComponent, {
                            panelClass: ['dialog'],
                            data: { scenario: scenario, success: rule.finish == "won" }
                        })
                    }
                }

                element.classList.add('closed');
                setTimeout(() => {
                    if (rule.once || rule.alwaysApply || rule.alwaysApplyTurn) {
                        gameManager.game.appliedScenarioRules.push(identifier);
                    }
                    gameManager.game.scenarioRules.splice(index, 1);

                    if (rule.finish == "round") {
                        gameManager.roundManager.nextGameState();
                    }

                    gameManager.stateManager.after();
                }, !settingsManager.settings.animations ? 0 : 100)
            }
        }
    }


    hideRule(element: HTMLElement, index: number) {
        element.classList.add('closed');
        setTimeout(() => {
            gameManager.stateManager.before("hideScenarioRule");
            const ruleModel = gameManager.game.scenarioRules.splice(index, 1)[0];
            gameManager.game.discardedScenarioRules.push(ruleModel.identifier);
            gameManager.stateManager.after();
        }, !settingsManager.settings.animations ? 0 : 100)
    }

    close(element: HTMLElement, index: number) {
        element.classList.add('closed');
        setTimeout(() => {
            gameManager.stateManager.before("removeScenarioRule");
            const ruleModel = gameManager.game.scenarioRules.splice(index, 1)[0];
            if (ruleModel.rule.once || ruleModel.rule.alwaysApplyTurn || ruleModel.rule.alwaysApply) {
                gameManager.game.discardedScenarioRules.push(ruleModel.identifier);
            }
            gameManager.stateManager.after();
        }, !settingsManager.settings.animations ? 0 : 100)
    }
}
