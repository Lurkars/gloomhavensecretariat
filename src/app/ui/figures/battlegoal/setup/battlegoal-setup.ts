import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { BattleGoal } from "src/app/game/model/data/BattleGoal";
import { Identifier } from "src/app/game/model/data/Identifier";


@Component({
	standalone: false,
  selector: 'ghs-battlegoal-setup',
  templateUrl: './battlegoal-setup.html',
  styleUrls: ['./battlegoal-setup.scss']
})
export class BattleGoalSetupDialog {

  gameManager: GameManager = gameManager;
  currentEdition: string = "";
  editions: string[] = [];
  battleGoals: BattleGoal[] = [];

  constructor() {
    this.editions = gameManager.battleGoalManager.getBattleGoalEditions();
    if (gameManager.game.edition && gameManager.battleGoalManager.getBattleGoalEditions().indexOf(gameManager.game.edition) != -1 && (!gameManager.game.battleGoalEditions || gameManager.game.battleGoalEditions.length == 0 || gameManager.game.battleGoalEditions.length == 1 && gameManager.game.battleGoalEditions.indexOf(gameManager.game.edition) != -1)) {
      this.selectEdition(gameManager.game.edition);
    }
    this.update();
  }

  selectedAlias(battleGoal: BattleGoal): boolean {
    return battleGoal.alias && gameManager.battleGoalManager.getBattleGoals().find((other) => battleGoal.alias && other.edition == battleGoal.alias.edition && other.name == battleGoal.alias.name) != undefined || false;
  }

  selectEdition(edition: string = "") {
    this.currentEdition = edition;
    this.update();
  }

  update() {
    if (this.currentEdition) {
      this.battleGoals = gameManager.battleGoalManager.getBattleGoalsForEdition(this.currentEdition);
    } else {
      this.battleGoals = gameManager.battleGoalManager.getBattleGoals(false,true);
    }
  }

  toggleEdition(edition: string) {
    if (!gameManager.editionRules(edition, false)) {
      gameManager.game.battleGoalEditions = gameManager.game.battleGoalEditions || [];
      gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals || [];
      gameManager.stateManager.before("battleGoals.setup." + (gameManager.game.battleGoalEditions.indexOf(edition) == -1 ? "addEdition" : "removeEdition"), edition);
      if (gameManager.game.battleGoalEditions.indexOf(edition) == -1) {
        gameManager.game.battleGoalEditions.push(edition);
      } else {
        gameManager.game.battleGoalEditions = gameManager.game.battleGoalEditions.filter((other) => other != edition);
        gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals.filter((other) => other.edition != edition);
      }
      gameManager.stateManager.after();
      this.update();
    }
  }

  selected(battleGoal: BattleGoal): boolean {
    return !this.filtered(battleGoal) && (battleGoal.edition == gameManager.game.edition || gameManager.game.battleGoalEditions.indexOf(battleGoal.edition) != -1);
  }

  filtered(battleGoal: BattleGoal): boolean {
    return gameManager.game.filteredBattleGoals.find((identifier) => identifier.edition == battleGoal.edition && identifier.name == battleGoal.name) != undefined;
  }

  toggleFilter(battleGoal: BattleGoal) {
    gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals || []; gameManager.stateManager.before("battleGoals.setup.filter." + (this.filtered(battleGoal) ? "addCard" : "removeCard"), battleGoal.edition, battleGoal.name);
    if (this.filtered(battleGoal)) {
      gameManager.game.filteredBattleGoals = gameManager.game.filteredBattleGoals.filter((identifier) => identifier.edition != battleGoal.edition || identifier.name != battleGoal.name)
    } else if (this.selected(battleGoal) && !this.selectedAlias(battleGoal)) {
      gameManager.game.filteredBattleGoals.push(new Identifier(battleGoal.name, battleGoal.edition));
    }
    gameManager.stateManager.after();
    this.update();
  }
}