import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { HeaderComponent } from 'src/app/ui/header/header';
import { downloadJson } from 'src/app/ui/helper/Static';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

@Component({
  imports: [FormsModule, GhsLabelDirective, TrackUUIDPipe, HeaderComponent],
  selector: 'ghs-edition-editor',
  templateUrl: './edition.html',
  styleUrls: ['./editor.scss', './edition.scss']
})
export class EditionEditorComponent implements OnInit {
  readonly inputEditionData = viewChild.required<ElementRef>('inputEditionData');
  private changeDetectorRef = inject(ChangeDetectorRef);

  gameManager: GameManager = gameManager;
  Conditions: ConditionName[] = Object.values(ConditionName).filter(
    (condition) =>
      condition !== ConditionName.invalid &&
      condition !== ConditionName.bless &&
      condition !== ConditionName.curse &&
      !new Condition(condition).types.includes(ConditionType.helper) &&
      !new Condition(condition).types.includes(ConditionType.immunityOnly)
  );

  editionData: EditionData;
  // copy of the loaded edition data: the trackUUID pipe is pure and does not see changes of the mutated gameManager.editionData array
  editionsData: EditionData[] = [];
  editionError: any;

  constructor() {
    this.editionData = new EditionData('', [], [], [], [], [], []);
  }

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    this.editionsData = [...gameManager.editionData];
    this.editionDataToJson();
    // zoneless: render the loaded edition data
    this.changeDetectorRef.markForCheck();
  }

  editionDataToJson() {
    const compactData: any = JSON.parse(JSON.stringify(this.editionData));

    Object.keys(compactData).forEach((key) => {
      if (!compactData[key]) {
        compactData[key] = undefined;
      }
    });

    this.inputEditionData().nativeElement.value = JSON.stringify(compactData, null, 2);
  }

  jsonDownload(): void {
    const compactData: any = JSON.parse(JSON.stringify(this.editionData));

    Object.keys(compactData).forEach((key) => {
      if (!compactData[key]) {
        compactData[key] = undefined;
      }
    });

    downloadJson(compactData, this.editionData.edition + '.json');
  }

  loadEditionData(event: any) {
    const index = +event.target.value;
    this.editionData = index !== -1 ? this.editionsData[index] : new EditionData('', [], [], [], [], [], []);
    this.editionDataToJson();
  }

  toggleAllConditions(conditionSelect: HTMLSelectElement) {
    if (this.editionData.conditions.length === this.Conditions.length) {
      this.editionData.conditions = [];
      conditionSelect.blur();
    } else {
      this.editionData.conditions = JSON.parse(JSON.stringify(this.Conditions));
      conditionSelect.focus();
    }
    this.editionDataToJson();
  }

  addCharacterJson(event: any) {
    if (event.target.files) {
      for (let i = 0; i < event.target.files.length; i++) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const character: CharacterData = JSON.parse(reader.result as string);
            if (character) {
              if (
                !this.editionData.characters.find(
                  (characterData) => character.name === characterData.name && character.edition === characterData.edition
                )
              ) {
                this.editionData.characters.push(new CharacterData(character));
                this.editionDataToJson();
              }
            }
            return;
          } catch (e) {
            console.error(e);
          }
        };
        reader.readAsText(event.target.files[i]);
      }
    }
    event.target.value = '';
  }

  removeCharacter(index: number) {
    this.editionData.characters.splice(index, 1);
    this.editionDataToJson();
  }

  addMonsterJson(event: any) {
    if (event.target.files) {
      for (let i = 0; i < event.target.files.length; i++) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const monster: MonsterData = JSON.parse(reader.result as string);
            if (monster) {
              if (
                !this.editionData.monsters.find(
                  (monsterData) => monster.name === monsterData.name && monster.edition === monsterData.edition
                )
              ) {
                this.editionData.monsters.push(new MonsterData(monster));
                this.editionDataToJson();
              }
            }
            return;
          } catch (e) {
            console.error(e);
          }
        };
        reader.readAsText(event.target.files[i]);
      }
    }
    event.target.value = '';
  }

  removeMonster(index: number) {
    this.editionData.monsters.splice(index, 1);
    this.editionDataToJson();
  }

  addDeckJson(event: any) {
    if (event.target.files) {
      for (let i = 0; i < event.target.files.length; i++) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const deck: DeckData = JSON.parse(reader.result as string);
            if (deck) {
              if (!this.editionData.decks.find((deckData) => deck.name === deckData.name && deck.edition === deckData.edition)) {
                this.editionData.decks.push(deck);
                this.editionDataToJson();
              }
            }
            return;
          } catch (e) {
            console.error(e);
          }
        };
        reader.readAsText(event.target.files[i]);
      }
    }
    event.target.value = '';
  }

  removeDeck(index: number) {
    this.editionData.decks.splice(index, 1);
    this.editionDataToJson();
  }
}
