import { AttackModifierDeck } from "src/app/game/model/data/AttackModifier";
import { Character } from "../model/Character";
import { ElementState } from "../model/data/Element";
import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { LootDeck } from "../model/data/Loot";
import { Monster } from "../model/Monster";
import { Objective } from "../model/Objective";
import { Summon, SummonState } from "../model/Summon";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";
import { Condition, ConditionName, ConditionType } from "../model/data/Condition";
import { MonsterEntity } from "../model/MonsterEntity";
import { Scenario } from "../model/Scenario";
import { ScenarioData } from "../model/data/ScenarioData";

export class RoundManager {

  game: Game;
  working: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  drawAvailable(): boolean {
    return this.game.figures.length > 0 && (this.game.state == GameState.next || this.game.figures.every((figure) => figure instanceof Monster || figure instanceof Objective && (figure.getInitiative() > 0 || figure.exhausted || !settingsManager.settings.initiativeRequired) || figure instanceof Character && (figure.getInitiative() > 0 || figure.exhausted || figure.absent || !settingsManager.settings.initiativeRequired)
    ));
  }

  nextGameState(force: boolean = false) {
    this.working = true;
    this.game.totalSeconds += this.game.playSeconds;
    this.game.playSeconds = 0;

    if (settingsManager.settings.scenarioRules) {
      gameManager.scenarioRulesManager.addScenarioRules();
    }

    if (this.game.state == GameState.next) {
      this.game.state = GameState.draw;
      gameManager.entityManager.next();
      gameManager.characterManager.next();
      gameManager.monsterManager.next();
      gameManager.attackModifierManager.next();

      if (settingsManager.settings.moveElements) {
        this.game.elementBoard.forEach((element) => {
          if (element.state != ElementState.always) {
            if (element.state == ElementState.strong || element.state == ElementState.new) {
              element.state = ElementState.waning;
            } else if (element.state == ElementState.waning) {
              element.state = ElementState.inert;
            }
          }
        })
      }

      gameManager.sortFigures();

      this.game.figures.forEach((figure) => {
        figure.active = false;
      });

    } else if (this.drawAvailable() || force) {
      if (this.game.round == 0) {
        gameManager.attackModifierManager.draw();
        gameManager.lootManager.draw();
        if (!this.game.scenario) {
          this.game.scenario = new Scenario(new ScenarioData(), [], true);
        }
      }
      this.game.state = GameState.next;
      this.game.round++;
      gameManager.characterManager.draw();
      gameManager.monsterManager.draw();

      if (settingsManager.settings.moveElements) {
        this.game.elementBoard.forEach((element) => {
          if (element.state == ElementState.new) {
            element.state = ElementState.strong;
          }
        })
      }

      gameManager.sortFigures();

      if (this.game.figures.length > 0) {
        let i = 0;
        let firstFigure = this.game.figures.find((figure, index) => index == i && gameManager.gameplayFigure(figure));
        while (!firstFigure && i < this.game.figures.length - 1) {
          i++;
          firstFigure = this.game.figures.find((figure, index) => index == i && gameManager.gameplayFigure(figure));
        }
        if (firstFigure) {
          this.toggleFigure(firstFigure, true);
        }
      }

    }
    gameManager.uiChange.emit();
    setTimeout(() => this.working = false, 1);
  }

