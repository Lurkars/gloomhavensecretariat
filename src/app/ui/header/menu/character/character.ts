import { NgClass } from '@angular/common';
import { Component, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { gameManager, labelManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { ghsTextSearch } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [NgClass, FormsModule, GhsRangePipe, GhsLabelDirective, TabClickDirective, TrackUUIDPipe],
  selector: 'ghs-character-menu',
  templateUrl: 'character.html',
  styleUrls: ['../menu.scss', 'character.scss']
})
export class CharacterMenuComponent implements OnInit {
  readonly closed = output();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterLevel: number = 1;

  filter: string = '';
  allEditions: boolean = false;
  newUnlocks: string[] = [];
  confirm: string = '';

  characterData: Record<string, CharacterData[]> = {};

  ngOnInit(): void {
    this.characterLevel = gameManager.fhRules(true)
      ? Math.ceil(gameManager.campaignManager.prosperityLevel() / 2)
      : gameManager.campaignManager.prosperityLevel();
    this.update();
  }

  editions(): string[] {
    return this.allEditions ? gameManager.editionManager.editions(true, true) : gameManager.editionManager.relevantEditions();
  }

  update() {
    this.characterData = {};
    this.editions().forEach((edition) => {
      this.characterData[edition] = this.getCharacterData(this.filter, edition);
    });
  }

  getCharacterData(filter: string, edition: string): CharacterData[] {
    return gameManager.editionManager
      .charactersData(edition)
      .filter((characterData) => gameManager.matchesEditionRules(characterData))
      .filter(
        (characterData) =>
          ((!characterData.locked || this.unlocked(characterData)) &&
            (ghsTextSearch(characterData.name, filter) ||
              (this.unlocked(characterData) &&
                ghsTextSearch(labelManager.getLabel('data.character.' + characterData.edition + '.' + characterData.name), filter)))) ||
          (characterData.locked &&
            ghsTextSearch(labelManager.getLabel('data.character.' + characterData.edition + '.' + characterData.name), filter, true))
      )
      .sort((a, b) => {
        const aName = labelManager.getLabel('data.character.' + a.edition + '.' + a.name).toLowerCase();
        const bName = labelManager.getLabel('data.character.' + b.edition + '.' + b.name).toLowerCase();

        if (a.spoiler && !b.spoiler) {
          return 1;
        }
        if (!a.spoiler && b.spoiler) {
          return -1;
        }

        if (a.spoiler && b.spoiler) {
          if (!this.unlocked(a) && this.unlocked(b) && !this.newUnlocks.includes(b.name)) {
            return 1;
          }
          if (this.unlocked(a) && !this.newUnlocks.includes(a.name) && !this.unlocked(b)) {
            return -1;
          }
          if (this.unlocked(a) && this.newUnlocks.includes(a.name) && this.unlocked(b) && !this.newUnlocks.includes(b.name)) {
            return 1;
          }
          if (this.unlocked(a) && !this.newUnlocks.includes(a.name) && this.unlocked(b) && this.newUnlocks.includes(a.name)) {
            return -1;
          }
          if (!this.unlocked(a) && !this.unlocked(b)) {
            return b.name > a.name ? -1 : 1;
          }
        }

        return bName > aName ? -1 : 1;
      });
  }

  unlocked(characterData: CharacterData): boolean {
    return !characterData.spoiler || gameManager.game.unlockedCharacters.includes(characterData.edition + ':' + characterData.name);
  }

  locked(edition: string): boolean {
    return (
      this.characterData[edition] &&
      this.characterData[edition].some((characterData) => characterData.spoiler && !this.unlocked(characterData))
    );
  }

  unlock(characterData: CharacterData) {
    if (!gameManager.game.unlockedCharacters.includes(characterData.edition + ':' + characterData.name)) {
      if (this.confirm === characterData.name) {
        gameManager.stateManager.before('unlockChar', 'data.character.' + characterData.edition + '.' + characterData.name);
        gameManager.characterManager.unlockCharacter(characterData.edition, characterData.name);
        this.newUnlocks.push(characterData.name);
        gameManager.stateManager.after();
      } else {
        this.confirm = characterData.name;
      }
    }
  }

  cancelConfirm() {
    this.confirm = '';
  }

  unlockAll(edition: string) {
    const chars: string[] = gameManager.editionManager
      .charactersData(edition)
      .filter((characterData) => characterData.spoiler && !this.unlocked(characterData))
      .map((characterData) => characterData.name);
    if (chars.length > 0) {
      if (this.confirm === 'confirm-all-' + edition) {
        gameManager.stateManager.before('unlockAllCharacters', 'data.edition.' + edition);
        chars.forEach((name) => gameManager.characterManager.unlockCharacter(edition, name));
        gameManager.stateManager.after();
      } else {
        this.confirm = 'confirm-all-' + edition;
      }
    }
  }

  noResults(): boolean {
    return this.editions().every((edition) => !this.characterData[edition] || this.characterData[edition].length === 0);
  }

  addCharacter(characterData: CharacterData) {
    gameManager.stateManager.before('addChar', 'data.character.' + characterData.edition + '.' + characterData.name);
    gameManager.characterManager.addCharacter(characterData, this.characterLevel);
    gameManager.stateManager.after();
    if (gameManager.bbRules()) {
      this.closed.emit();
    }
  }

  hasCharacter(characterData: CharacterData) {
    return (
      gameManager.game.figures.some((figure) => {
        return figure instanceof Character && characterData.name === figure.name && characterData.edition === figure.edition;
      }) ||
      (gameManager.game.party.availableCharacters &&
        gameManager.game.party.availableCharacters.some((availableCharacter) => {
          return characterData.name === availableCharacter.name && characterData.edition === availableCharacter.edition;
        }))
    );
  }
}
