import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [NgClass, GhsRangePipe],
  selector: 'ghs-character-sheet-level',
  templateUrl: 'level.html',
  styleUrls: ['../../../sheet.scss', './level.scss']
})
export class CharacterSheetLevelComponent extends CharacterSheetSection {
  readonly xp = input<boolean>(true);

  setLevel(level: number) {
    if (this.character.level === level) {
      level--;
    }
    level = Math.min(9, Math.max(1, level));
    gameManager.entityManager.before(this.character, this.character, 'setLevel', level);
    gameManager.characterManager.setLevel(this.character, level);
    gameManager.stateManager.after();
  }
}
