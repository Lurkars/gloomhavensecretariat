import { Directive, output } from '@angular/core';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';

@Directive()
export abstract class CharacterSheetLayout extends CharacterSheetSection {
  readonly toggleSheet = output<void>();
}
