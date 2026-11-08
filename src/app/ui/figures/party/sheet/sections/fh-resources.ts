import { Component } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { herbResourceLootTypes, LootType, materialResourceLootTypes } from 'src/app/game/model/data/Loot';
import { CharacterMoveResourcesDialog } from 'src/app/ui/figures/character/sheet/move-resources';
import { PartyResourcesDialogComponent } from 'src/app/ui/figures/party/resources/resources';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [GhsLabelDirective, GhsTooltipDirective, TrackUUIDPipe],
  selector: 'ghs-party-sheet-fh-resources',
  templateUrl: 'fh-resources.html',
  styleUrls: ['../../../sheet.scss', './fh-resources.scss']
})
export class PartySheetFhResourcesComponent extends PartySheetSection {
  materialResourceLootTypes = materialResourceLootTypes;
  herbResourceLootTypes = herbResourceLootTypes;
  characters: Character[] = [];

  override update(): void {
    this.characters = gameManager.game.figures
      .filter(
        (figure) => figure instanceof Character && Object.keys(figure.progress.loot).some((type) => figure.progress.loot[type as LootType])
      )
      .map((figure) => figure as Character);
  }

  setResource(type: LootType, event: any) {
    if (!isNaN(+event.target.value)) {
      gameManager.stateManager.before('setPartyResource', this.party.name, 'game.loot.' + type, event.target.value);
      this.party.loot[type] = +event.target.value;
      gameManager.stateManager.after();
    }
  }
  moveResources(character: Character) {
    this.dialog
      .open(CharacterMoveResourcesDialog, {
        panelClass: ['dialog'],
        data: { character: character }
      })
      .closed.subscribe({ next: () => this.update() });
  }
  openResources() {
    this.dialog.open(PartyResourcesDialogComponent, {
      panelClass: ['dialog']
    });
  }
}
