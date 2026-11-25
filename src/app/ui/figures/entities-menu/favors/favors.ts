import { DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { Favor } from 'src/app/game/model/data/Trials';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, GhsLabelDirective, PointerInputDirective, GhsRangePipe, TrackUUIDPipe],
  selector: 'ghs-favors',
  templateUrl: './favors.html',
  styleUrls: ['./favors.scss']
})
export class FavorsComponent implements OnInit {
  dialogRef = inject(DialogRef);

  favors: Favor[] = [];
  activeFavors: number[] = [];
  availablePoints: number = 0;
  spentPoints: number = 0;
  leftPoints: number[] = [];

  gameFavors: Identifier[] = [];
  gameFavorPoints: number[] = [];
  change: boolean = false;
  forced: boolean = false;
  disabled: boolean = false;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  ngOnInit(): void {
    const editionData = gameManager.editionManager.editionData.find(
      (editionData) => editionData.edition === gameManager.editionManager.currentEdition() && editionData.favors
    );
    if (editionData) {
      this.favors = editionData.favors;
    }
    this.gameFavors = gameManager.game.favors.map((value) => new Identifier(value.name, value.edition));
    this.gameFavorPoints = gameManager.game.favorPoints.map((number) => +number);
    this.update(false);
  }

  update(change: boolean = true) {
    this.change = change;
    this.disabled = !gameManager.trialsManager.favorsEditable();
    this.activeFavors = [];
    this.favors.forEach((favor, index) => {
      this.activeFavors[index] = this.gameFavors.filter((value) => value.edition === favor.edition && value.name === favor.name).length;
    });
    this.spentPoints = gameManager.trialsManager.favorPointsSpent(this.gameFavors);
    this.availablePoints = gameManager.trialsManager.favorPointsAvailable(this.gameFavors, this.gameFavorPoints);
    this.leftPoints = gameManager.trialsManager.favorPointsLeft(this.gameFavorPoints);
  }

  toggleKeep() {
    gameManager.stateManager.before(gameManager.game.keepFavors ? 'favorKeepOff' : 'favorKeepOn');
    gameManager.trialsManager.setKeepFavors(!gameManager.game.keepFavors);
    gameManager.stateManager.after();
  }

  addSpentPoints(points: number, force: boolean = false) {
    if (gameManager.trialsManager.canAddFavorPoint(this.gameFavorPoints, points, force)) {
      this.forced = this.forced || force;
      this.gameFavorPoints.push(points);
      this.update();
    }
  }

  unspentPoints(index: number, force: boolean = false) {
    if (gameManager.trialsManager.canRemoveFavorPoint(this.gameFavors, this.gameFavorPoints, index, force)) {
      this.forced = this.forced || force;
      this.gameFavorPoints.splice(index, 1);
      this.update();
    }
  }

  selectFavor(favor: Favor, force: boolean = false) {
    if (gameManager.trialsManager.canSelectFavor(this.gameFavors, this.gameFavorPoints, favor, force)) {
      this.forced = this.forced || force;
      this.gameFavors.push(new Identifier(favor.name, favor.edition));
      this.update();
    }
  }

  unselectFavor(favor: Favor, force: boolean = false) {
    const identifier = this.gameFavors.find((value) => value.edition === favor.edition && value.name === favor.name);
    if (identifier && (!this.disabled || force)) {
      this.forced = this.forced || force;
      this.gameFavors.splice(this.gameFavors.indexOf(identifier), 1);
      this.update();
    }
  }

  close() {
    this.dialogRef.close();
  }

  apply(): void {
    if (this.change && gameManager.trialsManager.canApplyFavors(this.gameFavors, this.gameFavorPoints, this.forced)) {
      gameManager.stateManager.before('applyFavorSelection');

      gameManager.trialsManager.applyFavors(this.gameFavors, this.gameFavorPoints, this.forced);
      this.availablePoints = 0;
      gameManager.stateManager.after();
      this.dialogRef.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  confirm(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && event.key === 'Enter') {
      this.apply();
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
