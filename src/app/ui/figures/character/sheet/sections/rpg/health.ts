import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-character-sheet-rpg-health',
  templateUrl: 'health.html',
  styleUrls: ['./rpg.scss', './health.scss']
})
export class CharacterSheetRpgHealthComponent extends CharacterSheetSection {
  readonly current = input<boolean>(false);

  setHealth(event: any) {
    const value = +event.target.value;
    if (!this.locked && !isNaN(value) && this.character.health !== value) {
      gameManager.entityManager.before(this.character, this.character, 'changeHP', value - this.character.health);
      gameManager.entityManager.changeHealth(this.character, this.character, value - this.character.health);
      gameManager.stateManager.after();
    }
  }
}
