import { Component, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { MonsterEntity } from "src/app/game/model/MonsterEntity";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { Condition } from "src/app/game/model/data/Condition";
import { RoomData } from "src/app/game/model/data/RoomData";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { HiddenScenarioFigureRuleTypes, ScenarioFigureRule, ScenarioFigureRuleIdentifier, ScenarioRule, ScenarioRuleIdentifier } from "src/app/game/model/data/ScenarioRule";

@Component({
    standalone: false,
    selector: 'ghs-scenario-rule',
    templateUrl: './scenario-rule.html',
    styleUrls: ['./scenario-rule.scss']
})
export class ScenarioRuleComponent implements OnInit {

    @Input() rule!: ScenarioRule;
    @Input() identifier!: ScenarioRuleIdentifier;

    gameManager: GameManager = gameManager;
    settingsManager: SettingsManager = settingsManager;
    EntityValueFunction = EntityValueFunction;

    ngOnInit(): void {
        if (this.rule.figures) {
            this.rule.figures.forEach((figureRule) => {
                if (figureRule.value) {
                    figureRule.value = '' + figureRule.value;
                }
            })
        }
    }

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

    randomDungeonsDungeonLabel(): string[] {
        if (!this.rule.randomDungeon || !this.rule.randomDungeon.dungeonCards || !this.rule.randomDungeon.dungeonCards.length) {
            return [];
        }

        return this.rule.randomDungeon.dungeonCards.filter((cardId) => !gameManager.game.scenario || !gameManager.game.scenario.additionalSections || gameManager.game.scenario.additionalSections.indexOf(cardId) == -1).map((cardId) => {
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

    sections(): ScenarioData[] {
        const scenario = gameManager.scenarioRulesManager.getScenarioForRule(this.identifier).scenario;
        if (scenario && this.rule.sections) {
            return gameManager.sectionData(scenario.edition).filter((sectionData) => !gameManager.game.sections.find((active) => active.edition == sectionData.edition && active.group == scenario.group && active.index == sectionData.index) && sectionData.group == scenario.group && this.rule.sections.indexOf(sectionData.index) != -1);
        }
        return [];
    }

    rooms(): RoomData[] {
        let rooms: RoomData[] = [];
        if (this.rule.rooms) {
            const scenario = gameManager.scenarioRulesManager.getScenarioForRule(this.identifier).scenario;
            this.rule.rooms.forEach((roomNumber) => {
                if (scenario) {
                    const roomData = scenario.rooms.find((roomData) => roomData.roomNumber == roomNumber);
                    if (roomData && gameManager.game.scenario && gameManager.game.scenario.revealedRooms.indexOf(roomNumber) == -1) {
                        rooms.push(roomData);
                    }
                }
            })
        }
        return rooms;
    }

    figureRules(): ScenarioFigureRule[] {
        return this.rule.figures && this.rule.figures.filter((figureRule) => {
            if (HiddenScenarioFigureRuleTypes.indexOf(figureRule.type) != -1) {
                return false;
            }

            const figures = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, this.rule);
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

    figureNames(figureRule: ScenarioFigureRule): string {
        let names = "";
        if (figureRule.identifier) {
            if (figureRule.identifier.type == "all") {
                names = settingsManager.getLabel('scenario.rules.figures.all');
            } else {
                names = gameManager.scenarioRulesManager.figuresByFigureRule(figureRule, this.rule).filter((figure) => {
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
                    } else if (figureRule.type == "toggleOn" || figureRule.type == "toggleOff") {
                        return figure.off == (figureRule.type == "toggleOn");
                    }

                    return true;
                }).map((figure) => {
                    if (figure instanceof Character) {
                        return settingsManager.getLabel('%game.characterIconColored.' + figure.name + '%') + gameManager.characterManager.characterName(figure);
                    }
                    if (figure instanceof ObjectiveContainer) {
                        return (figure.title || settingsManager.getLabel('data.objective.' + figure.name)) + (figure.marker ? ' %game.mapMarker.' + figure.marker + '%' : '');
                    }
                    if (figure instanceof Monster) {
                        const name = figure.statEffect && figure.statEffect.name ? figure.statEffect.name : figure.name;
                        if (figureRule.type == 'removeEntity') {
                            return settingsManager.getLabel('data.monster.' + name) + ' [' + gameManager.scenarioRulesManager.entitiesByFigureRule(figureRule, this.rule).filter((entity) => entity instanceof MonsterEntity && figure.entities.indexOf(entity) != -1).map((entity) => '' + entity.number).join(', ') + ']';
                        }
                        return settingsManager.getLabel('data.monster.' + name);
                    }

                    return figure.name;
                }).join(', ');
            }
        }

        return names;
    }

    figureNamesByIdenfifier(identifier: ScenarioFigureRuleIdentifier): string {
        return gameManager.figuresByIdentifier(identifier).map((figure) => {
            if (figure instanceof Character) {
                return settingsManager.getLabel('%game.characterIconColored.' + figure.name + '%') + gameManager.characterManager.characterName(figure);
            }
            if (figure instanceof ObjectiveContainer) {
                return (figure.title || settingsManager.getLabel('data.objective.' + figure.name)) + (figure.marker ? ' %game.mapMarker.' + figure.marker + '%' : '');
            }
            if (figure instanceof Monster) {
                const name = figure.statEffect && figure.statEffect.name ? figure.statEffect.name : figure.name;
                return settingsManager.getLabel('data.monster.' + name);
            }

            return figure.name;
        }).join(', ')
    }
}
