import { Component } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ScenarioData } from "src/app/game/model/data/ScenarioData";
import { GameState } from "src/app/game/model/Game";

@Component({
  selector: 'ghs-section-menu',
  templateUrl: 'section.html',
  styleUrls: ['../menu.scss', 'section.scss']
})
export class SectionMenuComponent {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  edition: string = (gameManager.game.edition || this.editions()[0]);


  editions(): string[] {
    return gameManager.editionData.filter((editionData) => editionData.sections && editionData.sections.length > 0).map((editionData) => editionData.edition);
  }


  groups(): (string | undefined)[] {
    if (!this.edition) {
      return [];
    }

    return gameManager.sectionData().filter((sectionData) => sectionData.edition == this.edition).map((sectionData) => sectionData.group).filter((value, index, self) => self.indexOf(value) === index);
  }

  sections(group: string | undefined = undefined): ScenarioData[] {
    if (!this.edition) {
      return [];
    }
    return gameManager.sectionData().filter((sectionData) => sectionData.edition == this.edition && sectionData.group == group).sort((sA, sB) => {
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

  hasSection(sectionData: ScenarioData): boolean {
    return gameManager.game.sections && gameManager.game.sections.some((value) => value.edition == sectionData.edition && value.index == sectionData.index && value.group == sectionData.group);
  }

  addSection(sectionData: ScenarioData) {
    gameManager.stateManager.before("addSection", sectionData.index, "data.scenario." + sectionData.name, "data.edition." + sectionData.edition);
    gameManager.scenarioManager.addSection(sectionData);
    gameManager.stateManager.after();
  }

}