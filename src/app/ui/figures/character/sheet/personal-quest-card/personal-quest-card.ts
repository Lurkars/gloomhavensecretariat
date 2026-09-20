import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

type PersonalQuestTheme = { accent: string; light: string };

const editionThemes: Record<string, PersonalQuestTheme> = {
  gh: { accent: '#4a6b3a', light: '#e3ecdc' },
  gh2e: { accent: '#b8860b', light: '#f5ecd2' },
  fh: { accent: '#3a6ea5', light: '#dde8f2' },
  cs: { accent: '#a5303a', light: '#f2dede' },
  ir: { accent: '#4aa8a8', light: '#dcf0ee' },
  cq: { accent: '#6a4a8a', light: '#e8ddf0' },
  toa: { accent: '#b85c2e', light: '#f5e2d5' }
};
const defaultTheme: PersonalQuestTheme = { accent: '#7a6a4a', light: '#efe9dc' };

@Component({
  imports: [GhsLabelDirective, NgClass],
  selector: 'ghs-personal-quest-card',
  templateUrl: './personal-quest-card.html',
  styleUrls: ['./personal-quest-card.scss']
})
export class PersonalQuestCardComponent {
  readonly inputPersonalQuest = input.required<PersonalQuest>({ alias: 'personalQuest' });
  get personalQuest(): PersonalQuest {
    return this.inputPersonalQuest();
  }

  readonly selected = input<boolean>(false);
  readonly flipped = input<boolean>(true);

  EntityValueFunction = EntityValueFunction;

  get theme(): PersonalQuestTheme {
    return editionThemes[this.personalQuest.edition] || defaultTheme;
  }
}
