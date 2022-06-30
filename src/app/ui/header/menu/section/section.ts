import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EditionData } from "src/app/game/model/data/EditionData";
import { SectionData } from "src/app/game/model/data/SectionData";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-section-menu',
  templateUrl: 'section.html',
  styleUrls: [ 'section.scss', '../menu.scss' ]
})
export class SectionMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = (gameManager.game.edition || this.editions()[ 0 ]);


  editions(): string[] {
    return gameManager.editionData.filter((editionData: EditionData) => editionData.sections && editionData.sections.length > 0).map((editionData: EditionData) => editionData.edition);
  }

  sections(): SectionData[] {
    if (!this.edition) {
      return [];
    }
    return gameManager.sectionData(true).filter((sectionData: SectionData) => sectionData.edition == this.edition).sort((a, b) => a.index - b.index);
  }

  maxSection() {
    return Math.max(...this.sections().map((sectionData: SectionData) => sectionData.index));
  }

  hasSection(sectionData: SectionData): boolean {
    return gameManager.game.sections && gameManager.game.sections.some((value: SectionData) => value.edition == sectionData.edition && value.index == sectionData.index);
  }

  addSection(sectionData: SectionData) {
    gameManager.stateManager.before();
    gameManager.addSection(sectionData);
    gameManager.stateManager.after();
  }

}