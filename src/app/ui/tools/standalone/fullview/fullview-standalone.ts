import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { CharacterFullViewComponent } from 'src/app/ui/figures/character/fullview/fullview';
import { CharacterSheetComponent } from 'src/app/ui/figures/character/sheet/character-sheet';
import { FooterComponent } from 'src/app/ui/footer/footer';
import { HeaderComponent } from 'src/app/ui/header/header';
import { KeyboardShortcuts } from 'src/app/ui/helper/keyboard-shortcuts';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { StandaloneCharacterChooserComponent } from 'src/app/ui/tools/standalone/character-chooser/character-chooser';
import { StandaloneCharacterBase } from 'src/app/ui/tools/standalone/standalone-character';

export type CharacterFullViewMode = 'board' | 'sheet';

/**
 * Standalone full view for a single character, e.g. for a players own device.
 * Automatically shows the character sheet without scenario and the character board with scenario
 * (initiative is set on the board). The mode can be overridden manually until the automatic mode changes.
 */
@Component({
  imports: [
    NgClass,
    RouterLink,
    FooterComponent,
    HeaderComponent,
    KeyboardShortcuts,
    GhsLabelDirective,
    GhsTooltipDirective,
    PointerInputDirective,
    CharacterFullViewComponent,
    CharacterSheetComponent,
    StandaloneCharacterChooserComponent
  ],
  selector: 'ghs-character-fullview-standalone',
  templateUrl: './fullview-standalone.html',
  styleUrls: ['./fullview-standalone.scss']
})
export class CharacterFullViewStandaloneComponent extends StandaloneCharacterBase {
  readonly path = 'fullview';

  readonly modes: CharacterFullViewMode[] = ['board', 'sheet'];

  mode: CharacterFullViewMode = 'sheet';
  manualMode: CharacterFullViewMode | undefined;
  lastAutoMode: CharacterFullViewMode | undefined;

  override update() {
    super.update();
    const autoMode = this.autoMode();
    // reset manual override as soon as a scenario is set or finished
    if (autoMode !== this.lastAutoMode) {
      this.manualMode = undefined;
      this.lastAutoMode = autoMode;
    }
    this.mode = this.manualMode || autoMode;
  }

  autoMode(): CharacterFullViewMode {
    return gameManager.game.scenario ? 'board' : 'sheet';
  }

  /** picker is always visible in the bar, with route parameter switch the route instead */
  override selectCharacter(character: Character) {
    if (this.characterParam) {
      if (this.character !== character) {
        this.openCharacter(character);
      }
    } else {
      super.selectCharacter(character);
    }
  }

  setMode(mode: CharacterFullViewMode) {
    this.manualMode = mode !== this.autoMode() ? mode : undefined;
    this.mode = mode;
  }

  toggleSheetLocked() {
    settingsManager.toggle('characterSheetLocked');
  }
}
