import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BattleGoal } from 'src/app/game/model/data/BattleGoal';
import { BattleGoalComponent } from 'src/app/ui/figures/battlegoal/battlegoal';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [BattleGoalComponent, GhsLabelDirective, NgClass, TrackUUIDPipe],
  selector: 'ghs-battlegoal-setup',
  templateUrl: './battlegoal-setup.html',
  styleUrls: ['./battlegoal-setup.scss']
})
export class BattleGoalSetupDialog {
  gameManager: GameManager = gameManager;
  currentEdition: string = '';
  editions: string[] = [];
  battleGoals: BattleGoal[] = [];

  constructor() {
    this.editions = gameManager.battleGoalManager.getBattleGoalEditions();
    if (
      gameManager.game.edition &&
      gameManager.battleGoalManager.getBattleGoalEditions().includes(gameManager.game.edition) &&
      (!gameManager.game.battleGoalEditions ||
        gameManager.game.battleGoalEditions.length === 0 ||
        (gameManager.game.battleGoalEditions.length === 1 && gameManager.game.battleGoalEditions.includes(gameManager.game.edition)))
    ) {
      this.selectEdition(gameManager.game.edition);
    }
    this.update();
  }

  selectedAlias(battleGoal: BattleGoal): boolean {
    const edition = gameManager.game.edition;
    return (
      (battleGoal.alias &&
        (!edition || battleGoal.edition !== edition) &&
        gameManager.battleGoalManager
          .getBattleGoals(true, true)
          .find((other) => battleGoal.alias && other.edition === battleGoal.alias.edition && other.name === battleGoal.alias.name) !=
          undefined) ||
      (edition &&
        battleGoal.edition !== edition &&
        gameManager.battleGoalManager
          .getBattleGoals(true, true)
          .find(
            (other) =>
              other.edition === edition && other.alias && battleGoal.edition === other.alias.edition && battleGoal.name === other.alias.name
          ) !== undefined) ||
      false
    );
  }

  selectEdition(edition: string = '') {
    this.currentEdition = edition;
    this.update();
  }

  update() {
    if (this.currentEdition) {
      this.battleGoals = gameManager.battleGoalManager.getBattleGoalsForEdition(this.currentEdition);
    } else {
      this.battleGoals = gameManager.battleGoalManager.getBattleGoals(false, true);
    }
  }

  toggleEdition(edition: string) {
    if (!gameManager.editionRules(edition, false)) {
      const add = !(gameManager.game.battleGoalEditions || []).includes(edition);
      gameManager.stateManager.before('battleGoals.setup.' + (add ? 'addEdition' : 'removeEdition'), edition);
      gameManager.battleGoalManager.setBattleGoalEdition(edition, add);
      gameManager.stateManager.after();
      this.update();
    }
  }

  selected(battleGoal: BattleGoal): boolean {
    return (
      !this.filtered(battleGoal) &&
      (battleGoal.edition === gameManager.game.edition || gameManager.game.battleGoalEditions.includes(battleGoal.edition))
    );
  }

  filtered(battleGoal: BattleGoal): boolean {
    return gameManager.battleGoalManager.battleGoalFiltered(battleGoal.edition, battleGoal.name);
  }

  toggleFilter(battleGoal: BattleGoal) {
    gameManager.stateManager.before(
      'battleGoals.setup.filter.' + (this.filtered(battleGoal) ? 'addCard' : 'removeCard'),
      battleGoal.edition,
      battleGoal.name
    );
    if (this.filtered(battleGoal)) {
      gameManager.battleGoalManager.setBattleGoalFilter(battleGoal.edition, battleGoal.name, false);
    } else if (this.selected(battleGoal) && !this.selectedAlias(battleGoal)) {
      gameManager.battleGoalManager.setBattleGoalFilter(battleGoal.edition, battleGoal.name, true);
    }
    gameManager.stateManager.after();
    this.update();
  }
}
