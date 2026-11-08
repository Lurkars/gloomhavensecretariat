import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { CharacterSheetLayout } from 'src/app/ui/figures/character/sheet/layouts/layout';
import { CharacterSheetCountersComponent } from 'src/app/ui/figures/character/sheet/sections/counters';
import { CharacterSheetGoldComponent } from 'src/app/ui/figures/character/sheet/sections/gold';
import { CharacterSheetLevelComponent } from 'src/app/ui/figures/character/sheet/sections/level';
import { CharacterSheetNameComponent } from 'src/app/ui/figures/character/sheet/sections/name';
import { CharacterSheetPerksComponent } from 'src/app/ui/figures/character/sheet/sections/perks';
import { CharacterSheetRpgAttributesComponent } from 'src/app/ui/figures/character/sheet/sections/rpg/attributes';
import { CharacterSheetRpgFactionsComponent } from 'src/app/ui/figures/character/sheet/sections/rpg/factions';
import { CharacterSheetRpgHealthComponent } from 'src/app/ui/figures/character/sheet/sections/rpg/health';
import { CharacterSheetRpgItemsComponent } from 'src/app/ui/figures/character/sheet/sections/rpg/items';
import { CharacterSheetRpgModifiersComponent } from 'src/app/ui/figures/character/sheet/sections/rpg/modifiers';
import { CharacterSheetRpgPowersComponent, RpgPowerList } from 'src/app/ui/figures/character/sheet/sections/rpg/powers';
import { CharacterSheetRpgTextComponent } from 'src/app/ui/figures/character/sheet/sections/rpg/text';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [
    NgClass,
    GhsLabelDirective,
    CharacterSheetNameComponent,
    CharacterSheetLevelComponent,
    CharacterSheetGoldComponent,
    CharacterSheetCountersComponent,
    CharacterSheetPerksComponent,
    CharacterSheetRpgAttributesComponent,
    CharacterSheetRpgTextComponent,
    CharacterSheetRpgHealthComponent,
    CharacterSheetRpgItemsComponent,
    CharacterSheetRpgModifiersComponent,
    CharacterSheetRpgFactionsComponent,
    CharacterSheetRpgPowersComponent
  ],
  selector: 'ghs-character-sheet-rpg',
  templateUrl: 'rpg-sheet.html',
  styleUrls: ['../sections/rpg/rpg.scss', './rpg-sheet.scss']
})
export class CharacterSheetRpgComponent extends CharacterSheetLayout {
  powerLists: RpgPowerList[] = ['talents', 'ancestrySkills', 'classSkills'];
}
