import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CLASSIC_SHEET_IMPORTS } from 'src/app/ui/figures/character/sheet/layouts/imports';
import { CharacterSheetLayout } from 'src/app/ui/figures/character/sheet/layouts/layout';

@Component({
  imports: CLASSIC_SHEET_IMPORTS,
  selector: 'ghs-character-sheet-gh',
  templateUrl: 'gh-sheet.html',
  styleUrls: ['../../../sheet.scss', './layout.scss']
})
export class CharacterSheetGhComponent extends CharacterSheetLayout {
  readonly cs = input<boolean>(false);

  get jotl(): boolean {
    return gameManager.editionRules('jotl');
  }
}
