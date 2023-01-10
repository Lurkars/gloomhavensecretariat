import { Dialog } from "@angular/cdk/dialog";
import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { MonsterStandeeData, RoomData } from "src/app/game/model/data/RoomData";
import { FigureIdentifier, ScenarioRule, ScenarioRuleFigures, ScenarioRuleSpawnData } from "src/app/game/model/data/ScenarioRule";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";
import { Objective } from "src/app/game/model/Objective";
import { Condition, ConditionName } from "src/app/game/model/Condition";
import { ScenarioSummaryComponent } from "src/app/ui/footer/scenario/scenario";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";

@Component({
    selector: 'ghs-scenario-rules',
    templateUrl: './scenario-rules.html',
    styleUrls: ['./scenario-rules.scss']
})
export class ScenarioRulesComponent {

    gameManager: GameManager = gameManager;

    constructor(private dialog: Dialog) { }

    spawns(rule: ScenarioRule): ScenarioRuleSpawnData[] {
        return rule.spawns && rule.spawns.filter((spawn) => this.spawnType(spawn.monster)) || [];
    }

    spawnType(monsterStandeeData: MonsterStandeeData): MonsterType | undefined {
        let type: MonsterType | undefined = monsterStandeeData.type;

        if (!type) {
            const charCount = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;
            if (charCount < 3) {
                type = monsterStandeeData.player2;
            } else if (charCount == 3) {
                type = monsterStandeeData.player3;
            } else {
                type = monsterStandeeData.player4;
            }
        }

        return type;
    }

    prevent(event: any) {
        event.preventDefault();
        event.stopPropagation();
    }

