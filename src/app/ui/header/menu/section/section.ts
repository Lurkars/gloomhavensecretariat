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
  edition: string = gameManager.currentEdition();

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
    return gameManager.sectionData().filter((sectionData) => sectionData.edition == this.edition && sectionData.group == group).sort((a, b) => {
      if (!isNaN(+a.index) && !isNaN(+b.index)) {
        return +a.index - +b.index;
      }

      const aMatch = a.index.match(/(\d+)/);
      const bMatch = b.index.match(/(\d+)/);

      if (aMatch && bMatch) {
        return +(aMatch[0]) - +(bMatch[0]);
      }

      return a.index.toLowerCase() < b.index.toLowerCase() ? -1 : 1
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