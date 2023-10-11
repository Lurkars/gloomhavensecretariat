import { Game } from "../model/Game";
import { BuildingRewards } from "../model/data/BuildingData";
import { ScenarioData } from "../model/data/ScenarioData";
import { gameManager } from "./GameManager";

export class BuildingsManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  applyRewards(rewards: BuildingRewards) {
    if (rewards.defense) {
      this.game.party.defense += rewards.defense;
    }
    if (rewards.loseMorale) {
      this.game.party.morale -= rewards.loseMorale;
      if (this.game.party.morale < 0) {
        this.game.party.morale = 0;
      }
    }
    if (rewards.prosperity) {
      this.game.party.prosperity += rewards.prosperity;
    }

    if (rewards.soldiers) {
      this.game.party.soldiers += rewards.soldiers;
      const baracks = this.game.party.buildings.find((model) => model.name == 'barracks');
      if (baracks) {
        let limit = 0;
        if (baracks.level == 1) {
          limit = 4;
        } else if (baracks.level == 2) {
          limit = 6;
        } else if (baracks.level == 3) {
          limit = 8;
        } else if (baracks.level == 4) {
          limit = 10;
        }
        if (this.game.party.soldiers > limit) {
          this.game.party.soldiers = limit;
        }
      }
    }
  }

  rewardSection(section: ScenarioData): ScenarioData | undefined {
    if (gameManager.game.party.conclusions.find((model) => model.edition == section.edition && model.index == section.index && model.group == section.group)) {
      return section;
    }

    const conclusions = gameManager.sectionData(section.edition).filter((sectionData) => sectionData.conclusion && !sectionData.parent && sectionData.parentSections && sectionData.parentSections.find((parentSections) => parentSections.length == 1 && parentSections.indexOf(section.index) != -1));

    if (conclusions.length == 0) {
      return undefined;
    } else {
      let result: ScenarioData | undefined;
      conclusions.forEach((conclusion) => {
        if (!result) {
          result = this.rewardSection(conclusion);
        }
      })

      return result;
    }
  }
}
