import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RpgItem } from 'src/app/game/model/CharacterProgress';
import { RpgSheetSection } from 'src/app/ui/figures/character/sheet/sections/rpg/rpg-section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-sheet-rpg-items',
  templateUrl: 'items.html',
  styleUrls: ['../../../../sheet.scss', './rpg.scss', './items.scss']
})
export class CharacterSheetRpgItemsComponent extends RpgSheetSection {
  setItem<K extends keyof RpgItem>(index: number, field: K, value: RpgItem[K]) {
    this.change('items', value as string | boolean, (rpg) => (rpg.items[index][field] = value));
  }
}
