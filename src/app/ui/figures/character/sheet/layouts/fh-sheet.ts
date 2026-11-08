import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { CLASSIC_SHEET_IMPORTS } from 'src/app/ui/figures/character/sheet/layouts/imports';
import { CharacterSheetLayout } from 'src/app/ui/figures/character/sheet/layouts/layout';
import { CharacterSheetMasteriesComponent } from 'src/app/ui/figures/character/sheet/sections/masteries';
import { CharacterSheetResourcesComponent } from 'src/app/ui/figures/character/sheet/sections/resources';

@Component({
  imports: [...CLASSIC_SHEET_IMPORTS, CharacterSheetResourcesComponent, CharacterSheetMasteriesComponent],
  selector: 'ghs-character-sheet-fh',
  templateUrl: 'fh-sheet.html',
  styleUrls: ['../../../sheet.scss', './layout.scss']
})
export class CharacterSheetFhComponent extends CharacterSheetLayout {
  readonly gh2e = input<boolean>(false);

  get jotl(): boolean {
    return gameManager.editionRules('jotl');
  }
}
