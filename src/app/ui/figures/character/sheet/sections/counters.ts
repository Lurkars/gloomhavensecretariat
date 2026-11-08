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
    if (!isNaN(+event.target.value) && this.character.progress.extraPerks !== +event.target.value) {
      gameManager.stateManager.before('setExtraPerks', this.characterName, event.target.value);
      this.character.progress.extraPerks = +event.target.value;
      gameManager.stateManager.after();
    }
  }

  setRetirements(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.retirements !== +event.target.value) {
      gameManager.stateManager.before('setRetirements', this.characterName, event.target.value);
      this.character.progress.retirements = +event.target.value;
      gameManager.stateManager.after();
    }
  }
}
