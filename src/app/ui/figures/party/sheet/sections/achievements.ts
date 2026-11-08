import { Component, input } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';
import { AutocompleteDirective, AutocompleteItem } from 'src/app/ui/helper/autocomplete';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [GhsLabelDirective, AutocompleteDirective],
  selector: 'ghs-party-sheet-achievements',
  templateUrl: 'achievements.html',
  styleUrls: ['../../../sheet.scss', './achievements.scss']
})
export class PartySheetAchievementsComponent extends PartySheetSection {
  readonly global = input<boolean>(false);

  autocompleteItems: AutocompleteItem[] = [];
  achievementsList: string[] = [];

  get type(): 'partyAchievements' | 'globalAchievements' {
    return this.global() ? 'globalAchievements' : 'partyAchievements';
  }

  get list(): string[] {
    return this.global() ? this.party.globalAchievementsList : this.party.achievementsList;
  }

  override update(): void {
    this.autocompleteItems = [];
    const editionData = gameManager.editionData.find((editionData) => this.edition() && editionData.edition === this.edition());
    if (editionData) {
      this.updateAutocomplete(editionData);
      if (editionData.extends?.length) {
        editionData.extends.forEach((extension) => {
          const extensionData = gameManager.editionData.find((editionData) => editionData.edition === extension);
          if (extensionData) {
            this.updateAutocomplete(extensionData);
          }
        });
      }
    }

    this.achievementsList = this.list
      .map((achievement, index, self) => achievement + ':' + self.filter((other) => other === achievement).length)
      .filter((achivement, index, self) => self.indexOf(achivement) === index);
  }

  updateAutocomplete(editionData: EditionData) {
    const locale = settingsManager.settings.locale;
    if (!this.global()) {
      if (editionData.label && editionData.label[locale] && editionData.label[locale].partyAchievements) {
        this.autocompleteItems.push(...this.items(editionData.label[locale].partyAchievements));
      } else if (editionData.label && editionData.label['en'] && editionData.label['en'].partyAchievements) {
        this.autocompleteItems.push(...this.items(editionData.label['en'].partyAchievements));
      }
    } else {
      if (editionData.label && editionData.label[locale] && editionData.label[locale].globalAchievements) {
        this.autocompleteItems.push(...this.items(editionData.label[locale].globalAchievements));
      }
      if (editionData.label && editionData.label['en'] && editionData.label['en'].globalAchievements) {
        this.items(editionData.label['en'].globalAchievements).forEach((item) => {
          if (this.autocompleteItems.every((other) => item.value !== other.value)) {
            this.autocompleteItems.push(item);
          }
        });
      }
    }
  }

  items(labels: Record<string, string>): AutocompleteItem[] {
    return Object.keys(labels).map(
      (achievement) => new AutocompleteItem(labels[achievement], achievement, this.list.includes(achievement))
    );
  }

  addAchievement(input: HTMLInputElement) {
    if (input.value) {
      let achievement = input.value;
      Object.keys(settingsManager.label.data[this.type]).forEach((key) => {
        if (settingsManager.label.data[this.type][key].toLowerCase() === achievement.toLowerCase()) {
          achievement = key;
        }
      });
      gameManager.stateManager.before(this.global() ? 'addGlobalAchievement' : 'addPartyAchievement', achievement);
      this.list.push(achievement);
      gameManager.stateManager.after();
      input.value = '';
      this.update();
    }
  }

  removeAchievement(achievement: string) {
    const a = achievement.split(':')[0];
    gameManager.stateManager.before(this.global() ? 'removeGlobalAchievement' : 'removePartyAchievement', a);
    this.list.splice(this.list.lastIndexOf(a), 1);
    gameManager.stateManager.after();
    this.update();
  }
}
