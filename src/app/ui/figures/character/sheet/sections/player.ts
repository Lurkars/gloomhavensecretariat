import { Dialog } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { StatisticsDialogComponent } from 'src/app/ui/figures/party/statistics/statistics-dialog';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';

@Component({
  imports: [GhsLabelDirective, GhsTooltipDirective],
  selector: 'ghs-character-sheet-player',
  templateUrl: 'player.html',
  styleUrls: ['../../../sheet.scss', './player.scss']
})
export class CharacterSheetPlayerComponent extends CharacterSheetSection {
  private dialog = inject(Dialog);

  get playerName(): string | undefined {
    return this.character.number > 0 ? gameManager.game.party.players[this.character.number - 1] : undefined;
  }

  setPlayerNumber(event: any) {
    const number = +event.target.value;
    if (gameManager.characterManager.canSetPlayerNumber(this.character, number)) {
      gameManager.stateManager.before('setPlayerNumber', this.characterName, number);
      gameManager.characterManager.setPlayerNumber(this.character, number);
      gameManager.stateManager.after();
    }
  }

  statistics() {
    this.dialog.open(StatisticsDialogComponent, {
      panelClass: ['dialog-invert'],
      data: { character: this.character }
    });
  }
}
