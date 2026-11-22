import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { Game } from 'src/app/game/model/Game';

export class BattleGoalManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  setBattleGoalEdition(edition: string, value: boolean) {
    this.game.battleGoalEditions = this.game.battleGoalEditions || [];
    this.game.filteredBattleGoals = this.game.filteredBattleGoals || [];
    if (this.game.battleGoalEditions.includes(edition) === value) {
      return;
    }
    if (value) {
      this.game.battleGoalEditions.push(edition);
    } else {
      this.game.battleGoalEditions = this.game.battleGoalEditions.filter((other) => other !== edition);
      this.game.filteredBattleGoals = this.game.filteredBattleGoals.filter((other) => other.edition !== edition);
    }
  }

  battleGoalFiltered(edition: string, name: string): boolean {
    return (this.game.filteredBattleGoals || []).some((identifier) => identifier.edition === edition && identifier.name === name);
  }

  setBattleGoalFilter(edition: string, name: string, value: boolean) {
    this.game.filteredBattleGoals = this.game.filteredBattleGoals || [];
    if (this.battleGoalFiltered(edition, name) === value) {
      return;
    }
    if (value) {
      this.game.filteredBattleGoals.push(new Identifier(name, edition));
    } else {
      this.game.filteredBattleGoals = this.game.filteredBattleGoals.filter(
        (identifier) => identifier.edition !== edition || identifier.name !== name
      );
    }
  }

  getBattleGoalEditions(): string[] {
    return gameManager.editionData
      .filter(
        (editionData) =>
          settingsManager.settings.editions.includes(editionData.edition) && editionData.battleGoals && editionData.battleGoals.length > 0
      )
      .map((editionData) => editionData.edition);
  }

  getBattleGoals(filtered: boolean = true, aliases: boolean = false): BattleGoal[] {
    const edition = gameManager.game.edition;
    return gameManager.editionData
      .filter(
        (editionData) =>
          settingsManager.settings.editions.includes(editionData.edition) &&
          ((gameManager.game.edition && gameManager.editionRules(editionData.edition)) ||
            gameManager.game.battleGoalEditions.includes(editionData.edition))
      )
      .flatMap((editionData) =>
        editionData.battleGoals.filter(
          (battleGoal) =>
            !filtered ||
            !this.game.filteredBattleGoals ||
            this.game.filteredBattleGoals.length === 0 ||
            !this.game.filteredBattleGoals.find(
              (identifier) => battleGoal.edition === identifier.edition && battleGoal.name === identifier.name
            )
        )
      )
      .filter(
        (battleGoal, index, self) =>
          aliases ||
          (!battleGoal.alias && (!edition || battleGoal.edition === edition)) ||
          !self.find(
            (other) =>
              (battleGoal.alias &&
                other.edition === battleGoal.alias.edition &&
                other.name === battleGoal.alias.name &&
                (!edition || battleGoal.edition !== edition)) ||
              (other.edition === edition &&
                other.alias &&
                battleGoal.edition === other.alias.edition &&
                battleGoal.name === other.alias.name)
          )
      )
      .sort((a, b) => {
        if (a.edition === b.edition) {
          return a.cardId < b.cardId ? -1 : 1;
        } else if (edition) {
          if (a.edition === edition) {
            return -1;
          } else if (b.edition === edition) {
            return 1;
          }
        }
        return a.edition < b.edition ? -1 : 1;
      });
  }

  getUnrevealedBattleGoals(characterFilter: Character | undefined = undefined): BattleGoal[] {
    return this.getBattleGoals().filter(
      (battleGoal) =>
        !this.game.figures.find(
          (figure) =>
            figure instanceof Character &&
            (!characterFilter || figure !== characterFilter) &&
            figure.battleGoals &&
            figure.battleGoals.find((identifier) => battleGoal.edition === identifier.edition && battleGoal.name === identifier.name)
        )
    );
  }

  getBattleGoalsForEdition(edition: string): BattleGoal[] {
    return gameManager.editionData
      .filter(
        (editionData) =>
          settingsManager.settings.editions.includes(editionData.edition) && gameManager.isEditionRelevant(editionData.edition, edition)
      )
      .flatMap((editionData) => editionData.battleGoals);
  }

  getBattleGoal(identifier: Identifier): BattleGoal | undefined {
    return this.getBattleGoals(undefined, true).find(
      (battleGoal) => battleGoal.edition === identifier.edition && battleGoal.name === identifier.name
    );
  }

  drawBattleGoals(character: Character) {
    character.battleGoals = [];
    character.battleGoal = false;
    this.drawBattleGoal(character);
    if (!gameManager.trialsManager.apply || !gameManager.trialsManager.activeTrial('fh', 360)) {
      this.drawBattleGoal(character);
      if (gameManager.fhRules(true) || settingsManager.settings.battleGoalsFh) {
        this.drawBattleGoal(character);
      }
    }
  }

  drawAdditionalBattleGoal(character: Character) {
    this.drawBattleGoal(character, gameManager.trialsManager.characterTrial(character, '356'));
  }

  drawBattleGoal(character: Character, splice: boolean = false) {
    let battleGoals = this.getUnrevealedBattleGoals();

    if (gameManager.trialsManager.apply && gameManager.trialsManager.activeTrial('fh', 360)) {
      battleGoals = battleGoals.filter((battleGoal) => battleGoal.checks === 2);
    }

    if (battleGoals.length) {
      const battleGoal = battleGoals[gameManager.randomManager.int(battleGoals.length)];
      character.battleGoals = character.battleGoals || [];
      if (splice && character.battleGoals.length > 2) {
        character.battleGoals.splice(character.battleGoals.length - 2, 0, new Identifier(battleGoal.name, battleGoal.edition));
      } else {
        character.battleGoals.push(new Identifier(battleGoal.name, battleGoal.edition));
      }
    }
  }
}