  toggleFigure(toggleFigure: Figure, initial: boolean = false) {
    const figures: Figure[] = this.game.figures;
    let index = figures.indexOf(toggleFigure);

    let lastActive = figures.find((other) => other.active);
    let lastIndex = lastActive ? figures.indexOf(lastActive) : -1;

    if (!lastActive && figures.every((figure) => figure.off)) {
      lastIndex = figures.length - 1;
      lastActive = figures[lastIndex];
      while (lastActive && !gameManager.gameplayFigure(lastActive)) {
        lastIndex--;
        if (lastIndex == -1) {
          lastActive = undefined;
        } else {
          lastActive = figures[lastIndex];
        }
      }
    }

    const skipObjectives = toggleFigure.active || !gameManager.characterManager.skipObjective(toggleFigure) || initial;

    if (index == -1) {
      console.error("Invalid figure");
      return;
    }

    let figure: Figure | undefined = toggleFigure;

    const next = toggleFigure.active && (!(toggleFigure instanceof Character) || !settingsManager.settings.activeSummons || !toggleFigure.summons.find((summon) => summon.active));
    if (next) {
      this.afterTurn(toggleFigure);
      figure = figures.find((other, otherIndex) => gameManager.gameplayFigure(other) && !other.off && otherIndex != index);
    }

    if (skipObjectives) {
      while (figure && gameManager.characterManager.skipObjective(figure)) {
        index = figures.indexOf(figure);
        this.turn(figure);
        this.afterTurn(figure);
        figure = figures.find((other, otherIndex) => gameManager.gameplayFigure(other) && !other.off && otherIndex != index);
      }
    }

    if (figure) {
      index = figures.indexOf(figure);
      for (let i = 0; i < figures.length; i++) {
        const other = figures[i];
        if (gameManager.gameplayFigure(other)) {
          if (i < index && i >= lastIndex && !other.off) {
            if (i > lastIndex) {
              this.beforeTurn(other);
              this.turn(other, true);
            }
            this.afterTurn(other);
          } else if (i == index) {
            if (!other.active) {
              this.beforeTurn(other);
            }
            this.turn(other);
          } else if (!next && i > index && i <= lastIndex) {
            this.beforeTurn(other);
          }
        }
      }
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
          gameManager.entityManager.unapplyConditionsTurn(entity);
          gameManager.entityManager.unapplyConditionsAfter(entity);
          if (killReset && !entity.dead) {
            const identifier = gameManager.additionalIdentifier(figure, entity);
            let counter = gameManager.entityCounter(identifier);
            if (counter) {
              counter.killed--;
            }
          }
        }
      })

      gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          gameManager.entityManager.restoreConditions(entity);
        }
      })
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
      const healCondition = figure.entityConditions.find((condition) => condition.name == ConditionName.heal && condition.value && condition.expired);
      if (healCondition) {
        figure.entityConditions = figure.entityConditions.filter((condition) => condition != healCondition);
      }
    }

    if (figure.off && gameManager.entityManager.entities(figure).length > 0) {
      figure.off = false;
    }
    figure.active = false;
  }

  turn(figure: Figure, skipSummons: boolean = false) {

    figure.active = true;

    if (figure instanceof Monster && !figure.entities.find((entity) => entity.active)) {
      figure.entities.forEach((monsterEntity) => {
        if (!figure.off && monsterEntity.summon != SummonState.new && gameManager.entityManager.isAlive(monsterEntity)) {
          monsterEntity.active = true;
        }
      });
    }

    if (!skipSummons && figure instanceof Character && settingsManager.settings.activeSummons && gameManager.entityManager.isAlive(figure)) {
      const activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
      const nextSummon = figure.summons.find((summon, index, self) => (!activeSummon || index > self.indexOf(activeSummon)) && gameManager.entityManager.isAlive(summon, true));

      figure.summons.slice(activeSummon ? figure.summons.indexOf(activeSummon) : 0, nextSummon ? figure.summons.indexOf(nextSummon) : figure.summons.length).forEach((prevSummon, index, self) => {
        prevSummon.active = false;
        if (settingsManager.settings.expireConditions) {
          gameManager.entityManager.expireConditions(prevSummon);
        }
        if (settingsManager.settings.applyConditions && (!activeSummon || index > 0)) {
          gameManager.entityManager.applyConditionsTurn(prevSummon);
          gameManager.entityManager.applyConditionsAfter(prevSummon);
        }
      })

      if (nextSummon) {
        nextSummon.active = true;
        if (settingsManager.settings.applyConditions) {
          gameManager.entityManager.applyConditionsTurn(nextSummon);
        }
        if (nextSummon.dead) {
          this.turn(figure);
        }
      } else {
        this.game.elementBoard.forEach((element) => {
          if (element.state == ElementState.new) {
            element.state = ElementState.strong;
          }
        })
        figure.summons.forEach((summon) => {
          if (summon.active) {
            summon.active = false;
          }
        });
      }
    }

    this.game.elementBoard.forEach((element) => {
      if (element.state == ElementState.new) {
        element.state = ElementState.strong;
      }
    })

    if (settingsManager.settings.applyConditions) {
      if (!(figure instanceof Character) || skipSummons) {
        gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
          gameManager.entityManager.applyConditionsTurn(entity);
        })
      } else if (!skipSummons && !figure.summons.some((summon) => summon.active)) {
        gameManager.entityManager.applyConditionsTurn(figure);
      }
    }

    if (figure instanceof Character && settingsManager.settings.applyLongRest && figure.longRest && (skipSummons || !figure.summons.some((summon) => summon.active))) {
      if (figure.health < figure.maxHealth || figure.entityConditions.find((entityCondition) => !entityCondition.expired && entityCondition.types.indexOf(ConditionType.clearHeal) != -1 && !entityCondition.permanent)) {
        figure.health += 2;
        gameManager.entityManager.addCondition(figure, new Condition(ConditionName.heal, 2), figure.active || false, figure.off || false);
        gameManager.entityManager.applyCondition(figure, ConditionName.heal, true);
      }
    }

    if ((figure instanceof Character || figure instanceof Objective) && !gameManager.entityManager.isAlive(figure) || figure instanceof Monster && figure.entities.every((entity) => !gameManager.entityManager.isAlive(entity))) {
      gameManager.roundManager.toggleFigure(figure);
    }
  }

  afterTurn(figure: Figure) {
    if (!figure.off) {
      if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = false;
          monsterEntity.off = true;
        });
      }

      if (settingsManager.settings.activeSummons && figure instanceof Character) {
        let activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
        while (activeSummon) {
          this.turn(figure);
          activeSummon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true) && summon.active);
        }
      }


      gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          gameManager.entityManager.expireConditions(entity);
        }

        if (settingsManager.settings.applyConditions) {
          gameManager.entityManager.applyConditionsAfter(entity);
        }
      })
    }

    this.game.elementBoard.forEach((element) => {
      if (element.state == ElementState.new) {
        element.state = ElementState.strong;
      }
      if (element.state == ElementState.consumed) {
        element.state = ElementState.inert;
      }
    })

    figure.off = true;
    figure.active = false;
  }

  resetScenario() {
    this.game.playSeconds = 0;
    this.game.sections = [];
    if (this.game.scenario) {
      this.game.scenario.revealedRooms = [];
    }
    this.game.scenarioRules = [];
    this.game.disgardedScenarioRules = [];
    this.game.round = 0;
    this.game.roundResets = [];
    this.game.roundResetsHidden = [];
    this.game.state = GameState.draw;
    this.game.elementBoard.forEach((element) => element.state = ElementState.inert);
    this.game.monsterAttackModifierDeck.fromModel(new AttackModifierDeck().toModel());
    this.game.allyAttackModifierDeck.fromModel(new AttackModifierDeck().toModel());
    this.game.figures = this.game.figures.filter((figure) => figure instanceof Character || this.game.scenario && this.game.scenario.custom);
    this.game.entitiesCounter = [];
    this.game.lootDeck.fromModel(new LootDeck());

    this.game.figures.forEach((figure) => {
      figure.active = false;
      figure.off = false;
      if (figure instanceof Character) {
        figure.health = figure.maxHealth;
        figure.loot = 0;
        figure.lootCards = [];
        figure.treasures = [];
        figure.experience = 0;
        figure.entityConditions = [];
        figure.summons = [];
        figure.initiative = 0;
        figure.exhausted = false;
        figure.longRest = false;
        figure.token = 0;
        figure.battleGoal = false;
        figure.battleGoals = [];

        figure.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => gameManager.characterManager.createSpecialSummon(figure, summonData));

        figure.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(figure);
        figure.lootCardsVisible = false;
        gameManager.characterManager.applyDonations(figure);
      } else if (figure instanceof Monster) {
        figure.entities = [];
        figure.ability = -1;
        figure.abilities = [];
        gameManager.monsterManager.resetMonsterAbilities(figure);
      } else if (figure instanceof Objective) {
        figure.health = EntityValueFunction(figure.maxHealth);
        figure.entityConditions = [];
      }
    })

    if (this.game.party.townGuardDeck) {
      const townGuardDeck = gameManager.attackModifierManager.buildTownGuardAttackModifierDeck(this.game.party, gameManager.campaignData());
      gameManager.attackModifierManager.shuffleModifiers(townGuardDeck);
      townGuardDeck.active = false;
      this.game.party.townGuardDeck = townGuardDeck.toModel();
    }

    gameManager.stateManager.standeeDialogCanceled = false;

    gameManager.uiChange.emit();
  }
}