    sections(index: number): ScenarioData[] {
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier);
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule && rule.sections) {
                    return gameManager.sectionData(scenario.edition).filter((sectionData) => !gameManager.game.sections.find((active) => active.edition == sectionData.edition && active.group == sectionData.group && active.index == sectionData.index) && rule.sections.indexOf(sectionData.index) != -1);
                }
            }
        }
        return [];
    }

    rooms(index: number): RoomData[] {
        let rooms: RoomData[] = [];
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier);
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule && rule.rooms) {
                    rule.rooms.forEach((roomNumber) => {
                        const roomData = scenario.rooms.find((roomData) => roomData.roomNumber == roomNumber);
                        if (roomData) {
                            rooms.push(roomData);
                        }
                    })
                }
            }
        }
        return rooms;
    }

    figureRules(rule: ScenarioRule): ScenarioRuleFigures[] {
        return rule.figures && rule.figures.filter((figureRule) => {
            if (figureRule.type == "present" || figureRule.type == "dead") {
                return false;
            }

            const figures = gameManager.figuresByString(figureRule.identifier);
            if (figures.length == 0) {
                return false;
            }

            if (figureRule.type == "gainCondition" || figureRule.type == "looseCondition") {
                let add: boolean = true;
                figures.forEach((figure) => {
                    if (figureRule.type == "gainCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let gainCondition = new Condition(figureRule.value as ConditionName);
                        if (entities.every((entity) => gameManager.entityManager.hasCondition(entity, gainCondition))) {
                            add = false;
                        }
                    } else if (figureRule.type == "looseCondition") {
                        let entities: Entity[] = gameManager.entityManager.entities(figure);
                        let looseCondition = new Condition(figureRule.value as ConditionName);
                        if (entities.every((entity) => !gameManager.entityManager.hasCondition(entity, looseCondition))) {
                            add = false;
                        }
                    }
                })
                return add;
            } else if (figureRule.type == "toggleOn" || figureRule.type == "toggleOff") {
                return figures.every((figure) => figure.off == (figureRule.type == "toggleOn"));
            }

            return true;
        }) || [];
    }

    figureNames(identifier: FigureIdentifier): string {
        if (identifier) {
            if (identifier.type == "all") {
                return settingsManager.getLabel('scenario.rules.figures.all');
            }
            return gameManager.figuresByString(identifier).map((figure) => {
                if (figure instanceof Character) {
                    return figure.title || settingsManager.getLabel('data.character.' + figure.name);
                }
                if (figure instanceof Objective) {
                    return figure.title || settingsManager.getLabel('data.objective.' + figure.name);
                }
                if (figure instanceof Monster) {
                    return settingsManager.getLabel('data.monster.' + figure.name);
                }

                return figure.name;
            }).join(', ');
        }
        return "";
    }

    apply(rule: ScenarioRule) {
        return rule.spawns && gameManager.game.scenario || rule.elements && rule.elements.length > 0 || rule.finish || settingsManager.settings.scenarioRooms && rule.rooms && rule.rooms.length > 0 || rule.sections && rule.sections.length > 0 || rule.figures && rule.figures.length > 0;
    }

    applyRule(element: HTMLElement, index: number) {
        gameManager.stateManager.before("applyScenarioRule");
        if (gameManager.game.scenarioRules[index]) {
            const scenario = gameManager.scenarioManager.getScenarioForRule(gameManager.game.scenarioRules[index].identifier);
            if (scenario) {
                const rule = gameManager.game.scenarioRules[index].rule;
                if (rule.spawns) {
                    let checkActive: string[] = [];
                    rule.spawns.forEach((spawn) => {
                        const type = this.spawnType(spawn.monster);
                        const count = EntityValueFunction((spawn.count || (spawn.manual ? 0 : 1)));
                        if (type && gameManager.game.scenario) {
                            for (let i = 0; i < count; i++) {
                                gameManager.monsterManager.spawnMonsterEntity(spawn.monster.name, type, scenario);
                                checkActive.push(spawn.monster.name);
                            }
                        }
                    })

                    if (gameManager.game.state == GameState.next) {
                        gameManager.game.figures.forEach((figure) => {
                            if (figure instanceof Monster && checkActive.indexOf(figure.name) && figure.edition == scenario.edition) {
                                figure.active = !gameManager.game.figures.some((figure) => figure.active);
                            }
                        })
                    }
                }

                if (rule.elements) {
                    rule.elements.forEach((ruleElement) => {
                        gameManager.game.elementBoard.forEach((element) => {
                            if (ruleElement && element.type == ruleElement.type) {
                                element.state = ruleElement.state;
                            }
                        })
                    })
                }

                if (rule.rooms) {
                    this.rooms(index).forEach((roomData) => {
                        gameManager.scenarioManager.openRoom(roomData, scenario);
                    })
                }

                if (rule.sections) {
                    this.sections(index).forEach((sectionData) => {
                        gameManager.scenarioManager.addSection(sectionData);
                    })
                }

                if (rule.figures) {
                    rule.figures.filter((figureRule) => figureRule.type == "gainCondition" || figureRule.type == "looseCondition" || figureRule.type == "damage" || figureRule.type == "hp").forEach((figureRule) => {
                        const figures = gameManager.figuresByString(figureRule.identifier);
                        figures.forEach((figure) => {
                            let entities: Entity[] = gameManager.entityManager.entities(figure);
                            entities.forEach((entity) => {
                                switch (figureRule.type) {
                                    case "gainCondition":
                                        let gainCondition = new Condition(figureRule.value as ConditionName);
                                        if (!gameManager.entityManager.hasCondition(entity, gainCondition)) {
                                            gameManager.entityManager.toggleCondition(entity, gainCondition, figure.active, figure.off);
                                        }
                                        break;
                                    case "looseCondition":
                                        let looseCondition = new Condition(figureRule.value as ConditionName);
                                        if (gameManager.entityManager.hasCondition(entity, looseCondition)) {
                                            gameManager.entityManager.toggleCondition(entity, looseCondition, figure.active, figure.off);
                                        }
                                        break;
                                    case "damage":
                                        gameManager.entityManager.changeHealth(entity, -figureRule.value);
                                        break;
                                    case "hp":
                                        let hp = 0;
                                        if (isNaN(+figureRule.value) && figureRule.value.endsWith('%')) {
                                            hp = Math.ceil(EntityValueFunction(entity.maxHealth) * (+figureRule.value.replace('%', '')) / 100);
                                        } else {
                                            hp = +figureRule.value;
                                        }
                                        if (hp < 0) {
                                            hp = 0;
                                        } else if (hp > EntityValueFunction(entity.maxHealth)) {
                                            hp = EntityValueFunction(entity.maxHealth);
                                        }

                                        entity.health = hp;
                                        break;
                                }
                            })
                        })
                    })

                    rule.figures.filter((figureRule) => figureRule.type == "toggleOff" || figureRule.type == "toggleOn").forEach((figureRule) => {
                        const figures = gameManager.figuresByString(figureRule.identifier);
                        figures.forEach((figure) => {
                            figure.off = figureRule.type == "toggleOff";
                        })
                    })

                    rule.figures.filter((figureRule) => figureRule.type == "transfer").forEach((figureRule) => {
                        const figures = gameManager.figuresByString(figureRule.identifier);
                        if (figures.length == 1 && figures[0] instanceof Monster) {
                            const figure = figures[0];
                            const monster = gameManager.monsterManager.addMonsterByName(figureRule.value, scenario.edition);
                            if (monster) {
                                monster.level = figure.level;
                                monster.off = figure.off;
                                monster.active = figure.active;
                                monster.drawExtra = figure.drawExtra;
                                monster.lastDraw = figure.lastDraw;

                                monster.ability = figure.ability;
                                monster.isAlly = figure.isAlly;
                                monster.entities = figure.entities;
                                monster.entities.forEach((entity) => {
                                    if (entity.health > EntityValueFunction(entity.maxHealth)) {
                                        entity.health = EntityValueFunction(entity.maxHealth);
                                    }
                                })

                                gameManager.monsterManager.removeMonster(figure);
                                gameManager.sortFigures();
                            }
                        }
                    })
                }

                if (rule.finish) {
                    this.dialog.open(ScenarioSummaryComponent, {
                        panelClass: 'dialog',
                        data: rule.finish == "won"
                    })
                }
            }
        }

        element.classList.add('closed');
        setTimeout(() => {
            const ruleModel = gameManager.game.scenarioRules.splice(index, 1)[0];
            if (ruleModel.rule.round == "once") {
                gameManager.game.disgardedScenarioRules.push(ruleModel.identifier);
            }
            gameManager.stateManager.after();
        }, settingsManager.settings.disableAnimations ? 0 : 100)
    }

    close(element: HTMLElement, index: number) {
        element.classList.add('closed');
        setTimeout(() => {
            gameManager.stateManager.before("removeScenarioRule");
            const ruleModel = gameManager.game.scenarioRules.splice(index, 1)[0];
            if (ruleModel.rule.round == "once") {
                gameManager.game.disgardedScenarioRules.push(ruleModel.identifier);
            }
            gameManager.stateManager.after();
        }, settingsManager.settings.disableAnimations ? 0 : 100)
    }
}
