import { NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsNumberInput } from 'src/app/ui/helper/number-input/number-input';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { ghsValueSign } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';

@Component({
  imports: [NgClass, GhsLabelDirective, TabClickDirective, GhsRangePipe, GhsNumberInput],
  selector: 'ghs-level-dialog',
  templateUrl: './level-dialog.html',
  styleUrls: ['./level-dialog.scss']
})
export class LevelDialogComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  trap: number = 0;
  experience: number = 0;
  loot: number = 0;
  hazardousTerrain: number = 0;
  scenarioLevel: number = 0;
  wealthFavor: number = 0;

  levels: number[] = [0, 1, 2, 3, 4, 5, 6, 7];

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.calculateValues());
  }

  ngOnInit(): void {
    this.calculateValues();
  }

  setLevelCalculation(levelCalculation: boolean) {
    gameManager.stateManager.before(levelCalculation ? 'enableAutomaticLevel' : 'disableAutomaticLevel');
    gameManager.levelManager.setLevelCalculation(levelCalculation);
    gameManager.stateManager.after();
  }

  setLevelAdjustment(levelAdjustment: number) {
    gameManager.stateManager.before('updateLevelAdjustment', ghsValueSign(levelAdjustment));
    gameManager.levelManager.setLevelAdjustment(levelAdjustment);
    gameManager.stateManager.after();
  }

  setBbMonsterDifficutly(level: number) {
    if (!gameManager.levelManager.canSetBbMonsterDifficulty(level)) {
      return;
    }
    gameManager.stateManager.before('updateLevelAdjustmentBb', level);
    gameManager.levelManager.setBbMonsterDifficulty(level);
    gameManager.stateManager.after();
  }

  setBonusAdjustment(bonusAdjustment: number) {
    gameManager.stateManager.before('updateBonusAdjustment', ghsValueSign(bonusAdjustment));
    gameManager.levelManager.setBonusAdjustment(bonusAdjustment);
    gameManager.stateManager.after();
  }

  setGe5Player(ge5Player: boolean) {
    gameManager.stateManager.before(ge5Player ? 'enabledGe5Player' : 'disabledGe5Player');
    gameManager.levelManager.setGe5Player(ge5Player);
    gameManager.stateManager.after();
  }

  setGe5PlayerCapped(ge5PlayerCapped: boolean) {
    gameManager.stateManager.before(ge5PlayerCapped ? 'enabledGe5Player.capped' : 'disabledGe5Player.capped');
    gameManager.levelManager.setGe5PlayerCapped(ge5PlayerCapped);
    gameManager.stateManager.after();
  }

  ge5Player(): boolean {
    return gameManager.game.playerCount < 1 && gameManager.characterManager.characterCount() > 4;
  }

  togglePlayerCount(event: any) {
    gameManager.stateManager.before(event.target.checked ? 'enabledManualPlayerCount' : 'disabledManualPlayerCount');
    gameManager.levelManager.setPlayerCount(event.target.checked ? 2 : -1);
    gameManager.stateManager.after();
  }

  setPlayerCount(playerCount: number) {
    if (!gameManager.levelManager.canSetPlayerCount(playerCount)) {
      return;
    }
    gameManager.stateManager.before('updateManualPlayerCount', playerCount);
    gameManager.levelManager.setPlayerCount(playerCount);
    gameManager.stateManager.after();
  }

  setLevel(level: number) {
    if (!gameManager.levelManager.canSetManualLevel(level)) {
      return;
    }
    gameManager.stateManager.before('setScenarioLevel', level);
    gameManager.levelManager.setManualLevel(level);
    gameManager.stateManager.after();
  }

  setSolo(solo: boolean) {
    gameManager.stateManager.before(solo ? 'enableSolo' : 'disableSolo');
    gameManager.levelManager.setSolo(solo);
    gameManager.stateManager.after();
  }

  calculateValues() {
    this.trap = gameManager.levelManager.trap();
    this.experience = gameManager.levelManager.experience();
    this.loot = gameManager.levelManager.loot();
    this.hazardousTerrain = gameManager.levelManager.terrain();
    this.scenarioLevel = gameManager.levelManager.scenarioLevel();
    this.wealthFavor = gameManager.trialsManager.activeFavor('fh', 'wealth');

    if (this.wealthFavor) {
      this.loot += this.wealthFavor;
    }
  }
}
