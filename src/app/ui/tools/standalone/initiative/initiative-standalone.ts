import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderComponent } from 'src/app/ui/header/header';
import { KeyboardShortcuts } from 'src/app/ui/helper/keyboard-shortcuts';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { StandaloneCharacterChooserComponent } from 'src/app/ui/tools/standalone/character-chooser/character-chooser';
import { InitiativePickerComponent } from 'src/app/ui/tools/standalone/initiative/initiative-picker';
import { StandaloneCharacterBase } from 'src/app/ui/tools/standalone/standalone-character';

@Component({
  imports: [NgClass, HeaderComponent, KeyboardShortcuts, GhsLabelDirective, InitiativePickerComponent, StandaloneCharacterChooserComponent],
  selector: 'ghs-initiative-standalone',
  templateUrl: './initiative-standalone.html',
  styleUrls: ['./initiative-standalone.scss']
})
export class InitiativeStandaloneComponent extends StandaloneCharacterBase {
  readonly path = 'initiative';
}
