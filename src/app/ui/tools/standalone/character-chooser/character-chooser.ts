import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, PointerInputDirective, TrackUUIDPipe],
  selector: 'ghs-standalone-character-chooser',
  templateUrl: './character-chooser.html',
  styleUrls: ['./character-chooser.scss']
})
export class StandaloneCharacterChooserComponent {
  readonly characters = input.required<Character[]>();
  readonly selected = input<Character | undefined>();
  readonly vertical = input<boolean>(false);
  /** compact single line, e.g. for a bar */
  readonly bar = input<boolean>(false);

  /** single click on a character */
  readonly characterSelect = output<Character>();
  /** double click on a character */
  readonly characterOpen = output<Character>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
}
