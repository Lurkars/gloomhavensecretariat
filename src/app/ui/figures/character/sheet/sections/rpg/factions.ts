import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RPG_FACTION_BENEFITS } from 'src/app/game/model/CharacterProgress';
import { RpgSheetSection } from 'src/app/ui/figures/character/sheet/sections/rpg/rpg-section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-sheet-rpg-factions',
  templateUrl: 'factions.html',
  styleUrls: ['./rpg.scss', './factions.scss']
})
export class CharacterSheetRpgFactionsComponent extends RpgSheetSection {
  tiers: number[] = [1, 2, 3, 4, 5];
  tierLabels: string[] = ['I', 'II', 'III', 'IV', 'V'];
  benefits: number[] = Array.from({ length: RPG_FACTION_BENEFITS }, (v, i) => i);

  setName(index: number, event: any) {
    const value = event.target.value;
    this.change('factions', value, (rpg) => (rpg.factions[index].name = value));
  }

  setTier(index: number, tier: number) {
    const value = this.rpg.factions[index].tier === tier ? -1 : tier;
    this.change('factions', value, (rpg) => (rpg.factions[index].tier = value));
  }

  setBenefit(index: number, benefit: number, event: any) {
    const value = event.target.value;
    this.change('factions', value, (rpg) => {
      rpg.factions[index].benefits = rpg.factions[index].benefits || [];
      rpg.factions[index].benefits[benefit] = value;
    });
  }
}
