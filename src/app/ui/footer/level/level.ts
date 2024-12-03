import { Dialog } from '@angular/cdk/dialog';
import { ConnectionPositionPair, Overlay } from '@angular/cdk/overlay';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { LevelDialogComponent } from './level-dialog';
import { Subscription } from 'rxjs';

@Component({
	standalone: false,
  selector: 'ghs-level',
  templateUrl: './level.html',
  styleUrls: ['./level.scss']
})
export class LevelComponent implements OnInit, OnDestroy {

  @ViewChild('levelButton') levelButton!: ElementRef;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  trap: number = 0;
  experience: number = 0;
  loot: number = 0;
  hazardousTerrain: number = 0;
  monsterDifficulty: number = 0;

  constructor(private dialog: Dialog, private overlay: Overlay) { }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.calculateValues();
      }
    });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  open() {
    const positions = [
      new ConnectionPositionPair(
        { originX: 'center', originY: 'top' },
        { overlayX: 'center', overlayY: 'bottom' }),
      new ConnectionPositionPair(
        { originX: 'start', originY: 'top' },
        { overlayX: 'start', overlayY: 'bottom' }),
      new ConnectionPositionPair(
        { originX: 'end', originY: 'top' },
        { overlayX: 'end', overlayY: 'bottom' })];

    this.dialog.open(LevelDialogComponent, {
      panelClass: ['dialog'],
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.levelButton).withPositions(positions).withDefaultOffsetY(-10)
    });
  }

  calculateValues() {
    this.trap = gameManager.levelManager.trap();
    this.experience = gameManager.levelManager.experience();
    this.loot = gameManager.levelManager.loot();
    this.hazardousTerrain = gameManager.levelManager.terrain();
    this.monsterDifficulty = gameManager.levelManager.bbMonsterDifficutly();

    if (gameManager.trialsManager.activeFavor('fh', 'wealth')) {
      this.loot += gameManager.trialsManager.activeFavor('fh', 'wealth');
    }
  }

}