import { Dialog, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, Inject, Input, ViewChild } from "@angular/core";
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
  styleUrls: [ './initiative.scss' ]
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
    const initative: number = isNaN(+event.target.value) ? 0 : +event.target.value;
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initative >= 0 || initative > 0) && initative < 100) {
      this.setInitiative(initative);
    } else {
      event.target.value = (this.character.initiative < 10 ? '0' : '') + this.character.initiative;
    }
  }

  setInitiative(initative: number) {
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initative >= 0 || initative > 0) && initative < 100) {
      gameManager.stateManager.before("setInitiative", "data.character." + this.character.name, "" + initative);
      this.character.initiative = initative;
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
      }
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures();
      }
      gameManager.stateManager.after();
    }
  }

  open(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: 'dialog',
      data: this.character,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(ghsDefaultDialogPositions())
    });
  }

}

@Component({
  selector: 'ghs-character-initiative-dialog',
  templateUrl: 'initiative-dialog.html',
  styleUrls: [ './initiative-dialog.scss' ]
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

  pickNumber(number: number) {
    this.value = (this.value + "" + number).substring(1, 3);
    if (this.value.indexOf("_") == -1) {
      this.updateInitiative(+this.value);
      this.dialogRef.close();
    }
  }

  updateInitiative(initative: number) {
    gameManager.stateManager.before("setInitiative", "data.character." + this.character.name, "" + (initative > 0 && initative < 100 ? initative : 0));
    if (initative > 0 && initative < 100) {
      this.setInitiative(initative);
    } else if (gameManager.game.state == GameState.draw) {
      this.character.initiative = 0;
    }
    if (gameManager.game.state == GameState.next) {
      gameManager.sortFigures();
    }
    gameManager.stateManager.after();
  }

  setInitiative(initative: number) {
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initative >= 0 || initative > 0) && initative < 100) {
      this.character.initiative = initative;
      if (this.character instanceof Character) {
        this.character.initiativeVisible = true;
      }
    }
  }

}