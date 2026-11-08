import { NgClass } from '@angular/common';
import { Component, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { TreasuresDialogComponent } from 'src/app/ui/figures/party/treasures/treasures-dialog';
import { TreasureLabelComponent } from 'src/app/ui/footer/scenario/treasures/label/label';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsLabelDirective, TrackUUIDPipe, TreasureLabelComponent],
  selector: 'ghs-party-campaign-treasures',
  templateUrl: 'campaign-treasures.html',
  styleUrls: ['../../../sheet.scss', './campaign-treasures.scss']
})
export class PartyCampaignTreasuresComponent extends PartySheetSection {
  readonly treasureIndex = viewChild.required<ElementRef>('treasureIndex');

  treasureEdition: string = '';
  lastEdition: string | undefined;

  override update(): void {
    if (this.lastEdition !== this.edition()) {
      this.lastEdition = this.edition();
      this.treasureEdition = this.edition();
    }
  }

  treasuresDialog() {
    this.dialog.open(TreasuresDialogComponent, {
      panelClass: ['dialog'],
      data: { party: this.party, edition: this.treasureEdition }
    });
  }
  treasures(): Identifier[] {
    return this.party.treasures
      .filter((identifier) => !this.treasureEdition || identifier.edition === this.treasureEdition)
      .sort((a, b) => {
        if (!this.treasureEdition && a.edition !== b.edition) {
          return gameManager.editions().indexOf(a.edition) - gameManager.editions().indexOf(b.edition);
        }

        return +a.name - +b.name;
      });
  }
  addTreasure(indexElement: HTMLInputElement, edition: string) {
    const treasure: string = indexElement.value;
    if (treasure && !isNaN(+treasure) && edition) {
      if (this.hasTreasure(treasure, edition)) {
        indexElement.classList.add('warning');
      } else {
        indexElement.classList.add('error');
        const editionData = gameManager.editionData.find((editionData) => editionData.edition === edition);
        if (editionData && editionData.treasures) {
          const treasureIndex = +treasure - (editionData.treasureOffset || 0) - 1;
          if (treasureIndex >= 0 && treasureIndex < editionData.treasures.length) {
            gameManager.stateManager.before('addTreasure', edition, treasure);
            this.party.treasures = this.party.treasures || [];
            this.party.treasures.push(new Identifier(treasure, edition));
            this.treasureIndex().nativeElement.value = '';
            indexElement.classList.remove('error');
            gameManager.stateManager.after();
          }
        }
      }
    }
  }
  hasTreasure(treasure: string, edition: string): boolean {
    return (
      this.party.treasures && this.party.treasures.some((identifier) => identifier.name === treasure && identifier.edition === edition)
    );
  }
  removeTreasure(treasure: Identifier) {
    gameManager.stateManager.before('removeTreasure', treasure.edition, treasure.name);
    this.party.treasures.splice(this.party.treasures.indexOf(treasure), 1);
    gameManager.stateManager.after();
  }
}
