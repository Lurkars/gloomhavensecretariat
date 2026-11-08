import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { ghsValueSign } from 'src/app/ui/helper/Static';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-character-sheet-xp',
  templateUrl: 'xp.html',
  styleUrls: ['../../../sheet.scss', './xp.scss']
})
export class CharacterSheetXpComponent extends CharacterSheetSection {
  readonly fh = input<boolean>(false);

  xpTimeout: any = null;

  setXP(event: any) {
    if (!isNaN(+event.target.value) && this.character.progress.experience !== +event.target.value) {
      if (this.xpTimeout) {
        clearTimeout(this.xpTimeout);
        this.xpTimeout = null;
      }
      this.xpTimeout = setTimeout(() => {
        gameManager.entityManager.before(
          this.character,
          this.character,
          'changeXP',
          ghsValueSign(+event.target.value - this.character.progress.experience)
        );
        gameManager.characterManager.addXP(
          this.character,
          event.target.value - this.character.progress.experience,
          !gameManager.game.scenario && gameManager.roundManager.firstRound
        );
        gameManager.stateManager.after();
        this.xpTimeout = null;
      }, 500);
    }
  }
}
