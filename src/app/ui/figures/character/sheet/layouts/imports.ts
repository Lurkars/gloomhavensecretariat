import { CharacterSheetBattleGoalsComponent } from 'src/app/ui/figures/character/sheet/sections/battle-goals';
import { CharacterSheetCountersComponent } from 'src/app/ui/figures/character/sheet/sections/counters';
import { CharacterSheetGoldComponent } from 'src/app/ui/figures/character/sheet/sections/gold';
import { CharacterSheetImportExportComponent } from 'src/app/ui/figures/character/sheet/sections/import-export';
import { CharacterSheetLevelComponent } from 'src/app/ui/figures/character/sheet/sections/level';
import { CharacterSheetNameComponent } from 'src/app/ui/figures/character/sheet/sections/name';
import { CharacterSheetNotesComponent } from 'src/app/ui/figures/character/sheet/sections/notes';
import { CharacterSheetPerksComponent } from 'src/app/ui/figures/character/sheet/sections/perks';
import { CharacterSheetPersonalQuestComponent } from 'src/app/ui/figures/character/sheet/sections/personal-quest';
import { CharacterSheetPlayerComponent } from 'src/app/ui/figures/character/sheet/sections/player';
import { CharacterSheetSetAsideComponent } from 'src/app/ui/figures/character/sheet/sections/set-aside';
import { CharacterSheetTitleComponent } from 'src/app/ui/figures/character/sheet/sections/title';
import { CharacterSheetXpComponent } from 'src/app/ui/figures/character/sheet/sections/xp';
import { CharacterItemsComponent } from 'src/app/ui/figures/items/items';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

export const CLASSIC_SHEET_IMPORTS = [
  GhsLabelDirective,
  CharacterItemsComponent,
  CharacterSheetTitleComponent,
  CharacterSheetNameComponent,
  CharacterSheetLevelComponent,
  CharacterSheetXpComponent,
  CharacterSheetGoldComponent,
  CharacterSheetNotesComponent,
  CharacterSheetPerksComponent,
  CharacterSheetBattleGoalsComponent,
  CharacterSheetPlayerComponent,
  CharacterSheetPersonalQuestComponent,
  CharacterSheetCountersComponent,
  CharacterSheetSetAsideComponent,
  CharacterSheetImportExportComponent
];
