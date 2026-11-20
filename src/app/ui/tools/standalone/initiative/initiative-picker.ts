import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, HostListener, effect, inject, input, untracked } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { GameState } from 'src/app/game/model/Game';
import { CharacterSheetDialog } from 'src/app/ui/figures/character/dialogs/character-sheet-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsFilterInputFocus } from 'src/app/ui/helper/Static';

/**
 * Number pad to enter a (hidden) initiative for a single character.
 * If connected to a server, the initiative is posted to the server's initiative endpoint,
 * so multiple players can enter their initiative at the same time without conflicting game states.
 */
@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-initiative-picker',
  templateUrl: './initiative-picker.html',
  styleUrls: ['./initiative-picker.scss', '../../../../ui/figures/character/cards/initiative-dialog.scss']
})
export class InitiativePickerComponent {
  private dialog = inject(Dialog);

  readonly character = input.required<Character>();
  readonly vertical = input<boolean>(false);
  readonly hideCharacter = input<boolean>(false);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  value: string = '__';
  longRest: boolean = false;
  statusCode: number = 200;

  constructor() {
    effect(() => {
      this.character();
      untracked(() => {
        this.value = '__';
        this.longRest = false;
        this.statusCode = 200;
      });
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (settingsManager.settings.keyboardShortcuts && ghsFilterInputFocus() && this.dialog.openDialogs.length === 0) {
      if (event.key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
        this.pickNumber(+event.key);
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  pickNumber(number: number) {
    if (!this.value.includes('_')) {
      this.value = '__';
      this.longRest = false;
    }

    if (this.value === '__') {
      this.value = number + '_';
      this.longRest = false;
    } else {
      this.value = this.value[0] + number;
      if (settingsManager.settings.standaloneInitiativeAutomatic) {
        this.updateInitiative(+this.value);
      }
    }
  }

  updateInitiative(initiative: number) {
    const character = this.character();
    if (character.initiative !== initiative || this.longRest !== character.longRest) {
      if (initiative >= 0 && initiative < 100) {
        this.setInitiative(initiative);
      } else if (gameManager.game.state === GameState.draw) {
        character.initiative = 0;
      }
    }
  }

  async setInitiative(initiative: number) {
    const character = this.character();
    if (initiative >= 0 && initiative < 100 && (initiative !== character.initiative || this.longRest !== character.longRest)) {
      this.statusCode = 200;
      if (gameManager.stateManager.wsState() === WebSocket.OPEN && settingsManager.settings.serverUrl) {
        let url = settingsManager.settings.serverWss ? 'https://' : 'http://';
        const parts = settingsManager.settings.serverUrl.split('/');
        url += parts[0];
        if (
          (settingsManager.settings.serverWss && settingsManager.settings.serverPort !== 443) ||
          (!settingsManager.settings.serverWss && settingsManager.settings.serverPort !== 80)
        ) {
          url += ':' + settingsManager.settings.serverPort;
        }
        if (parts.length > 1) {
          url += '/' + parts.slice(1).join('/');
        }
        url += '/game/initiative';
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            playerNumber: character.number,
            initiative: initiative,
            longRest: this.longRest
          }),
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: settingsManager.settings.serverCode || ''
          }
        });

        this.statusCode = response.status;
      }

      if (this.statusCode === 200) {
        character.initiativeVisible = true;
        character.initiative = initiative;
        character.longRest = this.longRest;
        if (character.initiative !== 99) {
          character.longRest = false;
        }
        this.value = '__';
        this.longRest = false;
        gameManager.stateManager.saveLocal();
      }
    }
  }

  setLongRest() {
    this.longRest = !this.longRest;
    this.value = '99';
    if (settingsManager.settings.standaloneInitiativeAutomatic) {
      this.updateInitiative(+this.value);
    }
  }

  setCurrentValue() {
    this.value = this.value.replaceAll('_', '');
    this.setInitiative((this.value && +this.value) || 0);
  }

  openCharacterSheet(): void {
    gameManager.stateManager.updatePermissions();
    this.dialog.open(CharacterSheetDialog, {
      panelClass: ['dialog-invert'],
      data: { character: this.character() }
    });
  }
}
