import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { ghsTextSearch } from "src/app/ui/helper/Static";

@Component({
  selector: 'ghs-character-menu',
  templateUrl: 'character.html',
  styleUrls: ['../menu.scss', 'character.scss']
})
export class CharacterMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterLevel: number = 1;

  filter: string = "";
  allEditions: boolean = false;

  characterData(filter: string, edition: string | undefined = undefined): CharacterData[] {
    return gameManager.charactersData(edition).filter((characterData) => ((!characterData.locked || this.unlocked(characterData)) && (ghsTextSearch(characterData.name, filter) || this.unlocked(characterData) && ghsTextSearch(settingsManager.getLabel('data.character.' + characterData.name), filter))) || characterData.locked && ghsTextSearch(settingsManager.getLabel('data.character.' + characterData.name), filter, true)).sort((a, b) => {
      const aName = settingsManager.getLabel('data.character.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.character.' + b.name).toLowerCase();

      if (a.spoiler && !b.spoiler) {
        return 1;
      }
      if (!a.spoiler && b.spoiler) {
        return -1;
      }

      if (a.spoiler && b.spoiler) {
        if (!this.unlocked(a) && this.unlocked(b)) {
          return 1;
        }
        if (this.unlocked(a) && !this.unlocked(b)) {
          return -1;
        }
      }

      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
  }

  unlocked(characterData: CharacterData): boolean {
    return !characterData.spoiler || gameManager.game.unlockedCharacters.indexOf(characterData.name) != -1;
  }

  locked(characterData: CharacterData[]): boolean {
    return characterData.some((characterData) => characterData.spoiler && !this.unlocked(characterData));
  }

  async unlock(characterData: CharacterData) {
    if (gameManager.game.unlockedCharacters.indexOf(characterData.name) == -1) {
      await gameManager.stateManager.before("unlockChar", "data.character." + characterData.name);
      gameManager.game.unlockedCharacters.push(characterData.name);
      await gameManager.stateManager.after();
    }
  }

  async unlockAll(edition: string) {
    const chars: string[] = gameManager.charactersData(edition).filter((characterData) => characterData.spoiler && !this.unlocked(characterData)).map((characterData) => characterData.name);
    if (chars.length > 0) {
      await gameManager.stateManager.before("unlockAllCharacters", "data.edition." + edition);
      gameManager.game.unlockedCharacters.push(...chars);
      await gameManager.stateManager.after();
    }
  }

  noResults(): boolean {
    const editions = this.allEditions ? gameManager.editions() : gameManager.currentEditions(true);
    return editions.every((edition) => this.characterData(this.filter, edition).length == 0);
  }

  async addCharacter(characterData: CharacterData) {
    await gameManager.stateManager.before("addChar", "data.character." + characterData.name);
    gameManager.characterManager.addCharacter(characterData, this.characterLevel);
    await gameManager.stateManager.after();
  }

  hasCharacter(characterData: CharacterData) {
    return gameManager.game.figures.some((figure) => {
      return figure instanceof Character && characterData.name == figure.name && characterData.edition == figure.edition;
    })
  }

}