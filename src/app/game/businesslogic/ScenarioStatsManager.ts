import { Character } from "../model/Character";
import { LootType } from "../model/data/Loot";
import { MonsterType } from "../model/data/MonsterType";
import { Entity } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game } from "../model/Game";
import { Monster } from "../model/Monster";
import { MonsterEntity } from "../model/MonsterEntity";
import { GameScenarioModel, Scenario } from "../model/Scenario";
import { Summon } from "../model/Summon";
import { gameManager } from "./GameManager";

export class ScenarioStatsManager {

    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    applyDamage(entity: Entity, figure: Figure, value: number) {
        const activeFigure: Figure | undefined = this.game.figures.find((figure) => figure.active);

        if (figure instanceof Character) {
            if (entity instanceof Character) {
                if (activeFigure && activeFigure instanceof Monster) {
                    entity.scenarioStats.monsterDamage += value;
                } else {
                    entity.scenarioStats.otherDamage += value;
                }
                if (entity.exhausted) {
                    entity.scenarioStats.exhausts += 1;
                }
                entity.scenarioStats.maxDamage = Math.max(entity.scenarioStats.maxDamage, value);
            } else if (entity instanceof Summon) {
                if (activeFigure && activeFigure instanceof Monster) {
                    figure.scenarioStats.summons.monsterDamage += value;
                } else {
                    figure.scenarioStats.summons.otherDamage += value;
                }
                if (entity.dead) {
                    figure.scenarioStats.summons.exhausts += 1;
                }
                figure.scenarioStats.summons.maxDamage = Math.max(figure.scenarioStats.summons.maxDamage, value);
            }
        } else if (activeFigure instanceof Character) {
            if (activeFigure.summons.find((summon) => summon.active)) {
                activeFigure.scenarioStats.summons.dealtDamage += value;
                activeFigure.scenarioStats.summons.maxDealtDamage = Math.max(activeFigure.scenarioStats.summons.maxDealtDamage, value);
                if (entity instanceof MonsterEntity && entity.dead) {
                    switch (entity.type) {
                        case MonsterType.normal:
                            activeFigure.scenarioStats.summons.normalKills += 1;
                            break;
                        case MonsterType.elite:
                            activeFigure.scenarioStats.summons.eliteKills += 1;
                            break;
                        case MonsterType.boss:
                            activeFigure.scenarioStats.summons.bossKills += 1;
                            break;
                    }
                }
            } else {
                activeFigure.scenarioStats.dealtDamage += value;
                activeFigure.scenarioStats.maxDealtDamage = Math.max(activeFigure.scenarioStats.maxDealtDamage, value);
                if (entity instanceof MonsterEntity && entity.dead) {
                    switch (entity.type) {
                        case MonsterType.normal:
                            activeFigure.scenarioStats.normalKills += 1;
                            break;
                        case MonsterType.elite:
                            activeFigure.scenarioStats.eliteKills += 1;
                            break;
                        case MonsterType.boss:
                            activeFigure.scenarioStats.bossKills += 1;
                            break;
                    }
                }
            }
        }
    }

    applyHeal(entity: Entity, figure: Figure, value: number) {
        const activeFigure: Figure | undefined = this.game.figures.find((figure) => figure.active);
        if (figure instanceof Character && activeFigure instanceof Character) {
            if (entity instanceof Character) {
                entity.scenarioStats.healedDamage += value;
            } else if (entity instanceof Summon) {
                figure.scenarioStats.summons.healedDamage += value;
            }

            if (activeFigure.summons.find((summon) => summon.active)) {
                activeFigure.scenarioStats.summons.heals += value;
            } else {
                activeFigure.scenarioStats.heals += value;
            }
        }
    }

    killMonsterEntity(entity: MonsterEntity) {
        const activeFigure: Figure | undefined = this.game.figures.find((figure) => figure.active);
        if (activeFigure instanceof Character) {
            if (activeFigure.summons.find((summon) => summon.active)) {
                if (entity instanceof MonsterEntity && entity.dead) {
                    switch (entity.type) {
                        case MonsterType.normal:
                            activeFigure.scenarioStats.summons.normalKills += 1;
                            break;
                        case MonsterType.elite:
                            activeFigure.scenarioStats.summons.eliteKills += 1;
                            break;
                        case MonsterType.boss:
                            activeFigure.scenarioStats.summons.bossKills += 1;
                            break;
                    }
                }
            } else {
                if (entity instanceof MonsterEntity && entity.dead) {
                    switch (entity.type) {
                        case MonsterType.normal:
                            activeFigure.scenarioStats.normalKills += 1;
                            break;
                        case MonsterType.elite:
                            activeFigure.scenarioStats.eliteKills += 1;
                            break;
                        case MonsterType.boss:
                            activeFigure.scenarioStats.bossKills += 1;
                            break;
                    }
                }
            }
        }
    }

    applyScenarioStats(character: Character, scenario: Scenario, success: boolean) {
        character.scenarioStats.scenario = new GameScenarioModel(scenario.index, scenario.edition, scenario.group);
        character.scenarioStats.success = success;
        character.scenarioStats.level = character.level;
        character.scenarioStats.difficulty = this.game.level;

        character.scenarioStats.gold = character.loot;
        character.scenarioStats.xp = character.experience;

        character.scenarioStats.treasures = character.treasures.length;

        if (character.lootCards) {
            character.lootCards.forEach((index) => {
                const loot = this.game.lootDeck.cards[index];
                if (loot) {
                    let type = loot.type;
                    if (type == LootType.special1 || type == LootType.special2) {
                        type = LootType.money;
                    }
                    character.scenarioStats.loot[type] = gameManager.lootManager.getValue(loot);
                }
            })
        }
    }

}