import { Dialog, DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Component, ElementRef, Inject, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { EntityValueFunction } from "src/app/game/model/Entity";
import { ghsDefaultDialogPositions, ghsDialogClosingHelper, ghsValueSign } from "src/app/ui/helper/Static";
import { EntitiesMenuDialogComponent } from "../entities-menu-dialog";

@Component({
  standalone: false,
  selector: 'ghs-character-level-dialog',
  templateUrl: 'level-dialog.html',
  styleUrls: ['../entities-menu-dialog.scss', './level-dialog.scss']
})
export class CharacterLevelDialogComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  EntityValueFunction = EntityValueFunction;
  Math = Math;

  @ViewChild('charactertitle', { static: false }) characterTitleInput!: ElementRef;

  character: Character;
  bb: boolean;
  level: number
  maxHp: number = 0;
  titles: string[] = [];
  identities: string[] = [];

  constructor(@Inject(DIALOG_DATA) public data: { character: Character, positionElement: ElementRef }, private dialogRef: DialogRef, private dialog: Dialog, public overlay: Overlay) {
    this.character = data.character;
    this.bb = this.character.bb;
    this.level = this.character.level;
    this.identities = settingsManager.settings.characterIdentities ? [...this.character.identities] : [];


    if (this.characterTitleInput) {
      this.characterTitleInput.nativeElement.value = this.character.title || settingsManager.getLabel('data.character.' + this.character.edition + '.' + this.character.name.toLowerCase());
    }

    this.titles = [];
    if (this.character.identities && this.character.identities.length > 1 && settingsManager.settings.characterIdentities) {
      this.titles = this.character.title.split('|');
      if (this.titles.length < this.character.identities.length) {
        for (let i = this.titles.length; i < this.character.identities.length; i++) {
          this.titles.push('');
        }
      }
      for (let i = 0; i < this.titles.length; i++) {
        if (!this.titles[i]) {
          this.titles[i] = settingsManager.getLabel('data.character.' + this.character.edition + '.' + this.character.name.toLowerCase());
        }
      }
    }

    this.dialogRef.closed.subscribe({
      next: (forced) => {
        if (!forced) {
          this.close();
        }
      }
    });
  }

  setLevel(level: number) {
    this.level = level;
  }

  setTitle(event: any, index: number) {
    this.titles[index] = event.target.value;
  }

  changeMaxHealth(value: number) {
    this.maxHp += value;
  }

  back() {
    this.dialog.open(EntitiesMenuDialogComponent, {
      panelClass: ['dialog'],
      data: {
        figure: this.character,
        entity: this.character,
        positionElement: this.data.positionElement
      },
      positionStrategy: this.data.positionElement && this.overlay.position().flexibleConnectedTo(this.data.positionElement).withPositions(ghsDefaultDialogPositions())
    });

    ghsDialogClosingHelper(this.dialogRef);
  }

  close() {
    if (this.level != this.character.level) {
      gameManager.stateManager.before("setLevel", gameManager.characterManager.characterName(this.character), this.level);
      gameManager.characterManager.setLevel(this.character, this.level);
      gameManager.stateManager.after();
    }

    if (this.maxHp) {
      gameManager.entityManager.before(this.character, this.character, "changeMaxHP", ghsValueSign(this.maxHp));
      if (this.character.maxHealth + this.maxHp < this.character.maxHealth || this.character.health == this.character.maxHealth) {
        this.character.health = this.character.maxHealth + this.maxHp;
      }
      this.character.maxHealth += this.maxHp;
      gameManager.stateManager.after();
      this.maxHp = 0;
    }

    let title = this.character.title;

    if (this.characterTitleInput) {
      title = this.characterTitleInput.nativeElement.value;
    }

    if (this.titles.length > 0) {
      for (let i = 0; i < this.titles.length; i++) {
        if (this.titles[i] == settingsManager.getLabel('data.character.' + this.character.edition + '.' + this.character.name.toLowerCase())) {
          this.titles[i] = '';
        }
      }

      title = this.titles.join('|');
      while (title.endsWith('|')) {
        title = title.substring(0, title.length - 1);
      }
    }

    if (title != settingsManager.getLabel('data.character.' + this.character.edition + '.' + this.character.name.toLowerCase())) {
      if (this.character.title != title) {
        gameManager.entityManager.before(this.character, this.character, 'setTitle', title);
        this.character.title = title;
        gameManager.stateManager.after();
      }
    } else if (this.character.title != "") {
      gameManager.entityManager.before(this.character, this.character, 'unsetTitle', title);
      this.character.title = "";
      gameManager.stateManager.after();
    }
  }
}
