import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Game, GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { deckMove } from 'src/app/game/util/deck';

export class MonsterAbilityManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  resetMonsterAbilities(monster: Monster) {
    if (!this.applySameDeck(monster)) {
      if (!monster.abilities || monster.abilities.length === 0) {
        const abilityCards = gameManager.editionManager.abilityCards(monster);
        monster.abilities = abilityCards
          .map((abilityCard) => abilityCards.indexOf(abilityCard))
          .filter(
            (i) => !abilityCards[i].level || isNaN(+abilityCards[i].level) || EntityValueFunction(abilityCards[i].level) <= monster.level
          );
      }
      this.shuffleAbilities(monster);
    }
  }

  moveAbility(monster: Monster, fromList: string, fromIndex: number, toList: string, toIndex: number) {
    monster.ability = deckMove(monster.ability, fromList, fromIndex, toList, toIndex, monster.abilities, monster.revealedAbilities).current;
    const sameDeckMonster = this.getSameDeckMonster(monster);
    if (sameDeckMonster) {
      this.applySameDeck(sameDeckMonster);
    }
    gameManager.roundManager.sortFigures();
  }

  getSameDeckMonster(monster: Monster): Monster | undefined {
    return this.game.figures.find(
      (figure) =>
        figure instanceof Monster &&
        (figure.name !== monster.name || figure.edition !== monster.edition) &&
        gameManager.editionManager.deckData(figure).name === gameManager.editionManager.deckData(monster).name &&
        gameManager.editionManager.deckData(figure).edition === gameManager.editionManager.deckData(monster).edition &&
        !figure.drawExtra
    ) as Monster | undefined;
  }

  canSetDrawExtra(monster: Monster, drawExtra: boolean): boolean {
    return typeof drawExtra === 'boolean' && monster.drawExtra !== drawExtra && (!drawExtra || !!this.getSameDeckMonster(monster));
  }

  setDrawExtra(monster: Monster, drawExtra: boolean): boolean {
    if (!this.canSetDrawExtra(monster, drawExtra)) {
      return false;
    }
    if (!drawExtra) {
      monster.drawExtra = false;
      this.applySameDeck(monster);
      return true;
    }
    this.applySameDeck(monster);
    monster.drawExtra = true;
    if (this.game.state === GameState.next) {
      this.drawExtra(monster);
    }
    gameManager.roundManager.sortFigures();
    return true;
  }

  applySameDeck(monster: Monster): boolean {
    const sameDeckMonster = this.getSameDeckMonster(monster);

    if (sameDeckMonster) {
      monster.abilities = JSON.parse(JSON.stringify(sameDeckMonster.abilities));
      monster.ability = sameDeckMonster.ability;
      monster.lastDraw = this.game.round;

      if (monster.drawExtra) {
        this.drawExtra(monster);
      }

      return true;
    }
    return false;
  }

  drawExtra(monster: Monster) {
    if (monster.drawExtra) {
      monster.ability = -1;
      const sameDeckMonster = this.getSameDeckMonster(monster);
      if (!sameDeckMonster) {
        console.error("Draw extra for '" + monster.name + "' (" + monster.deck + ' not possible, not same deck monster found!');
        monster.drawExtra = false;
        return;
      }

      monster.ability =
        sameDeckMonster.ability +
        1 +
        this.game.figures.filter(
          (figure) =>
            figure instanceof Monster &&
            (figure.name !== monster.name || figure.edition !== monster.edition) &&
            gameManager.editionManager.deckData(figure).name === gameManager.editionManager.deckData(monster).name &&
            gameManager.editionManager.deckData(figure).edition === gameManager.editionManager.deckData(monster).edition &&
            figure.drawExtra &&
            figure.ability > sameDeckMonster.ability
        ).length;

      if (monster.ability >= monster.abilities.length) {
        this.shuffleAbilities(monster);
      }
      monster.lastDraw = this.game.round;
    } else {
      this.applySameDeck(monster);
    }
  }

  removeAbility(monster: Monster, index: number) {
    const deckData = gameManager.editionManager.deckData(monster);
    this.game.figures
      .filter((figure) => {
        if (figure instanceof Monster) {
          const otherDeckData = gameManager.editionManager.deckData(figure);
          return deckData.name === otherDeckData.name && deckData.edition === otherDeckData.edition;
        }
        return false;
      })
      .map((figure) => figure as Monster)
      .forEach((sameDeckMonster) => {
        sameDeckMonster.abilities.splice(index, 1);
      });
  }

  restoreAbility(monster: Monster, abilityCard: AbilityCard) {
    const deckData = gameManager.editionManager.deckData(monster);
    this.game.figures
      .filter((figure) => {
        if (figure instanceof Monster) {
          const otherDeckData = gameManager.editionManager.deckData(figure);
          return deckData.name === otherDeckData.name && deckData.edition === otherDeckData.edition;
        }
        return false;
      })
      .map((figure) => figure as Monster)
      .forEach((sameDeckMonster) => {
        sameDeckMonster.abilities.unshift(deckData.abilities.indexOf(abilityCard));
      });
  }

  restoreDefaultAbilities(monster: Monster) {
    const deckData = gameManager.editionManager.deckData(monster);
    this.game.figures
      .filter((figure) => {
        if (figure instanceof Monster) {
          const otherDeckData = gameManager.editionManager.deckData(figure);
          return deckData.name === otherDeckData.name && deckData.edition === otherDeckData.edition;
        }
        return false;
      })
      .map((figure) => figure as Monster)
      .forEach((sameDeckMonster) => {
        sameDeckMonster.abilities = deckData.abilities
          .map((a, index) => index)
          .filter(
            (i) =>
              !deckData.abilities[i].level ||
              isNaN(+deckData.abilities[i].level) ||
              EntityValueFunction(deckData.abilities[i].level) <= monster.level
          );
        sameDeckMonster.ability = -1;
      });
  }

  shuffleAbilities(monster: Monster, onlyUpcoming: boolean = false) {
    if (!onlyUpcoming) {
      if (this.game.state === GameState.draw || monster.entities.length === 0) {
        monster.ability = -1;
      } else {
        monster.ability = 0;
      }
    }

    if (monster.drawExtra) {
      const sameDeckMonster = this.getSameDeckMonster(monster);
      if (!sameDeckMonster) {
        console.error("Shuffle for '" + monster.name + "' (" + monster.deck + ' not possible, not same deck monster found!');
        monster.drawExtra = false;
        this.shuffleAbilities(monster, onlyUpcoming);
        return;
      }
      this.shuffleAbilities(sameDeckMonster, onlyUpcoming);
      return;
    }

    const deckData = gameManager.editionManager.deckData(monster);
    const sameDeckMonsters = this.game.figures
      .filter((figure) => {
        if (figure instanceof Monster) {
          const otherDeckData = gameManager.editionManager.deckData(figure);
          return deckData.name === otherDeckData.name && deckData.edition === otherDeckData.edition;
        }
        return false;
      })
      .map((figure) => figure as Monster);

    const restoreCards: number[] =
      onlyUpcoming && monster.ability > -1
        ? monster.abilities.splice(0, monster.ability + 1 + sameDeckMonsters.filter((monster) => monster.drawExtra).length)
        : [];

    gameManager.randomManager.shuffle(monster.abilities);

    if (onlyUpcoming) {
      monster.abilities.unshift(...restoreCards);
    }

    monster.revealedAbilities = [];
    deckData.abilities.forEach((a) => (a.revealed = false));

    sameDeckMonsters.forEach((sameDeckMonster) => {
      sameDeckMonster.abilities = JSON.parse(JSON.stringify(monster.abilities));
      sameDeckMonster.revealedAbilities = [];
      if (this.game.state === GameState.draw) {
        sameDeckMonster.ability = -1;
      } else {
        sameDeckMonster.ability = monster.ability;

        if (sameDeckMonster.drawExtra) {
          this.drawExtra(sameDeckMonster);
        }
      }
    });
  }

  drawAbility(monster: Monster) {
    if (monster.drawExtra) {
      const sameDeckMonster = this.getSameDeckMonster(monster);
      if (!sameDeckMonster) {
        console.error("Draw for '" + monster.name + "' (" + monster.deck + ' not possible, not same deck monster found!');
        monster.drawExtra = false;
        this.drawAbility(monster);
        return;
      }
      this.drawAbility(sameDeckMonster);
      return;
    }

    monster.ability += 1;

    if (this.hasBottomActions(monster)) {
      monster.ability += 1;
    }

    const deckData = gameManager.editionManager.deckData(monster);
    this.game.figures.forEach((figure) => {
      if (
        figure instanceof Monster &&
        figure !== monster &&
        gameManager.editionManager.deckData(figure).name === deckData.name &&
        gameManager.editionManager.deckData(figure).edition === deckData.edition
      ) {
        figure.ability = monster.ability;

        if (figure.drawExtra) {
          this.drawExtra(figure);
        }
      }
    });
  }

  rpgSameDeck(monster: Monster): Monster[] {
    const deckData = gameManager.editionManager.deckData(monster);
    return this.game.figures.filter((figure) => {
      if (figure instanceof Monster) {
        const otherDeckData = gameManager.editionManager.deckData(figure);
        return deckData.name === otherDeckData.name && deckData.edition === otherDeckData.edition;
      }
      return false;
    }) as Monster[];
  }

  drawnAbilities(monster: Monster): number {
    let drawn = 0;
    if (monster.ability >= 0) {
      drawn = monster.ability + 1;
    }
    let other = this.game.figures.find(
      (figure) =>
        figure instanceof Monster &&
        (figure.name !== monster.name || figure.edition !== monster.edition) &&
        gameManager.editionManager.deckData(figure).name === gameManager.editionManager.deckData(monster).name &&
        gameManager.editionManager.deckData(figure).edition === gameManager.editionManager.deckData(monster).edition &&
        figure.ability >= drawn
    );
    while (other instanceof Monster) {
      drawn = other.ability + 1;
      other = this.game.figures.find(
        (figure) =>
          figure instanceof Monster &&
          (figure.name !== monster.name || figure.edition !== monster.edition) &&
          gameManager.editionManager.deckData(figure).name === gameManager.editionManager.deckData(monster).name &&
          gameManager.editionManager.deckData(figure).edition === gameManager.editionManager.deckData(monster).edition &&
          figure.ability >= drawn
      );
    }

    return drawn;
  }

  getAbilityCard(monster: Monster, bottom: boolean = false): AbilityCard | undefined {
    if (monster.ability < 0 || monster.ability >= monster.abilities.length || !settingsManager.settings.abilities) {
      return undefined;
    }

    const abilityCards = gameManager.editionManager.abilityCards(monster);

    if (!abilityCards) {
      return undefined;
    }

    return abilityCards[monster.abilities[monster.ability + (bottom ? (monster.ability > 0 ? -1 : 1) : 0)]];
  }

  hasBottomActions(monster: Monster): boolean {
    return (
      gameManager.editionManager.abilityCards(monster).length > 0 &&
      gameManager.editionManager.abilityCards(monster).every((abilityCard) => gameManager.editionManager.hasBottomAbility(abilityCard))
    );
  }
}
