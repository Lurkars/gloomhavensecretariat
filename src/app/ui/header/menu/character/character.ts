import { Component, OnInit } from "@angular/core";
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
export class CharacterMenuComponent implements OnInit {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterLevel: number = 1;

  filter: string = "";
  allEditions: boolean = false;
  newUnlocks: string[] = [];
  confirm: string = "";

  characterData: Record<string, CharacterData[]> = {};

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.characterData = {};
    (this.allEditions ? gameManager.editions(true, true) : gameManager.currentEditions(true)).forEach((edition) => {
      this.characterData[edition] = this.getCharacterData(this.filter, edition);
    })
  }

  getCharacterData(filter: string, edition: string): CharacterData[] {
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
        if (!this.unlocked(a) && this.unlocked(b) && this.newUnlocks.indexOf(b.name) == -1) {
          return 1;
        }
        if (this.unlocked(a) && this.newUnlocks.indexOf(a.name) == -1 && !this.unlocked(b)) {
          return -1;
        }
        if (this.unlocked(a) && this.newUnlocks.indexOf(a.name) != -1 && this.unlocked(b) && this.newUnlocks.indexOf(b.name) == -1) {
          return 1;
        }
        if (this.unlocked(a) && this.newUnlocks.indexOf(a.name) == -1 && this.unlocked(b) && this.newUnlocks.indexOf(a.name) != -1) {
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

  locked(edition: string): boolean {
    return this.characterData[edition] && this.characterData[edition].some((characterData) => characterData.spoiler && !this.unlocked(characterData));
  }

  unlock(characterData: CharacterData) {
    if (gameManager.game.unlockedCharacters.indexOf(characterData.name) == -1) {
      if (this.confirm == characterData.name) {
        gameManager.stateManager.before("unlockChar", "data.character." + characterData.name);
        gameManager.game.unlockedCharacters.push(characterData.name);
        this.newUnlocks.push(characterData.name);
        gameManager.stateManager.after();
      } else {
        this.confirm = characterData.name;
      }
    }
  }

  cancelConfirm() {
    this.confirm = "";
  }

  unlockAll(edition: string) {
    const chars: string[] = gameManager.charactersData(edition).filter((characterData) => characterData.spoiler && !this.unlocked(characterData)).map((characterData) => characterData.name);
    if (chars.length > 0) {
      if (this.confirm == 'confirm-all-' + edition) {
        gameManager.stateManager.before("unlockAllCharacters", "data.edition." + edition);
        gameManager.game.unlockedCharacters.push(...chars);
        gameManager.stateManager.after();
      } else {
        this.confirm = 'confirm-all-' + edition;
      }
    }
  }

  noResults(): boolean {
    const editions = this.allEditions ? gameManager.editions(true, true) : gameManager.currentEditions(true);
    return editions.every((edition) => !this.characterData[edition] || this.characterData[edition].length == 0);
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