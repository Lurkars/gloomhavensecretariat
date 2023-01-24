import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, HostListener, Inject, Input, ViewChild } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";

import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Objective } from "src/app/game/model/Objective";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";


@Component({
  selector: 'ghs-character-initiative',
  templateUrl: 'initiative.html',
  styleUrls: ['./initiative.scss']
})
export class CharacterInitiativeComponent {

  @Input() character!: Character | Objective;

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  constructor(private dialog: Dialog, private overlay: Overlay, private elementRef: ElementRef) { };

  initiativeHidden(): boolean {
    return gameManager.game.state == GameState.draw && this.character instanceof Character && !this.character.initiativeVisible;
  }

  updateInitiative(event: any) {
    const initiative: number = isNaN(+event.target.value) ? 0 : +event.target.value;
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100) {
      this.setInitiative(initiative);
    } else {
      event.target.value = (this.character.initiative < 10 ? '0' : '') + this.character.initiative;
    }
  }

  setInitiative(initiative: number) {
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100) {
      gameManager.stateManager.before("setInitiative", "data.character." + this.character.name, "" + initiative);
      this.character.initiative = initiative;
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
        this.character.longRest = false;
        if (initiative == 99) {
          this.character.longRest = true;
        }
      }
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures();
      }
      gameManager.stateManager.after();
    }
  }

  longRestOff(event: any) {
    if (this.character instanceof Character && this.character.longRest) {
      gameManager.stateManager.before("characterLongRestOff", "data.character." + this.character.name);
      this.character.longRest = false;
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures();
      }
      gameManager.stateManager.after();
      event.preventDefault();
    }
  }

  open(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: 'dialog',
      data: this.character,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(ghsDefaultDialogPositions())
    });
  }

  tabindex(): number {
    return gameManager.game.figures.filter((figure) => figure instanceof Character).indexOf(this.character);
  }

  focusNext(event: any) {
    const tabindex = this.tabindex();
    let next = document.getElementById('initiative-input-' + (tabindex + 1));
    if (!next && tabindex > 0) {
      next = document.getElementById('initiative-input-0');
    }
    if (next) {
      next.focus();
    }
    event.preventDefault();
  }

}

@Component({
  selector: 'ghs-character-initiative-dialog',
  templateUrl: 'initiative-dialog.html',
  styleUrls: ['./initiative-dialog.scss']
})
export class CharacterInitiativeDialogComponent {

  value: string = "__";

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;

  constructor(@Inject(DIALOG_DATA) public character: Character | Objective, private dialogRef: DialogRef) {
    dialogRef.closed.subscribe({
      next: () => {
        if (this.value.indexOf("_") != -1 && !isNaN(+this.value.replace('_', ''))) {
          this.updateInitiative(+this.value.replace('_', ''));
        }
      }
    })
  }

  @HostListener('document:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (event.key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      this.pickNumber(+event.key);
    }
  }

  pickNumber(number: number) {
    this.value = (this.value + "" + number).substring(1, 3);
    if (this.value.indexOf("_") == -1) {
      this.updateInitiative(+this.value);
      this.dialogRef.close();
    }
  }

  updateInitiative(initiative: number) {
    gameManager.stateManager.before("setInitiative", "data.character." + this.character.name, "" + (initiative > 0 && initiative < 100 ? initiative : 0));
    if (initiative > 0 && initiative < 100) {
      this.setInitiative(initiative);
    } else if (gameManager.game.state == GameState.draw) {
      this.character.initiative = 0;
    }
    if (gameManager.game.state == GameState.next) {
      gameManager.sortFigures();
    }
    gameManager.stateManager.after();
  }

  setInitiative(initiative: number) {
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100) {
      this.character.initiative = initiative;
      if (this.character instanceof Character) {
        this.character.longRest = false;
        if (initiative == 99) {
          this.character.longRest = true;
        }
      }
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
      }
    }
  }

  longRest() {
    gameManager.stateManager.before("characterLongRest", "data.character." + this.character.name);
    this.setInitiative(99);
    if (gameManager.game.state == GameState.next) {
      gameManager.sortFigures();
    }
    gameManager.stateManager.after();
    this.dialogRef.close();
  }

}