import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CharacterManager } from 'src/app/game/businesslogic/CharacterManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-initiative-dialog',
  templateUrl: 'initiative-dialog.html',
  styleUrls: ['./initiative-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterInitiativeDialogComponent {
  private dialogRef = inject(DialogRef);

  value: string = '__';

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  character: Character | undefined;
  objective: ObjectiveContainer | undefined;

  figure: Character | ObjectiveContainer = inject(DIALOG_DATA);

  constructor() {
    if (this.figure instanceof Character) {
      this.character = this.figure;
    } else if (this.figure instanceof ObjectiveContainer) {
      this.objective = this.figure;
    }
    this.dialogRef.closed.subscribe({
      next: () => {
        if (this.value.includes('_') && !isNaN(+this.value.replace('_', ''))) {
          this.updateInitiative(+this.value.replace('_', ''));
        }
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts) {
      if (event.key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
        this.pickNumber(+event.key);
        event.preventDefault();
        event.stopPropagation();
      } else if (event.key === 'Enter') {
        ghsDialogClosingHelper(this.dialogRef);
      }
    }
  }

  pickNumber(number: number) {
    this.value = (this.value + '' + number).substring(1, 3);
    if (!this.value.includes('_')) {
      this.updateInitiative(+this.value);
      ghsDialogClosingHelper(this.dialogRef);
    }
  }

  updateInitiative(initiative: number) {
    if (this.figure.initiative !== initiative) {
      gameManager.entityManager.before(this.character, this.figure, 'setInitiative', initiative > 0 && initiative < 100 ? initiative : 0);
      if (initiative > 0 && initiative < 100) {
        this.setInitiative(initiative);
        if (this.character && initiative !== 99 && (this.character.name !== 'prism' || !this.character.tags.includes('long_rest'))) {
          this.character.longRest = false;
        }
      } else if (gameManager.game.state === GameState.draw) {
        this.figure.initiative = 0;
      }
      if (gameManager.game.state === GameState.next) {
        gameManager.sortFigures(this.character);
      }
      gameManager.stateManager.after();
    }
  }

  setInitiative(initiative: number) {
    if (
      (((gameManager.game.state === GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0) ||
        initiative > 0) &&
      initiative < 100 &&
      initiative !== this.figure.initiative
    ) {
      this.figure.initiative = initiative;
      if (this.character) {
        this.character.initiativeVisible = true;
      }
    }
  }

  longRest() {
    if (this.character) {
      if (this.character.longRest) {
        gameManager.entityManager.before(this.character, this.character, 'setInitiative', this.character.initiative);
        this.character.longRest = false;
        gameManager.stateManager.after();
      } else {
        gameManager.stateManager.before('characterLongRest', gameManager.characterManager.characterName(this.character, true, true));
        if (this.character.initiative === 99 || (this.character.name === 'prism' && this.character.tags.includes('long_rest'))) {
          this.character.longRest = true;
        } else {
          this.setInitiative(99);
          this.character.longRest = true;
          if (gameManager.game.state === GameState.next) {
            gameManager.sortFigures(this.character);
          }
        }
        gameManager.stateManager.after();
      }
      ghsDialogClosingHelper(this.dialogRef);
    }
  }
}
