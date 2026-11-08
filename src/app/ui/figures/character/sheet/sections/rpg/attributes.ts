import { Component } from '@angular/core';
import { RpgAttribute } from 'src/app/game/model/CharacterProgress';
import { RpgSheetSection } from 'src/app/ui/figures/character/sheet/sections/rpg/rpg-section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective],
  selector: 'ghs-character-sheet-rpg-attributes',
  templateUrl: 'attributes.html',
  styleUrls: ['./rpg.scss', './attributes.scss']
})
export class CharacterSheetRpgAttributesComponent extends RpgSheetSection {
  attributes: RpgAttribute[] = Object.values(RpgAttribute);

  setAttribute(attribute: RpgAttribute, event: any) {
    const value = +event.target.value;
    if (!isNaN(value) && this.rpg.attributes[attribute] !== value) {
      this.change('attributes.' + attribute, value, (rpg) => (rpg.attributes[attribute] = value));
    }
  }
}
