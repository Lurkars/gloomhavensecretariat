import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-character-sheet-counters',
  templateUrl: 'counters.html',
  styleUrls: ['../../../sheet.scss', './counters.scss']
})
export class CharacterSheetCountersComponent extends CharacterSheetSection {
  readonly retirements = input<boolean>(true);

  setExtraPerks(event: any) {
    if (isNaN(+event.target.value)) {
      return;
    }
    const value = Math.max(0, +event.target.value);
    event.target.value = value;
    if (this.character.progress.extraPerks !== value) {
      gameManager.stateManager.before('setExtraPerks', this.characterName, value);
      this.character.progress.extraPerks = value;
      gameManager.stateManager.after();
    }
  }

  setRetirements(event: any) {
    if (isNaN(+event.target.value)) {
      return;
    }
    const value = Math.max(0, +event.target.value);
    event.target.value = value;
    if (this.character.progress.retirements !== value) {
      gameManager.stateManager.before('setRetirements', this.characterName, value);
      this.character.progress.retirements = value;
      gameManager.stateManager.after();
    }
  }
}
