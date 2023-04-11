import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { CharacterData } from "src/app/game/model/data/CharacterData";
import { ghsHasSpoilers, ghsIsSpoiled, ghsNotSpoiled, ghsTextSearch } from "src/app/ui/helper/Static";

@Component({
  selector: 'ghs-character-menu',
  templateUrl: 'character.html',
  styleUrls: ['../menu.scss', 'character.scss']
})
export class CharacterMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterLevel: number = 1;
  hasSpoilers = ghsHasSpoilers;
  isSpoiled = ghsIsSpoiled;
  notSpoiled = ghsNotSpoiled;

  filter: string = "";
  allEditions: boolean = false;

  characterData(filter: string, edition: string | undefined = undefined): CharacterData[] {
    return gameManager.charactersData(edition).filter((characterData) => ((!characterData.locked || this.isSpoiled(characterData)) && (ghsTextSearch(characterData.name, filter) || this.isSpoiled(characterData) && ghsTextSearch(settingsManager.getLabel('data.character.' + characterData.name), filter))) || characterData.locked && ghsTextSearch(settingsManager.getLabel('data.character.' + characterData.name), filter, true)).sort((a, b) => {
      const aName = settingsManager.getLabel('data.character.' + a.name).toLowerCase();
      const bName = settingsManager.getLabel('data.character.' + b.name).toLowerCase();

      if (a.spoiler && !b.spoiler) {
        return 1;
      }
      if (!a.spoiler && b.spoiler) {
        return -1;
      }

      if (a.spoiler && b.spoiler) {
        if (!this.isSpoiled(a) && this.isSpoiled(b)) {
          return 1;
        }
        if (this.isSpoiled(a) && !this.isSpoiled(b)) {
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

  noResults(): boolean {
    const editions = this.allEditions ? gameManager.editions() : gameManager.currentEditions(true);
    return editions.every((edition) => this.characterData(this.filter, edition).length == 0);
  }

  addCharacter(characterData: CharacterData) {
    gameManager.stateManager.before("addChar", "data.character." + characterData.name);
    gameManager.characterManager.addCharacter(characterData, this.characterLevel);
    gameManager.stateManager.after();
  }

  hasCharacter(characterData: CharacterData) {
    return gameManager.game.figures.some((figure) => {
      return figure instanceof Character && characterData.name == figure.name && characterData.edition == figure.edition;
    })
  }

}