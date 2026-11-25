import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterResources } from 'src/app/game/businesslogic/LootManager';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { LootType, resourceLootTypes } from 'src/app/game/model/data/Loot';
import { Party } from 'src/app/game/model/Party';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsDialogClosingHelper } from 'src/app/ui/helper/Static';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, GhsTooltipDirective, TrackUUIDPipe],
  selector: 'ghs-party-resources',
  templateUrl: 'resources.html',
  styleUrls: ['./resources.scss']
})
export class PartyResourcesDialogComponent implements OnInit {
  private dialogRef = inject(DialogRef);
  private dialog = inject(Dialog);

  gameManager: GameManager = gameManager;

  party: Party = new Party();
  characters: Character[] = [];
  total: Partial<Record<LootType, number>> = {};
  totalGold: number = 0;
  totalXP: number = 0;
  lootColumns: LootType[] = resourceLootTypes;

  edit: boolean = false;
  edited: boolean = false;

  constructor() {
    this.edit = this.dialogRef.disableClose || false;
  }

  ngOnInit(): void {
    this.party = JSON.parse(JSON.stringify(gameManager.game.party));
    this.characters = gameManager.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => JSON.parse(JSON.stringify(figure)));
    this.update();
  }

  toggleEdit() {
    this.dialogRef.close();
    if (this.edit) {
      this.dialog.open(PartyResourcesDialogComponent, {
        panelClass: ['dialog', 'no-dialog-animations']
      });
    } else {
      this.dialog.open(PartyResourcesDialogComponent, {
        panelClass: ['dialog', 'no-dialog-animations'],
        disableClose: true
      });
    }
  }

  update() {
    this.lootColumns.forEach((type) => {
      this.total[type] = this.party.loot[type] || 0;
      if (this.characters.length > 0) {
        this.total[type] =
          (this.total[type] || 0) + this.characters.map((character) => character.progress.loot[type] || 0).reduce((a, b) => a + b);
      }
    });
    if (this.characters.length) {
      this.totalGold = this.characters.map((character) => character.progress.gold || 0).reduce((a, b) => a + b);
      this.totalXP = this.characters.map((character) => character.progress.experience || 0).reduce((a, b) => a + b);
    }
  }

  changeLoot(character: Character | undefined, type: LootType, event: any) {
    const value = Math.max(0, Math.floor(+event.target.value || 0)) || undefined;
    if (character) {
      character.progress.loot[type] = value;
    } else {
      this.party.loot[type] = value;
    }
    event.target.value = value || '';
    this.update();
    this.edited = true;
  }

  changeGold(character: Character, event: any) {
    character.progress.gold = Math.max(0, Math.floor(+event.target.value || 0));
    event.target.value = character.progress.gold;
    this.update();
    this.edited = true;
  }

  changeXP(character: Character, event: any) {
    character.progress.experience = Math.max(0, Math.floor(+event.target.value || 0));
    event.target.value = character.progress.experience;
    this.update();
    this.edited = true;
  }

  private changes(): CharacterResources[] {
    return gameManager.game.figures
      .filter((figure) => figure instanceof Character)
      .map((figure) => {
        const character = this.characters.find((character) => character.edition === figure.edition && character.name === figure.name);
        return character
          ? { character: figure, gold: character.progress.gold, experience: character.progress.experience, loot: character.progress.loot }
          : undefined;
      })
      .filter((value) => !!value) as CharacterResources[];
  }

  apply() {
    const changes = this.changes();
    if (gameManager.lootManager.canSetResources(this.party.loot, changes)) {
      gameManager.stateManager.before('applyResourceChange');
      gameManager.lootManager.setResources(this.party.loot, changes);
      gameManager.stateManager.after();
      ghsDialogClosingHelper(this.dialogRef);
    }
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
