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
    return gameManager.editionData.filter((editionData: EditionData) => editionData.sections && editionData.sections.length > 0).map((editionData) => editionData.edition);
  }


  groups(): (string | undefined)[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.sectionData(true).filter((sectionData: SectionData) => sectionData.edition == this.edition).map((sectionData) => sectionData.group).filter((value: string | undefined, index: number, self: (string | undefined)[]) => self.indexOf(value) === index);
  }

  sections(group: string | undefined = undefined): SectionData[] {
    if (!this.edition) {
      return [];
    }
    return gameManager.sectionData(true).filter((sectionData: SectionData) => sectionData.edition == this.edition && sectionData.group == group).sort((sA, sB) => {
      const a = sA.index;
      const b = sB.index;
      if (!isNaN(+a) && !isNaN(+b)) {
        return +a - +b;
      }

      return a.toLowerCase() < b.toLowerCase() ? -1 : 1
    });
  }

  maxSection() {
    return Math.max(...this.sections().map((sectionData) => sectionData.index.length));
  }

  hasSection(sectionData: SectionData): boolean {
    return gameManager.game.sections && gameManager.game.sections.some((value) => value.edition == sectionData.edition && value.index == sectionData.index && value.group == sectionData.group);
  }

  addSection(sectionData: SectionData) {
    gameManager.stateManager.before();
    gameManager.scenarioManager.addSection(sectionData);
    gameManager.stateManager.after();
  }

}