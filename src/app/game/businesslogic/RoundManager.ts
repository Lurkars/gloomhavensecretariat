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
          if (element.state == ElementState.strong || element.state == ElementState.new) {
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
          this.toggleFigure(firstFigure, true);
        }
      }

    }
    gameManager.uiChange.emit();
    setTimeout(() => this.working = false, 1);
  }

  toggleFigure(figure: Figure, initial: boolean = false) {
    const figures: Figure[] = this.game.figures;
    const index = figures.indexOf(figure);

    if (index == -1) {
      console.error("Invalid figure");
      return;
    }

    if (!figure.active && !figure.off) {
      this.turn(figure, initial);
    } else if (figure.active && !figure.off) {
      if (settingsManager.settings.activeStandees && figure instanceof Character && figure.summons.find((summon) => summon.active)) {
        figure.summons.forEach((summon) => summon.active = false);
        this.game.elementBoard.forEach((element) => {
          if (element.state == ElementState.new) {
            element.state = ElementState.strong;
          }
        })
      } else {
        this.afterTurn(figure);
      }
    } else if (!figures.some((other, otherIndex) => otherIndex < index && other.active)) {
      if (gameManager.gameplayFigure(figure)) {
        figure.active = true;
        if (settingsManager.settings.activeSummons && figure instanceof Character) {
          const summon = figure.summons.find((summon) => gameManager.entityManager.isAlive(summon, true));
          if (summon && !figure.summons.find((summon) => summon.active)) {
            summon.active = true;
          }
        }
      }
    } else {
      this.beforeTurn(figure);
    }

    if (gameManager.entityManager.entities(figure).length == 0) {
      this.afterTurn(figure);
    }

    for (let i = 0; i < figures.length; i++) {
      const otherFigure = figures[i];
      const absent = otherFigure instanceof Character && otherFigure.absent;
      if (figure.active) {
        if (i < index) {
          this.afterTurn(otherFigure);
        } else if (!initial && (!(otherFigure instanceof Monster) || (otherFigure instanceof Monster && otherFigure.entities.length > 0))) {
          this.beforeTurn(otherFigure);
          if (i == index) {
            this.turn(otherFigure);
          }
        }
        if (i != index) {
          otherFigure.active = false;
        }
      }
      if (figure.off && gameManager.entityManager.entities(figure).length > 0) {
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

    if (figure.off && gameManager.entityManager.entities(figure).length > 0) {
      figure.off = false;
    }

  }

  turn(figure: Figure, initial: boolean = false) {
    figure.active = true;

    if (figure instanceof Monster) {
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

      figure.off = true;
      figure.active = false;
    }
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

    gameManager.uiChange.emit();
  }
}