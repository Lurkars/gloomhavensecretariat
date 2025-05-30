import { gameManager } from "../../businesslogic/GameManager";
import { settingsManager } from "../../businesslogic/SettingsManager";
import { Character } from "../../model/Character";
import { GameState } from "../../model/Game";
import { Monster } from "../../model/Monster";
import { ObjectiveContainer } from "../../model/ObjectiveContainer";
import { SummonState } from "../../model/Summon";
import { CommandImpl } from "../Command";

export class FigureNextCommand extends CommandImpl {
    id: string = 'figure.next';
    requiredParameters: number = 0;

    validParameters(): boolean {
        return true;
    }

    executeWithParameters(reverse: boolean) {
        if (gameManager.game.state != GameState.next) {
            this.executionError("invalid game state");
        }
        const figures = gameManager.game.figures.filter((figure) => gameManager.gameplayFigure(figure));
        let activeFigure = figures.find((figure) => figure.active);
        if (!activeFigure) {
            if (reverse) {
                activeFigure = figures[figures.length - 1];
            } else {
                activeFigure = figures.find((figure) => !figure.off);
            }
        } else if (activeFigure && reverse && figures.indexOf(activeFigure) > 0) {
            if (activeFigure instanceof Character) {
                const summons = activeFigure.summons.filter((summon) => gameManager.entityManager.isAlive(summon) && summon.state != SummonState.new);
                let activeSummon = summons.find((summon) => summon.active);
                if (!activeSummon || activeSummon && summons.indexOf(activeSummon) == 0) {
                    activeFigure.summons.forEach((summon) => summon.active = false);
                    activeFigure = figures[figures.indexOf(activeFigure) - 1];
                }
            } else {
                activeFigure = figures[figures.indexOf(activeFigure) - 1];
            }
        }

        if (activeFigure) {
            if (activeFigure instanceof Character) {
                const activeSummon = activeFigure.summons.find((summon) => summon.active);
                const csSprits = activeFigure.summons.filter((summon) => summon.tags.indexOf('cs-skull-spirit') != -1);
                if (settingsManager.settings.activeSummons && !activeSummon && activeFigure.active && csSprits.length && !csSprits.find((summon) => summon.active)) {
                    csSprits.forEach((spirit) => spirit.tags.push('cs-skull-spirit-turn'));
                }
                gameManager.roundManager.toggleFigure(activeFigure);
            } else if (activeFigure instanceof Monster) {
                let toggleFigure = true;
                const entities = activeFigure.entities.filter((entity) => gameManager.entityManager.isAlive(entity) && entity.summon != SummonState.new);
                if (settingsManager.settings.activeStandees) {
                    let activeEntity = entities.find((entity) => entity.active);
                    if (!activeEntity && entities.length > 0 && reverse && activeFigure.active) {
                        activeEntity = entities[entities.length - 1];
                        gameManager.monsterManager.toggleActive(activeFigure, activeEntity);
                        activeEntity.active = true;
                        toggleFigure = false;
                    } else if (activeEntity && !reverse) {
                        gameManager.monsterManager.toggleActive(activeFigure, activeEntity);
                        if (entities.indexOf(activeEntity) < entities.length - 1) {
                            entities[entities.indexOf(activeEntity) + 1].active = true;
                        }
                        toggleFigure = false;
                    }
                }
                if (toggleFigure) {
                    if (reverse && !activeFigure.active && settingsManager.settings.activeStandees) {
                        activeFigure.entities.forEach((entity) => {
                            if (gameManager.entityManager.isAlive(entity)) {
                                entity.active = true;
                                entity.off = false;
                            }
                        });
                    }
                    gameManager.roundManager.toggleFigure(activeFigure);
                }
            } else if (activeFigure instanceof ObjectiveContainer) {
                gameManager.roundManager.toggleFigure(activeFigure);
            }
        }
    }
}