import { Character } from "../model/Character";
import { Game } from "../model/Game";
import { BattleGoal } from "../model/data/BattleGoal";
import { Identifier } from "../model/data/Identifier";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class BattleGoalManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  getBattleGoalEditions(): string[] {
    return gameManager.editionData.filter((editionData) => settingsManager.settings.editions.indexOf(editionData.edition) != -1 && editionData.battleGoals && editionData.battleGoals.length > 0).map((editionData) => editionData.edition);
  }

  getBattleGoals(filtered: boolean = true, aliases: boolean = false): BattleGoal[] {
    return gameManager.editionData.filter((editionData) => settingsManager.settings.editions.indexOf(editionData.edition) != -1 && (gameManager.game.edition && gameManager.editionRules(editionData.edition) || gameManager.game.battleGoalEditions.indexOf(editionData.edition) != -1)).flatMap((editionData) => editionData.battleGoals.filter((battleGoal) => !filtered || !this.game.filteredBattleGoals || this.game.filteredBattleGoals.length == 0 || !this.game.filteredBattleGoals.find((identifier) => battleGoal.edition == identifier.edition && battleGoal.name == identifier.name))).filter((battleGoal, index, self) => aliases || !battleGoal.alias || !self.find((other) => battleGoal.alias && other.edition == battleGoal.alias.edition && other.name == battleGoal.alias.name));
  }

  getUnrevealedBattleGoals(characterFilter: Character | undefined = undefined): BattleGoal[] {
    return this.getBattleGoals().filter((battleGoal) => !this.game.figures.find((figure) => figure instanceof Character && (!characterFilter || figure != characterFilter) && figure.battleGoals && figure.battleGoals.find((identifier) => battleGoal.edition == identifier.edition && battleGoal.name == identifier.name)));
  }

  getBattleGoalsForEdition(edition: string): BattleGoal[] {
    return gameManager.editionData.filter((editionData) => editionData.edition == edition || gameManager.editionExtensions(edition).indexOf(edition) != -1).flatMap((editionData) => editionData.battleGoals);
  }

  getBattleGoal(identifier: Identifier): BattleGoal | undefined {
    return this.getBattleGoals(undefined, true).find((battleGoal) => battleGoal.edition == identifier.edition && battleGoal.name == identifier.name);
  }

  drawBattleGoal(character: Character, splice: boolean = false) {
    let battleGoals = this.getUnrevealedBattleGoals();

    if (gameManager.trialsManager.apply && gameManager.trialsManager.activeTrial('fh', 360)) {
      battleGoals = battleGoals.filter((battleGoal) => battleGoal.checks == 2);
    }

    if (battleGoals.length) {
      let battleGoal = battleGoals[Math.floor(Math.random() * battleGoals.length)];
      character.battleGoals = character.battleGoals || [];
      if (splice && character.battleGoals.length > 2) {
        character.battleGoals.splice(character.battleGoals.length - 2, 0, new Identifier(battleGoal.name, battleGoal.edition));
      } else {
        character.battleGoals.push(new Identifier(battleGoal.name, battleGoal.edition));
      }
    }
  }

}
