import { Component, OnInit } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [GhsLabelDirective, GhsRangePipe],
  selector: 'ghs-character-sheet-name',
  templateUrl: 'name.html',
  styleUrls: ['../../../sheet.scss', './name.scss']
})
export class CharacterSheetNameComponent extends CharacterSheetSection implements OnInit {
  titles: string[] = [];

  ngOnInit(): void {
    if (this.character.identities && this.character.identities.length > 1 && settingsManager.settings.characterIdentities) {
      this.titles = this.character.title.split('|');
      for (let i = this.titles.length; i < this.character.identities.length; i++) {
        this.titles.push('');
      }
      this.titles = this.titles.map((title) => title || this.defaultTitle);
    }
  }

  get defaultTitle(): string {
    return settingsManager.getLabel('data.character.' + this.character.edition + '.' + this.character.name.toLowerCase());
  }

  get title(): string {
    return this.character.title || this.defaultTitle;
  }

  setTitle(event: any, index: number = -1) {
    let title: string = event.target.value;
    if (index >= 0) {
      this.titles[index] = title;
      title = this.titles.map((value) => (value === this.defaultTitle ? '' : value)).join('|');
      while (title.endsWith('|')) {
        title = title.substring(0, title.length - 1);
      }
    }

    if (title === this.defaultTitle) {
      title = '';
    }

    if (this.character.title !== title) {
      gameManager.entityManager.before(this.character, this.character, title ? 'setTitle' : 'unsetTitle', title || this.character.title);
      this.character.title = title;
      gameManager.stateManager.after();
    }
  }
}
