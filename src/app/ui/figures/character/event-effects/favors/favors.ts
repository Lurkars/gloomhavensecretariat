import { DialogRef } from '@angular/cdk/dialog';
import { Component, HostListener, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager, SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { Favor } from 'src/app/game/model/data/Trials';

@Component({
  standalone: false,
  selector: 'ghs-favors',
  templateUrl: './favors.html',
  styleUrls: ['./favors.scss'],
})
export class FavorsComponent implements OnInit {

  favors: Favor[] = [];
  activeFavors: number[] = [];
  availablePoints: number = 0;
  spentPoints: number = 0;
  leftPoints: number[] = [];

  gameFavors: Identifier[] = [];
  gameFavorPoints: number[] = [];
  change: boolean = false;
  disabled: boolean = false;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  constructor(public dialogRef: DialogRef) { }

  ngOnInit(): void {
    const editionData = gameManager.editionData.find((editionData) => editionData.edition == gameManager.currentEdition() && editionData.favors);
    if (editionData) {
      this.favors = editionData.favors;
    }
    this.gameFavors = gameManager.game.favors.map((value) => new Identifier(value.name, value.edition));
    this.gameFavorPoints = gameManager.game.favorPoints.map((number) => +number);
    this.update(false);
  }

  update(change: boolean = true) {
    this.change = change;
    this.disabled = !gameManager.roundManager.firstRound;
    this.activeFavors = [];
    this.favors.forEach((favor, index) => {
      this.activeFavors[index] = this.gameFavors.filter((value) => value.edition == favor.edition && value.name == favor.name).length;
    })

    this.spentPoints = this.activeFavors.length ? this.activeFavors.map((count, index) => count * this.favors[index].points).reduce((a, b) => a + b) : 0;

    this.availablePoints = Math.min(Math.max((this.gameFavorPoints.length ? this.gameFavorPoints.reduce((a, b) => a + b) : 0)
      - this.spentPoints, 0), 7);

    this.leftPoints = gameManager.game.monsterAttackModifierDeck.cards.filter((am) => am.type == AttackModifierType.minus1 || am.type == AttackModifierType.minus2).map((am) => am.type == AttackModifierType.minus1 ? 1 : 2);

    this.gameFavorPoints.forEach((point) => {
      this.leftPoints.splice(this.leftPoints.indexOf(point), 1);
    })
  }

  toggleKeep() {
    gameManager.stateManager.before(gameManager.game.keepFavors ? 'favorKeepOff' : 'favorKeepOn');
    gameManager.game.keepFavors = !gameManager.game.keepFavors;
    gameManager.stateManager.after();
  }

  addSpentPoints(points: number, force: boolean = false) {
    if (!this.disabled && this.leftPoints.indexOf(points) != -1 && (!this.gameFavorPoints.length || this.gameFavorPoints.reduce((a, b) => a + b) + points <= 7) || force) {
      this.gameFavorPoints.push(points);
      this.update();
    }
  }

  unspentPoints(index: number, force: boolean = false) {

    if (!this.disabled && this.gameFavorPoints.reduce((a, b) => a + b) - this.gameFavorPoints[index] >= this.spentPoints || force) {
      this.gameFavorPoints.splice(index, 1);
      this.update();
    }
  }

  selectFavor(favor: Favor, force: boolean = false) {
    if (!this.disabled && this.availablePoints >= favor.points || force) {
      this.gameFavors.push(new Identifier(favor.name, favor.edition));
      this.update();
    }
  }

  unselectFavor(favor: Favor, force: boolean = false) {
    const identifier = this.gameFavors.find((value) => value.edition == favor.edition && value.name == favor.name);
    if (identifier && (!this.disabled || force)) {
      this.gameFavors.splice(this.gameFavors.indexOf(identifier), 1);
      this.update();
    }
  }

  close() {
    this.dialogRef.close();
  }

  apply(): void {
    if (this.change) {
      gameManager.stateManager.before('applyFavorSelection');

      while (this.availablePoints) {
        if (this.availablePoints > 2 && this.gameFavorPoints.indexOf(2) != -1) {
          this.gameFavorPoints.splice(this.gameFavorPoints.indexOf(2), 1);
          this.availablePoints -= 2;
        } else {
          this.gameFavorPoints.splice(this.gameFavorPoints.indexOf(1), 1);
          this.availablePoints--;
        }
      }

      gameManager.game.favors = this.gameFavors;
      gameManager.game.favorPoints = this.gameFavorPoints;
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