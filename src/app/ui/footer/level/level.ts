import { Dialog } from '@angular/cdk/dialog';
import { ConnectionPositionPair, Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { ghsValueSign } from '../../helper/Static';

@Component({
  selector: 'ghs-level',
  templateUrl: './level.html',
  styleUrls: [ './level.scss' ]
})
export class LevelComponent {

  @ViewChild('levelButton') levelButton!: ElementRef;

  gameManager: GameManager = gameManager;
  trap: number = 0;
  experience: number = 0;
  loot: number = 0;
  terrain: number = 0;
  hazardousTerrain: number = 0;

  constructor(private dialog: Dialog, private overlay: Overlay) {
    gameManager.uiChange.subscribe({
      next: () => {
        this.calculateValues();
      }
    })
  }


  open(event: any) {

    const positions = [
      new ConnectionPositionPair(
        { originX: 'center', originY: 'top' },
        { overlayX: 'center', overlayY: 'bottom' }),
      new ConnectionPositionPair(
        { originX: 'start', originY: 'top' },
        { overlayX: 'start', overlayY: 'bottom' }),
      new ConnectionPositionPair(
        { originX: 'end', originY: 'top' },
        { overlayX: 'end', overlayY: 'bottom' }) ];

    this.dialog.open(LevelDialogComponent, {
      panelClass: 'dialog',
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.levelButton).withPositions(positions).withDefaultOffsetY(-10)
    });
  }

  calculateValues() {
    this.trap = gameManager.levelManager.trap();
    this.experience = gameManager.levelManager.experience();
    this.loot = gameManager.levelManager.loot();
    this.terrain = Math.floor(this.trap / 2);
    this.hazardousTerrain = gameManager.levelManager.terrain();
  }

}


@Component({
  selector: 'ghs-level-dialog',
  templateUrl: './level-dialog.html',
  styleUrls: [ './level-dialog.scss' ]
})
export class LevelDialogComponent {

  gameManager: GameManager = gameManager;
  levels: number[] = [ 0, 1, 2, 3, 4, 5, 6, 7 ];

  setLevelCalculation(levelCalculation: boolean) {
    gameManager.stateManager.before(levelCalculation ? "enableAutomaticLevel" : "disabledAutomaticLevel");
    gameManager.game.levelCalculation = levelCalculation;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setLevelAdjustment(levelAdjustment: number) {
    gameManager.stateManager.before("updateLevelAdjustment", ghsValueSign(levelAdjustment));
    gameManager.game.levelAdjustment = levelAdjustment;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setBonusAdjustment(bonusAdjustment: number) {
    gameManager.stateManager.before("updateBonusAdjustment", ghsValueSign(bonusAdjustment));
    gameManager.game.bonusAdjustment = bonusAdjustment;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  setGe5Player(ge5Player: boolean) {
    gameManager.stateManager.before(ge5Player ? "enabledGe5Player" : "disabledGe5Player");
    gameManager.game.ge5Player = ge5Player;
    gameManager.levelManager.calculateScenarioLevel();
    gameManager.stateManager.after();
  }

  ge5Player(): boolean {
    return gameManager.game.figures.filter((figure) => figure instanceof Character).length > 4;
  }

  setLevel(level: number) {
    gameManager.stateManager.before("setScenarioLevel", "" + level);
    gameManager.levelManager.setLevel(level);
    gameManager.game.levelCalculation = false;
    gameManager.stateManager.after();
  }

  setSolo(solo: boolean) {
    gameManager.stateManager.before(solo ? "enableSolo" : "disableSolo");
    gameManager.game.solo = solo;
    gameManager.stateManager.after();
  }

}

