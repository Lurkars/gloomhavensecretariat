import { AttackModifierDeck, defaultAttackModifier } from "../model/AttackModifier";
import { Character } from "../model/Character";
import { Figure } from "../model/Figure";
import { Game, GameState } from "../model/Game";
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
    return this.game.figures.length > 0 && (this.game.state == GameState.next || this.game.figures.every((figure) => figure instanceof Monster || (figure instanceof Objective || figure instanceof Character) && (figure.getInitiative() > 0 || figure.exhausted || !settingsManager.settings.initiativeRequired)
    ));
  }

  nextGameState() {
    this.working = true;
    this.game.totalSeconds += this.game.playSeconds;
    this.game.playSeconds = 0;
    if (this.game.state == GameState.next) {
      this.game.state = GameState.draw;
      gameManager.characterManager.next();
      gameManager.monsterManager.next();
      gameManager.attackModifierManager.next();

      if (settingsManager.settings.moveElements) {
        this.game.elements = [];
        this.game.strongElements.forEach((element) => {
          this.game.elements.push(element);
        });
        this.game.strongElements = [];
      }

      this.game.figures.forEach((figure) => figure.active = false);

      gameManager.sortFigures();

    } else if (this.nextAvailable()) {
      if (this.game.round == 0) {
        gameManager.attackModifierManager.draw();
      }
      this.game.state = GameState.next;
      this.game.round++;
      gameManager.characterManager.draw();
      gameManager.monsterManager.draw();

      if (settingsManager.settings.moveElements) {
        this.game.newElements.forEach((element) => {
          this.game.strongElements.push(element);
        });
        this.game.newElements = [];
      }

      if (this.game.figures.length > 0) {
        this.toggleFigure(this.game.figures[ 0 ]);
      }

      gameManager.sortFigures();
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
      this.afterTurn(figure)
    } else if (!figures.some((other, otherIndex) => otherIndex < index && other.active)) {
      figure.active = true;
    } else {
      this.beforeTurn(figure);
    }

    if (this.permanentDead(figure)) {
      this.afterTurn(figure);
    }

    for (let i = 0; i < figures.length; i++) {
      const otherFigure = figures[ i ];
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
        if (i < index && !otherFigure.off && !figures.some((figure) => figure.active)) {
          this.turn(otherFigure);
        } else if (i > index && (!(otherFigure instanceof Monster) || (otherFigure instanceof Monster && otherFigure.entities.length > 0))) {
          if (!otherFigure.off && i > index && !figures.some((figure, activeIndex) => figure.active && activeIndex < i)) {
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
      if (figure.entities.every((monsterEntity) => !monsterEntity.off)) {
        figure.entities.forEach((monsterEntity) => {
          monsterEntity.active = true;
        });
      }
    }

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

      if (figure instanceof Character) {
        for (let summon of figure.summons) {
          if (summon.state == SummonState.new) {
            summon.state = SummonState.true;
          }
        }
      } else if (figure instanceof Monster) {
        figure.entities.forEach((monsterEntity) => {
          if (monsterEntity.summon == SummonState.new) {
            monsterEntity.summon = SummonState.true;
          }
        })
      }
    }
  }

  permanentDead(figure: Figure): boolean {
    return ((figure instanceof Character || figure instanceof Objective) && (figure.exhausted || figure.health <= 0)) || (figure instanceof Monster && figure.entities.every((monsterEntity) => monsterEntity.dead || monsterEntity.health <= 0));
  }

  resetRound() {
    this.game.playSeconds = 0;
    this.game.sections = [];
    this.game.round = 0;
    this.game.state = GameState.draw;
    this.game.monsterAttackModifierDeck = new AttackModifierDeck();
    this.game.figures = this.game.figures.filter((figure) => figure instanceof Character);

    this.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        figure.health = figure.maxHealth;
        figure.loot = 0;
        figure.experience = 0;
        figure.entityConditions = [];
        figure.summons = [];
        figure.initiative = 0;
        figure.active = false;
        figure.off = false;
        figure.exhausted = false;

        figure.availableSummons.filter((summonData) => summonData.special).forEach((summonData) => gameManager.characterManager.createSpecialSummon(figure, summonData));

        figure.attackModifierDeck = gameManager.attackModifierManager.buildCharacterAttackModifierDeck(figure);
      }
    })

    gameManager.uiChange.emit();
  }
}