import { GardenModel } from "../model/Building";
import { Game } from "../model/Game";
import { BuildingData, BuildingRewards } from "../model/data/BuildingData";
import { ScenarioData } from "../model/data/ScenarioData";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";

export class BuildingsManager {
  game: Game;

  petsAvailable: boolean = false;
  petsEnabled: boolean = false;
  gardenAvailable: boolean = false;
  gardenEnabled: boolean = false;
  distillAvailable: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  update() {
    this.petsAvailable = gameManager.fhRules() && gameManager.game.party.buildings.find((value) => value.name == 'stables' && value.level) != undefined;
    this.petsEnabled = this.petsAvailable && settingsManager.settings.fhPets;
    this.gardenAvailable = gameManager.fhRules() && gameManager.game.party.buildings.find((value) => value.name == 'garden' && value.level) != undefined;
    this.gardenEnabled = this.gardenAvailable && settingsManager.settings.fhGarden;
    this.distillAvailable = (settingsManager.settings.characterItems || settingsManager.settings.characterSheet) && gameManager.fhRules() && gameManager.game.party.buildings.find((value) => value.name == 'alchemist' && value.level > 1 && value.state != 'wrecked') != undefined;
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

  initialBuilding(buildingData: BuildingData): boolean {
    return buildingData.costs.prosperity == 0 && buildingData.costs.lumber == 0 && buildingData.costs.metal == 0 && buildingData.costs.hide == 0 && buildingData.costs.gold == 0;
  }

  availableBuilding(buildingData: BuildingData): boolean {
    return buildingData.prosperityUnlock && buildingData.costs.prosperity <= gameManager.prosperityLevel() && !gameManager.game.party.buildings.find((model) => buildingData.name == model.name && model.level) && (!buildingData.requires || gameManager.game.party.buildings.find((model) => model.name == buildingData.requires && model.level) != undefined);
  }

  nextWeek() {
    if (this.gardenEnabled) {
      const gardenBuilding = this.game.party.buildings.find((value) => value.name == 'garden' && value.level);
      this.game.party.garden = this.game.party.garden || new GardenModel();
      if (gardenBuilding) {
        if (gardenBuilding.level < 3) {
          this.game.party.garden.flipped = !this.game.party.garden.flipped;
        } else {
          this.game.party.garden.flipped = false;
        }

        if (this.game.party.garden.automated && (gardenBuilding.level > 2 || this.game.party.garden.flipped)) {
          this.game.party.garden.plots.forEach((herb) => {
            this.game.party.loot[herb] = (this.game.party.loot[herb] || 0) + 1;
          })
        }
      }
    }
  }
}
