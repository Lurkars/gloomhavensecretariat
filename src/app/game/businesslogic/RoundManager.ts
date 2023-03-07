import { AttackModifierDeck } from "../model/AttackModifier";
import { Character } from "../model/Character";
import { ElementState } from "../model/Element";
import { EntityValueFunction } from "../model/Entity";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
import { LootDeck } from "../model/Loot";
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

    gameManager.scenarioManager.addScenarioRules();

    if (this.game.state == GameState.next) {
      this.game.state = GameState.draw;
      gameManager.characterManager.next();
      gameManager.monsterManager.next();
      gameManager.attackModifierManager.next();
      gameManager.lootManager.next();

      if (settingsManager.settings.moveElements) {
        this.game.elementBoard.forEach((element) => {
          if (element.state == ElementState.strong) {
            element.state = ElementState.waning;
          } else if (element.state == ElementState.waning) {
            element.state = ElementState.inert;
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
          this.toggleFigure(firstFigure);
        }
      }

    }
    gameManager.uiChange.emit();
    setTimeout(() => this.working = false, 1);
  }

  toggleFigure(figure: Figure) {
    const figures: Figure[] = this.game.figures;
    const index = figures.indexOf(figure);

    if (index == -1) {
      console.error("Invalid figure");
      return;
    }

    if (!figure.active && !figure.off) {
      this.turn(figure);
    } else if (figure.active && !figure.off) {
      if (settingsManager.settings.activeStandees && figure instanceof Character && figure.summons.find((summon) => summon.active)) {
        figure.summons.forEach((summon) => summon.active = false);
      } else {
        this.afterTurn(figure);
      }
    } else if (!figures.some((other, otherIndex) => otherIndex < index && other.active)) {
      if (gameManager.gameplayFigure(figure)) {
        figure.active = true;
        if (settingsManager.settings.activeSummons && figure instanceof Character) {
          const summon = figure.summons.find((summon) => !summon.dead && summon.health > 0 && summon.state != SummonState.new);
          if (summon && !figure.summons.find((summon) => summon.active)) {
            summon.active = true;
          }
        }
      }
    } else {
      this.beforeTurn(figure);
    }

    if (this.permanentDead(figure)) {
      this.afterTurn(figure);
    }

    for (let i = 0; i < figures.length; i++) {
      const otherFigure = figures[i];
      const absent = otherFigure instanceof Character && otherFigure.absent;
      if (figure.active) {
        if (i != index) {
          otherFigure.active = false;
        }
        if (i < index) {
          this.afterTurn(otherFigure);
        } else if (!(otherFigure instanceof Monster) || (otherFigure instanceof Monster && otherFigure.entities.length > 0)) {
          this.beforeTurn(otherFigure);
        }
      }
      if (figure.off && !this.permanentDead(otherFigure)) {
        if (i < index && !otherFigure.off && !figures.some((figure) => figure.active) && !absent) {
          this.turn(otherFigure);
        } else if (i > index && (!(otherFigure instanceof Monster) || (otherFigure instanceof Monster && otherFigure.entities.length > 0))) {
          if (!otherFigure.off && i > index && !figures.some((figure, activeIndex) => figure.active && activeIndex < i) && !absent) {
            this.turn(otherFigure);
          } else {
            otherFigure.active = false;
          }
        }
      }
    }
  }


  beforeTurn(figure: Figure) {
    if (figure.off) {
      figure.off = false;

      if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = figure.active && !monsterEntity.off;
        });
      }

      if (settingsManager.settings.expireConditions) {
        if (figure instanceof Character) {
          gameManager.entityManager.restoreConditions(figure);
          figure.summons.forEach((summon) => {
            gameManager.entityManager.restoreConditions(summon);
          });
        } else if (figure instanceof Objective) {
          gameManager.entityManager.restoreConditions(figure);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity) => {
            gameManager.entityManager.restoreConditions(monsterEntity);
          });
        }
      }
    } else if (figure instanceof Monster) {
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

    if (settingsManager.settings.applyConditions) {
      if (!figure.active) {
        if (figure instanceof Character) {
          gameManager.entityManager.unapplyConditionsTurn(figure);
          figure.summons.forEach((summon) => {
            gameManager.entityManager.unapplyConditionsTurn(summon);
          });
        } else if (figure instanceof Objective) {
          gameManager.entityManager.unapplyConditionsTurn(figure);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity) => {
            gameManager.entityManager.unapplyConditionsTurn(monsterEntity);
          });
        }
      }
    }

    if (settingsManager.settings.applyConditions) {
      if (figure instanceof Character) {
        gameManager.entityManager.unapplyConditionsAfter(figure);
        figure.summons.forEach((summon) => {
          gameManager.entityManager.unapplyConditionsAfter(summon);
        });
      } else if (figure instanceof Objective) {
        gameManager.entityManager.unapplyConditionsAfter(figure);
      } else if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          gameManager.entityManager.unapplyConditionsAfter(monsterEntity);
        });
      }

      if (figure.off && !this.permanentDead(figure)) {
        figure.off = false;
      }
    }
  }

  turn(figure: Figure) {
    figure.active = true;

    if (figure instanceof Monster) {
      figure.entities.forEach((monsterEntity) => {
        if (!monsterEntity.off && monsterEntity.summon != SummonState.new) {
          monsterEntity.active = true;
        }
      });
    }

    if (settingsManager.settings.activeSummons && figure instanceof Character) {
      const summon = figure.summons.find((summon) => !summon.dead && summon.health > 0 && summon.state != SummonState.new);
      if (summon && !figure.summons.find((summon) => summon.active)) {
        summon.active = true;
      }
    }

    this.game.elementBoard.forEach((element) => {
      if (element.state == ElementState.new) {
        element.state = ElementState.strong;
      }
    })

    if (settingsManager.settings.applyConditions) {
      if (figure instanceof Character) {
        gameManager.entityManager.applyConditionsTurn(figure);
        figure.summons.forEach((summon) => {
          gameManager.entityManager.applyConditionsTurn(summon);
        });
        if (figure.exhausted) {
          this.toggleFigure(figure);
        }
      } else if (figure instanceof Objective) {
        gameManager.entityManager.applyConditionsTurn(figure);
        if (figure.exhausted) {
          this.toggleFigure(figure);
        }
      } else if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          gameManager.entityManager.applyConditionsTurn(monsterEntity);
        });
        if (figure.entities.every((monsterEntity) => monsterEntity.dead)) {
          this.toggleFigure(figure);
        }
      }
    }
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

      if (settingsManager.settings.expireConditions) {
        if (figure instanceof Character) {
          gameManager.entityManager.expireConditions(figure);
          figure.summons.forEach((summon) => {
            gameManager.entityManager.expireConditions(summon);
          });
        } else if (figure instanceof Objective) {
          gameManager.entityManager.expireConditions(figure);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity) => {
            gameManager.entityManager.expireConditions(monsterEntity);
          });
        }
      }

      if (settingsManager.settings.applyConditions) {
        if (figure instanceof Character) {
          gameManager.entityManager.applyConditionsTurn(figure);
          figure.summons.forEach((summon) => {
            gameManager.entityManager.applyConditionsTurn(summon);
          });
        } else if (figure instanceof Objective) {
          gameManager.entityManager.applyConditionsTurn(figure);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity) => {
            gameManager.entityManager.applyConditionsTurn(monsterEntity);
          });
        }

        if (figure instanceof Character) {
          gameManager.entityManager.applyConditionsAfter(figure);
          figure.summons.forEach((summon) => {
            gameManager.entityManager.applyConditionsAfter(summon);
          });
        } else if (figure instanceof Objective) {
          gameManager.entityManager.applyConditionsAfter(figure);
        } else if (figure instanceof Monster) {
          figure.entities.forEach((monsterEntity) => {
            gameManager.entityManager.applyConditionsAfter(monsterEntity);
          });
        }
      }
    }
  }

  permanentDead(figure: Figure): boolean {
    return ((figure instanceof Character || figure instanceof Objective) && (figure.exhausted || figure.health <= 0 && EntityValueFunction(figure.maxHealth) > 0)) || (figure instanceof Monster && figure.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.health <= 0));
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
    this.game.state = GameState.draw;
    this.game.elementBoard.forEach((element) => element.state = ElementState.inert);
    this.game.monsterAttackModifierDeck.fromModel(new AttackModifierDeck().toModel());
    this.game.allyAttackModifierDeck.fromModel(new AttackModifierDeck().toModel());
    this.game.figures = this.game.figures.filter((figure) => figure instanceof Character || this.game.scenario && this.game.scenario.custom);
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

    gameManager.uiChange.emit();
  }
}