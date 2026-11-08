import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { RpgSheetSection } from 'src/app/ui/figures/character/sheet/sections/rpg/rpg-section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

export type RpgTextField = 'pronouns' | 'playerName' | 'ancestry' | 'backgrounds' | 'personalGoal';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-sheet-rpg-text',
  templateUrl: 'text.html',
  styleUrls: ['./rpg.scss', './text.scss']
})
export class CharacterSheetRpgTextComponent extends RpgSheetSection {
  readonly field = input.required<RpgTextField>();
  readonly multiline = input<boolean>(false);

  setText(event: any) {
    const field = this.field();
    const value = event.target.value;
    if (this.rpg[field] !== value) {
      this.change(field, value, (rpg) => (rpg[field] = value));
    }
  }
}
