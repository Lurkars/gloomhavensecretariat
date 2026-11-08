import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { RpgPower, RpgPowerState } from 'src/app/game/model/CharacterProgress';
import { RpgSheetSection } from 'src/app/ui/figures/character/sheet/sections/rpg/rpg-section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

export type RpgPowerList = 'talents' | 'ancestrySkills' | 'classSkills';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-sheet-rpg-powers',
  templateUrl: 'powers.html',
  styleUrls: ['../../../../sheet.scss', './rpg.scss', './powers.scss']
})
export class CharacterSheetRpgPowersComponent extends RpgSheetSection {
  readonly list = input.required<RpgPowerList>();

  get talents(): boolean {
    return this.list() === 'talents';
  }

  talentType(index: number): string {
    return settingsManager.getLabel('character.progress.rpg.' + (index < 2 ? 'activeTalent' : 'passiveTalent'));
  }

  setPower<K extends keyof RpgPower>(index: number, field: K, value: RpgPower[K]) {
    const list = this.list();
    this.change(list, '' + value, (rpg) => (rpg[list][index][field] = value));
  }

  toggleState(index: number, state: RpgPowerState) {
    this.setPower(index, 'state', this.rpg[this.list()][index].state === state ? undefined : state);
  }
}
