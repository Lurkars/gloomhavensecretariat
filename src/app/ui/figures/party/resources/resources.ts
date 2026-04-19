import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
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
  styleUrls: ['./resources.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
        panelClass: ['dialog', 'no-open-animation']
      });
    } else {
      this.dialog.open(PartyResourcesDialogComponent, {
        panelClass: ['dialog', 'no-open-animation'],
        disableClose: true
      });
    }
  }

  update() {
    this.lootColumns.forEach((type) => {
      this.total[type] = gameManager.game.party.loot[type] || 0;
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
    if (character) {
      character.progress.loot[type] = +event.target.value || undefined;
    } else {
      this.party.loot[type] = +event.target.value || undefined;
    }
    this.update();
    this.edited = true;
  }

  changeGold(character: Character, event: any) {
    character.progress.gold = +event.target.value;
    this.update();
    this.edited = true;
  }

  changeXP(character: Character, event: any) {
    character.progress.experience = +event.target.value;
    this.update();
    this.edited = true;
  }

  apply() {
    gameManager.stateManager.before('applyResourceChange');
    gameManager.game.party.loot = this.party.loot;
    gameManager.game.figures
      .filter((figure) => figure instanceof Character)
      .forEach((figure) => {
        const character = this.characters.find((character) => character.edition === figure.edition && character.name === figure.name);
        if (character) {
          figure.progress = character.progress;
        }
      });
    gameManager.stateManager.after();
    ghsDialogClosingHelper(this.dialogRef);
  }

  close() {
    ghsDialogClosingHelper(this.dialogRef);
  }
}
