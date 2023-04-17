import { AttackModifierDeck } from "src/app/game/model/data/AttackModifier";
import { Character } from "../model/Character";
import { ElementState } from "../model/data/Element";
import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { LootDeck } from "../model/data/Loot";
import { Monster } from "../model/Monster";
import { Objective } from "../model/Objective";
import { SummonState } from "../model/Summon";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class RoundManager {

  game: Game;
  working: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  nextAvailable(): boolean {
    return this.game.figures.length > 0 && (this.game.state == GameState.next || this.game.figures.every((figure) => figure instanceof Monster || figure instanceof Objective && (figure.getInitiative() > 0 || figure.exhausted || !settingsManager.settings.initiativeRequired) || figure instanceof Character && (figure.getInitiative() > 0 || figure.exhausted || figure.absent || !settingsManager.settings.initiativeRequired)
    ));
  }

  nextGameState(force: boolean = false) {
    this.working = true;
    this.game.totalSeconds += this.game.playSeconds;
    this.game.playSeconds = 0;

    gameManager.scenarioRulesManager.addScenarioRules();

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

    } else if (this.nextAvailable() || force) {
      if (this.game.round == 0) {
        gameManager.attackModifierManager.draw();
        gameManager.lootManager.draw();
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

    const lastActive = figures.find((other) => other.active);
    const lastIndex = lastActive ? figures.indexOf(lastActive) : -1;

    if (index == -1) {
      console.error("Invalid figure");
      return;
    }

    let figure: Figure | undefined = toggleFigure;

    const next = toggleFigure.active && (!(toggleFigure instanceof Character) || !toggleFigure.summons.find((summon) => summon.active));
    if (next) {
      this.afterTurn(toggleFigure);
      figure = figures.find((other, otherIndex) => gameManager.gameplayFigure(other) && !other.off && otherIndex != index);
    }

    if (figure) {
      index = figures.indexOf(figure);
      for (let i = 0; i < figures.length; i++) {
        const other = figures[i];
        if (gameManager.gameplayFigure(other)) {
          if (i < index) {
            if (i > lastIndex && !other.off) {
              this.beforeTurn(other);
              this.turn(other)
            }
            this.afterTurn(other);
          } else if (i == index) {
            if (!next) {
              this.beforeTurn(other);
            }
            this.turn(other)
          } else if (i > index && (!other.off || index == figures.indexOf(toggleFigure))) {
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
          gameManager.entityManager.unapplyConditionsTurn(entity);
          gameManager.entityManager.unapplyConditionsAfter(entity);
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
    } else if (!figure.active && settingsManager.settings.activeSummons && figure instanceof Character) {
      figure.summons.forEach((summon) => {
        if (summon.active) {
          summon.active = false;
        }
      });
    }

    if (figure.off && gameManager.entityManager.entities(figure).length > 0) {
      figure.off = false;
    }
    figure.active = false;
  }

  turn(figure: Figure, initial: boolean = false) {
    figure.active = true;

    if (figure instanceof Monster && !figure.entities.find((entity) => entity.active)) {
      figure.entities.forEach((monsterEntity) => {
        if ((!figure.off || initial) && monsterEntity.summon != SummonState.new && gameManager.entityManager.isAlive(monsterEntity)) {
          monsterEntity.active = true;
        }
      });
    }

    if (settingsManager.settings.activeSummons && figure instanceof Character && gameManager.entityManager.isAlive(figure)) {
      const summon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true));
      if (summon && !figure.summons.find((summon) => summon.active)) {
        summon.active = true;
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

    gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
      if (settingsManager.settings.applyConditions) {
        gameManager.entityManager.applyConditionsTurn(entity);
      }
    })
  }

  afterTurn(figure: Figure) {
    if (!figure.off) {
      figure.off = true;
      figure.active = false;

      if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = false;
          monsterEntity.off = true;
        });
      }

      if (settingsManager.settings.activeSummons && figure instanceof Character) {
        figure.summons.forEach((summon) => {
          if (summon.active) {
            summon.active = false;
          }
        });
      }

      gameManager.entityManager.entitiesAll(figure).forEach((entity) => {
        if (settingsManager.settings.expireConditions) {
          gameManager.entityManager.expireConditions(entity);
        }

        if (settingsManager.settings.applyConditions) {
          gameManager.entityManager.applyConditionsTurn(entity);
          gameManager.entityManager.applyConditionsAfter(entity);
        }
      })
    }

    this.game.elementBoard.forEach((element) => {
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
    gameManager.stateManager.standeeDialogCanceled = false;

    gameManager.uiChange.emit();
  }
}