import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { Condition, ConditionName, ConditionType, EntityCondition } from 'src/app/game/model/data/Condition';
import { ElementState } from 'src/app/game/model/data/Element';
import { ItemFlags } from 'src/app/game/model/data/ItemData';
import { Figure } from 'src/app/game/model/Figure';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { Summon, SummonState } from 'src/app/game/model/Summon';

export class TurnManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  nextFigure(reverse: boolean = false): Figure | undefined {
    // characters which can not start their turn (e.g. missing initiative) are skipped, absent/exhausted ones are no gameplay figures
    const figures = this.game.figures.filter(
      (figure) =>
        gameManager.entityManager.gameplayFigure(figure) &&
        (!(figure instanceof Character) || figure.active || gameManager.characterManager.canActivate(figure))
    );
    const active = figures.find((figure) => figure.active);
    if (!active) {
      return reverse ? figures[figures.length - 1] : figures.find((figure) => !figure.off);
    }
    if (reverse && figures.indexOf(active) > 0) {
      if (active instanceof Character) {
        const summons = active.summons.filter((summon) => gameManager.entityManager.isAlive(summon) && summon.state !== SummonState.new);
        const activeSummon = summons.find((summon) => summon.active);
        if (activeSummon && summons.indexOf(activeSummon) > 0) {
          return active;
        }
      }
      return figures[figures.indexOf(active) - 1];
    }
    return active;
  }

  nextFigureUndoInfos(figure: Figure, reverse: boolean = false): (string | number)[] {
    if (figure instanceof Character) {
      return gameManager.characterManager.toggleActiveUndoInfos(figure);
    } else if (figure instanceof Monster) {
      const entity = settingsManager.settings.activeStandees ? gameManager.monsterManager.nextActiveStandee(figure, reverse) : undefined;
      if (entity) {
        return [
          entity.active ? 'unsetEntityActive' : 'setEntityActive',
          'data.monster.' + figure.name,
          'monster.' + entity.type,
          entity.number
        ];
      }
      return [figure.active ? 'unsetActive' : 'setActive', 'data.monster.' + figure.name];
    } else if (figure instanceof ObjectiveContainer) {
      return [figure.active ? 'unsetActive' : 'setActive', figure.title || figure.name];
    }
    return [];
  }

  toggleNextFigure(figure: Figure, reverse: boolean = false) {
    const active = this.game.figures.find((other) => gameManager.entityManager.gameplayFigure(other) && other.active);
    if (reverse && active instanceof Character && active !== figure) {
      active.summons.forEach((summon) => (summon.active = false));
    }
    if (figure instanceof Character) {
      gameManager.characterManager.toggleActive(figure);
    } else if (figure instanceof Monster) {
      const entity = settingsManager.settings.activeStandees ? gameManager.monsterManager.nextActiveStandee(figure, reverse) : undefined;
      if (entity) {
        gameManager.monsterManager.stepActiveStandee(figure, entity, reverse);
      } else {
        if (reverse && !figure.active && settingsManager.settings.activeStandees) {
          gameManager.monsterManager.activateStandees(figure);
        }
        this.toggleFigure(figure);
      }
    } else if (figure instanceof ObjectiveContainer) {
      this.toggleFigure(figure);
    }
  }

  toggleFigure(toggleFigure: Figure, initial: boolean = false) {
    const figures: Figure[] = this.game.figures;
    let index = figures.indexOf(toggleFigure);

    let lastActive = figures.find((other) => other.active);
    let lastIndex = lastActive ? figures.indexOf(lastActive) : -1;

    if (!lastActive && figures.every((figure) => figure.off)) {
      lastIndex = figures.length - 1;
      lastActive = figures[lastIndex];
      while (lastActive && !gameManager.entityManager.gameplayFigure(lastActive)) {
        lastIndex--;
        if (lastIndex === -1) {
          lastActive = undefined;
        } else {
          lastActive = figures[lastIndex];
        }
      }
    }

    const skipObjectives = toggleFigure.active || !gameManager.objectiveManager.skipObjective(toggleFigure) || initial;

    if (index === -1) {
      console.error('Invalid figure');
      return;
    }

    let figure: Figure | undefined = toggleFigure;

    let nextFigure = toggleFigure.active;

    if (settingsManager.settings.activeSummons && toggleFigure instanceof Character && !toggleFigure.absent) {
      const activeSummon = toggleFigure.summons.find((summon) => summon.active || summon.afterTurnActive);
      const summonsAfterTurn = toggleFigure.summons.filter((summon) => summon.afterTurn);
      const activeSummonsAfterTurn = summonsAfterTurn.filter((summon) => gameManager.entityManager.isAlive(summon, true));
      if (
        activeSummon &&
        (!summonsAfterTurn.includes(activeSummon) ||
          !activeSummon.active ||
          activeSummonsAfterTurn.indexOf(activeSummon) < activeSummonsAfterTurn.length - 1)
      ) {
        nextFigure = false;
      }
    }

    if (nextFigure) {
      this.afterTurn(toggleFigure);
      figure = figures.find((other, otherIndex) => gameManager.entityManager.gameplayFigure(other) && !other.off && otherIndex !== index);

      if (
        !toggleFigure.off &&
        toggleFigure instanceof Monster &&
        toggleFigure.editionRules === 'bb' &&
        toggleFigure.tags.includes('bb-elite')
      ) {
        if (!figure || figure.getInitiative() > toggleFigure.getInitiative()) {
          figure = toggleFigure;
        }
        gameManager.roundManager.sortFigures();
      }
    }

    if (skipObjectives) {
      while (figure && gameManager.objectiveManager.skipObjective(figure)) {
        index = figures.indexOf(figure);
        this.turn(figure);
        this.afterTurn(figure);
        figure = figures.find((other, otherIndex) => gameManager.entityManager.gameplayFigure(other) && !other.off && otherIndex !== index);
      }
    }

    if (figure) {
      index = figures.indexOf(figure);
      for (let i = 0; i < figures.length; i++) {
        const other = figures[i];
        if (gameManager.entityManager.gameplayFigure(other)) {
          if (i < index && i >= lastIndex && !other.off) {
            if (i > lastIndex) {
              this.beforeTurn(other);
              this.turn(other, true);
            }
            this.afterTurn(other);
          } else if (i === index) {
            if (!other.active) {
              this.beforeTurn(other);
            }
            this.turn(other);
          } else if (!nextFigure && i > index && i <= lastIndex) {
            this.beforeTurn(other);
          }
        }
      }
    }

    if (
      !initial &&
      this.game.state === GameState.next &&
      !figure &&
      settingsManager.settings.automaticEndRound &&
      this.game.figures.every((figure) => figure.off || (figure instanceof Character && (figure.exhausted || figure.absent)))
    ) {
      gameManager.roundManager.nextGameState();
    }
  }

  beforeTurn(figure: Figure) {
    if (figure.off || figure.active) {
      figure.off = false;

      if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = figure.active && !monsterEntity.off;
        });
      }

      gameManager.entityManager.entitiesAll(figure, false).forEach((entity) => {
        if (settingsManager.settings.applyConditions) {
          const killReset = (entity instanceof MonsterEntity || entity instanceof Summon) && entity.dead;
          gameManager.conditionManager.unapplyConditionsTurn(entity, figure);
          gameManager.conditionManager.unapplyConditionsAfter(entity, figure);
          if (killReset && !entity.dead) {
            const identifier = gameManager.entityManager.additionalIdentifier(figure, entity);
            const counter = gameManager.entityCounterManager.entityCounter(identifier);
            if (counter) {
              counter.killed--;
            }
          }
        }
      });

      gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          gameManager.conditionManager.restoreConditions(entity);
        }

        gameManager.specialActionsManager.beforeTurn(entity);
      });
    } else if (figure instanceof Monster && !figure.entities.find((entity) => entity.active)) {
      figure.entities.forEach((monsterEntity) => {
        monsterEntity.active = figure.active;
        monsterEntity.off = false;
      });
    }

    if (figure instanceof Character && settingsManager.settings.activeSummons) {
      figure.summons.forEach((summon) => {
        if (summon.active) {
          summon.active = false;
        }
      });
    }

    if (figure instanceof Character && figure.longRest && settingsManager.settings.applyLongRest) {
      const healCondition = figure.entityConditions.find(
        (condition) => condition.name === ConditionName.heal && condition.value && condition.expired
      );
      if (healCondition) {
        figure.entityConditions = figure.entityConditions.filter((condition) => condition !== healCondition);
      }

      if (settingsManager.settings.characterItems) {
        figure.progress.equippedItems.forEach((identifier) => {
          if (identifier.tags) {
            const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
            identifier.tags = identifier.tags.filter((tag) => tag !== ItemFlags.spent);
            if (item && item.spent) {
              identifier.tags = identifier.tags.filter((tag) => tag !== ItemFlags.slot && tag !== ItemFlags.slotBack);
            }
          }
        });
      }
    }

    if (figure.off && gameManager.entityManager.entities(figure).length > 0) {
      figure.off = false;
    }
    figure.active = false;
  }

  turn(figure: Figure, skipSummons: boolean = false) {
    figure.active = true;

    gameManager.scenarioRulesManager.addActiveFigureRule(figure);

    if (figure instanceof Monster && !figure.entities.find((entity) => entity.active)) {
      figure.entities.forEach((monsterEntity) => {
        if (!figure.off && monsterEntity.summon !== SummonState.new && gameManager.entityManager.isAlive(monsterEntity)) {
          monsterEntity.active = true;
          gameManager.specialActionsManager.turn(monsterEntity, figure);
        }
      });
    }

    if (
      settingsManager.settings.characterAttackModifierDeckActiveBottom &&
      settingsManager.settings.characterAttackModifierDeckPermanentActive
    ) {
      this.game.figures.forEach((c) => {
        if (c instanceof Character) {
          c.attackModifierDeckVisible = false;
        }
      });
    }

    if (figure instanceof Character && gameManager.entityManager.isAlive(figure)) {
      if (
        settingsManager.settings.characterAttackModifierDeckActiveBottom &&
        settingsManager.settings.characterAttackModifierDeckPermanentActive
      ) {
        figure.attackModifierDeckVisible = true;
        figure.attackModifierDeck.active = true;
      }
      if (!skipSummons && settingsManager.settings.activeSummons) {
        const activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);

        if (activeSummon) {
          gameManager.specialActionsManager.afterTurn(activeSummon);
        }

        const nextSummon = figure.summons.find(
          (summon, index, self) =>
            (!activeSummon || index > self.indexOf(activeSummon)) &&
            gameManager.entityManager.isAlive(summon, true) &&
            !gameManager.specialActionsManager.skipSummonTurn(summon) &&
            (((!activeSummon || !activeSummon.afterTurn) && !summon.afterTurn) || summon.afterTurnActive)
        );
        figure.summons
          .slice(
            activeSummon ? figure.summons.indexOf(activeSummon) : 0,
            nextSummon ? figure.summons.indexOf(nextSummon) : figure.summons.length
          )
          .forEach((prevSummon, index) => {
            prevSummon.active = false;
            prevSummon.afterTurnActive = false;
            if (settingsManager.settings.expireConditions) {
              gameManager.conditionManager.expireConditions(prevSummon, figure);
            }
            if (settingsManager.settings.scenarioRules) {
              gameManager.scenarioRulesManager.applyScenarioRulesTurn(prevSummon, true);
            }
            if (settingsManager.settings.applyConditions && (!activeSummon || index > 0)) {
              gameManager.conditionManager.applyConditionsTurn(prevSummon, figure);
              gameManager.conditionManager.applyConditionsAfter(prevSummon, figure);
            }
          });

        if (nextSummon) {
          nextSummon.active = true;
          if (settingsManager.settings.applyConditions) {
            gameManager.conditionManager.applyConditionsTurn(nextSummon, figure);
          }
          if (settingsManager.settings.scenarioRules) {
            gameManager.scenarioRulesManager.applyScenarioRulesTurn(nextSummon);
          }

          gameManager.specialActionsManager.turn(nextSummon, figure);

          if (nextSummon.dead) {
            this.turn(figure);
            return;
          }
        } else {
          this.game.elementBoard.forEach((element) => {
            if (element.state === ElementState.new) {
              element.state = ElementState.strong;
            }
          });
          figure.summons.forEach((summon) => {
            if (summon.active) {
              summon.active = false;
            }
            gameManager.specialActionsManager.afterTurn(summon);
          });
        }
      } else {
        figure.summons.forEach((summon) => {
          summon.active = false;
          if (settingsManager.settings.applyConditions) {
            gameManager.conditionManager.applyConditionsTurn(summon, figure);
          }
          if (settingsManager.settings.scenarioRules) {
            gameManager.scenarioRulesManager.applyScenarioRulesTurn(summon);
          }

          gameManager.specialActionsManager.afterTurn(summon);
        });
      }
    }

    this.game.elementBoard.forEach((element) => {
      if (element.state === ElementState.new) {
        element.state = ElementState.strong;
      }
    });

    if (!(figure instanceof Character) || skipSummons) {
      gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.applyConditions) {
          gameManager.conditionManager.applyConditionsTurn(entity, figure);
        }

        if (settingsManager.settings.scenarioRules) {
          gameManager.scenarioRulesManager.applyScenarioRulesTurn(entity);
        }
      });
    } else if (!skipSummons && !figure.summons.some((summon) => summon.active)) {
      if (settingsManager.settings.applyConditions) {
        gameManager.conditionManager.applyConditionsTurn(figure, figure);
      }
      if (settingsManager.settings.scenarioRules) {
        gameManager.scenarioRulesManager.applyScenarioRulesTurn(figure);
      }
    }

    if (figure instanceof Character && !figure.absent && (skipSummons || !figure.summons.some((summon) => summon.active))) {
      gameManager.specialActionsManager.turn(figure, figure);
    }

    if (
      settingsManager.settings.applyLongRest &&
      figure instanceof Character &&
      !figure.absent &&
      figure.longRest &&
      (skipSummons || !figure.summons.some((summon) => summon.active))
    ) {
      if (
        figure.health < figure.maxHealth ||
        figure.entityConditions.find(
          (entityCondition) =>
            !entityCondition.expired && entityCondition.types.includes(ConditionType.clearHeal) && !entityCondition.permanent
        )
      ) {
        const heal = 2 + gameManager.specialActionsManager.longRestHealBonus(figure);

        figure.health += heal;
        const healCondition = new EntityCondition(ConditionName.heal, heal);
        gameManager.conditionManager.addCondition(figure, figure, healCondition);
        gameManager.conditionManager.applyCondition(figure, figure, healCondition, true);
      }

      if (settingsManager.settings.characterItemsApply) {
        figure.progress.equippedItems.forEach((identifier) => {
          if (identifier.tags) {
            const item = gameManager.itemManager.getItem(identifier.name, identifier.edition, true);
            if (item && item.id == 120 && item.edition === 'gh2e') {
              gameManager.conditionManager.addCondition(figure, figure, new Condition(ConditionName.strengthen));
            }
          }
        });
      }
    }

    if (figure instanceof ObjectiveContainer) {
      if (
        figure.amDeck &&
        settingsManager.settings.characterAttackModifierDeckActiveBottom &&
        settingsManager.settings.characterAttackModifierDeckPermanentActive
      ) {
        const char = this.game.figures.find((other) => other instanceof Character && other.name === figure.amDeck) as Character;
        if (!!char) {
          char.attackModifierDeckVisible = true;
        }
      }

      figure.entities.forEach((objectiveEntity) => {
        if (!figure.off && gameManager.entityManager.isAlive(objectiveEntity)) {
          gameManager.specialActionsManager.turn(objectiveEntity, figure);
        }
      });
    }

    if (
      (figure instanceof Character && !gameManager.entityManager.isAlive(figure)) ||
      (figure instanceof Monster && figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity))) ||
      (figure instanceof ObjectiveContainer && figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity)))
    ) {
      this.toggleFigure(figure);
    }
  }

  afterTurn(figure: Figure) {
    if (!figure.off) {
      gameManager.scenarioRulesManager.addActiveFigureRule(figure, true);

      if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = false;
          monsterEntity.off = true;
          gameManager.specialActionsManager.afterTurn(monsterEntity);
        });
      }

      if (settingsManager.settings.activeSummons && figure instanceof Character) {
        let activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
        while (activeSummon) {
          this.turn(figure);
          activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
        }
      }

      if (figure instanceof Character) {
        gameManager.specialActionsManager.afterTurn(figure);

        figure.summons.forEach((summon) => {
          if (!settingsManager.settings.activeSummons) {
            summon.active = false;
            if (gameManager.entityManager.isAlive(summon)) {
              if (settingsManager.settings.expireConditions) {
                gameManager.conditionManager.expireConditions(summon, figure);
              }
              if (settingsManager.settings.applyConditions) {
                gameManager.conditionManager.applyConditionsAfter(summon, figure);
              }

              if (settingsManager.settings.scenarioRules) {
                gameManager.scenarioRulesManager.applyScenarioRulesTurn(summon, true);
              }
            }
          }

          gameManager.specialActionsManager.afterTurn(summon);
        });
      }

      if (figure instanceof Character) {
        if (settingsManager.settings.expireConditions) {
          gameManager.conditionManager.expireConditions(figure, figure);
        }

        if (settingsManager.settings.applyConditions) {
          gameManager.conditionManager.applyConditionsAfter(figure, figure);
        }

        if (settingsManager.settings.scenarioRules) {
          gameManager.scenarioRulesManager.applyScenarioRulesTurn(figure, true);
        }
      } else {
        gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
          if (settingsManager.settings.expireConditions) {
            gameManager.conditionManager.expireConditions(entity, figure);
          }

          if (settingsManager.settings.applyConditions) {
            gameManager.conditionManager.applyConditionsAfter(entity, figure);
          }

          if (settingsManager.settings.scenarioRules) {
            gameManager.scenarioRulesManager.applyScenarioRulesTurn(entity, true);
          }
        });
      }
    }

    this.game.elementBoard.forEach((element) => {
      if (element.state === ElementState.new) {
        element.state = ElementState.strong;
      }
      if (element.state === ElementState.consumed || element.state === ElementState.partlyConsumed) {
        element.state = ElementState.inert;
      }
    });

    figure.off = true;
    figure.active = false;

    if (
      figure instanceof Monster &&
      figure.editionRules === 'bb' &&
      figure.tags.includes('bb-elite') &&
      !figure.tags.includes('roundAction-bb-elite')
    ) {
      figure.tags.push('roundAction-bb-elite');
      figure.ability += 1;
      if (figure.ability >= figure.abilities.length) {
        figure.ability = 0;
      }
      figure.off = false;
    }
  }
}
