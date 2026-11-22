import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel, GardenModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { BuildingCosts, BuildingData, BuildingRewards, BuildingTrade, SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { LootType, materialResourceLootTypes } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { PetIdentifier } from 'src/app/game/model/data/PetCard';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';
import { Game } from 'src/app/game/model/Game';

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
    this.petsAvailable =
      gameManager.fhRules() && gameManager.game.party.buildings.find((value) => value.name === 'stables' && value.level) !== undefined;
    this.petsEnabled = this.petsAvailable && settingsManager.settings.fhPets;
    this.gardenAvailable =
      gameManager.fhRules() && gameManager.game.party.buildings.find((value) => value.name === 'garden' && value.level) !== undefined;
    this.gardenEnabled = this.gardenAvailable && settingsManager.settings.fhGarden;
    this.distillAvailable =
      (settingsManager.settings.characterItems || settingsManager.settings.characterSheet) &&
      gameManager.fhRules() &&
      gameManager.game.party.buildings.find((value) => value.name === 'alchemist' && value.level > 1 && value.state !== 'wrecked') !=
        undefined;
  }

  trade(building: BuildingModel): BuildingTrade | undefined {
    if (!building.level || building.state !== 'normal') {
      return undefined;
    }
    const level = building.level;
    switch (building.name) {
      case 'hunting-lodge':
        return new BuildingTrade(building.name, LootType.money, 2, [LootType.hide], 1, Math.min(level, 4));
      case 'logging-camp':
        return new BuildingTrade(building.name, LootType.money, 2, [LootType.lumber], 1, Math.min(level, 4));
      case 'mining-camp':
        return new BuildingTrade(building.name, LootType.money, 2, [LootType.metal], 1, Math.min(level, 4));
      case 'inn':
        return new BuildingTrade(building.name, LootType.money, 2, [...materialResourceLootTypes], 1, Math.min(level, 3), true);
      case 'hide-depot':
        return new BuildingTrade(building.name, LootType.hide, 1, [LootType.money], 5, Math.min(level, 2));
      case 'lumber-depot':
        return new BuildingTrade(building.name, LootType.lumber, 1, [LootType.money], 5, Math.min(level, 2));
      case 'metal-depot':
        return new BuildingTrade(building.name, LootType.metal, 1, [LootType.money], 5, Math.min(level, 2));
    }
    return undefined;
  }

  applyRewards(rewards: BuildingRewards) {
    if (rewards.defense) {
      this.game.party.defense += rewards.defense;
    }
    if (rewards.loseMorale) {
      gameManager.campaignManager.changeMorale(-rewards.loseMorale);
    }
    if (rewards.prosperity) {
      gameManager.campaignManager.changeProsperity(rewards.prosperity);
    }

    if (rewards.soldiers) {
      this.addSoldiers(rewards.soldiers);
    }
  }

  // add soldiers, limited by the capacity of the barracks
  addSoldiers(value: number) {
    this.game.party.soldiers = Math.max(0, this.game.party.soldiers + value);
    const baracks = this.game.party.buildings.find((model) => model.name === 'barracks');
    if (baracks) {
      let limit = 0;
      if (baracks.level === 1) {
        limit = 4;
      } else if (baracks.level === 2) {
        limit = 6;
      } else if (baracks.level === 3) {
        limit = 8;
      } else if (baracks.level === 4) {
        limit = 10;
      }
      if (this.game.party.soldiers > limit) {
        this.game.party.soldiers = limit;
      }
    }
  }

  rewardSection(section: ScenarioData): ScenarioData | undefined {
    if (
      gameManager.game.party.conclusions.find(
        (model) => model.edition === section.edition && model.index === section.index && model.group === section.group
      )
    ) {
      return section;
    }

    const conclusions = gameManager
      .sectionData(section.edition)
      .filter(
        (sectionData) =>
          sectionData.conclusion &&
          !sectionData.parent &&
          sectionData.parentSections &&
          sectionData.parentSections.find((parentSections) => parentSections.length === 1 && parentSections.includes(section.index))
      );

    if (conclusions.length === 0) {
      return undefined;
    } else {
      let result: ScenarioData | undefined;
      conclusions.forEach((conclusion) => {
        if (!result) {
          result = this.rewardSection(conclusion);
        }
      });

      return result;
    }
  }

  initialBuilding(buildingData: BuildingData): boolean {
    return (
      buildingData.costs.prosperity === 0 &&
      buildingData.costs.lumber === 0 &&
      buildingData.costs.metal === 0 &&
      buildingData.costs.hide === 0 &&
      buildingData.costs.gold === 0
    );
  }

  availableBuilding(buildingData: BuildingData): boolean {
    return (
      buildingData.prosperityUnlock &&
      buildingData.costs.prosperity <= gameManager.campaignManager.prosperityLevel() &&
      !gameManager.game.party.buildings.find((model) => buildingData.name === model.name && model.level) &&
      (!buildingData.requires ||
        gameManager.game.party.buildings.find((model) => model.name === buildingData.requires && model.level) !== undefined)
    );
  }

  partyResource(type: LootType): number {
    return (
      (this.game.party.loot[type] || 0) +
      this.game.figures
        .filter((figure) => figure instanceof Character)
        .map((character) => character.progress.loot[type] || 0)
        .reduce((a, b) => a + b, 0)
    );
  }

  private resourcesAffordable(costs: BuildingCosts): boolean {
    let discount =
      this.game.party.buildings.find(
        (buildingModel) => buildingModel.name === 'carpenter' && buildingModel.level > 0 && buildingModel.state !== 'wrecked'
      ) !== undefined;
    let inspiration = this.game.party.inspiration;
    return materialResourceLootTypes.every((type) => {
      const cost = costs[type as 'lumber' | 'metal' | 'hide'] || 0;
      const available = this.partyResource(type);
      if (cost <= available) {
        return true;
      }
      if (inspiration && cost <= available + inspiration) {
        inspiration -= cost - available;
        return true;
      }
      if (discount && cost === available + 1) {
        discount = false;
        return true;
      }
      return false;
    });
  }

  unlockBuildings(): boolean {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign || !campaign.buildings) {
      return false;
    }
    let changed = false;
    campaign.buildings
      .filter((buildingData) => this.initialBuilding(buildingData))
      .forEach((buildingData) => {
        if (!this.game.party.buildings.some((model) => model.name === buildingData.name)) {
          this.game.party.buildings.push(new BuildingModel(buildingData.name, 1));
          if (buildingData.rewards && buildingData.rewards[0]) {
            this.applyRewards(buildingData.rewards[0]);
          }
          changed = true;
        }
      });

    campaign.buildings
      .filter(
        (buildingData) => buildingData.prosperityUnlock && buildingData.costs.prosperity <= gameManager.campaignManager.prosperityLevel()
      )
      .forEach((buildingData) => {
        if (
          !this.game.party.buildings.some((model) => model.name === buildingData.name) &&
          (!buildingData.requires || this.game.party.buildings.some((model) => model.name === buildingData.requires && model.level))
        ) {
          this.game.party.buildings.push(new BuildingModel(buildingData.name, 0));
          changed = true;
        }
      });
    return changed;
  }

  resetBuildings() {
    const campaign = gameManager.campaignManager.campaignData();
    if (campaign && campaign.buildings) {
      campaign.buildings
        .filter((buildingData) => this.initialBuilding(buildingData) && buildingData.rewards && buildingData.rewards[0])
        .filter((buildingData) => this.game.party.buildings.some((model) => model.name === buildingData.name))
        .forEach((buildingData) => {
          const rewards = buildingData.rewards[0];
          this.game.party.defense -= rewards.defense || 0;
          this.game.party.soldiers = Math.max(0, this.game.party.soldiers - (rewards.soldiers || 0));
          this.game.party.prosperity = Math.max(0, this.game.party.prosperity - (rewards.prosperity || 0));
          if (rewards.loseMorale) {
            gameManager.campaignManager.changeMorale(rewards.loseMorale);
          }
        });
    }
    this.game.party.buildings = [];
  }

  upgradeable(data: BuildingData, model: BuildingModel): boolean {
    if (model.level && !data.repair) {
      return false;
    }

    if (data.repair && model.state === 'damaged') {
      return (
        this.partyResource(LootType.lumber) +
          this.partyResource(LootType.metal) +
          this.partyResource(LootType.hide) +
          this.game.party.inspiration >
          data.repair[model.level - 1] || this.game.party.morale > 0
      );
    }

    if (model.state === 'wrecked') {
      return this.resourcesAffordable(data.rebuild[model.level - 1]);
    }

    if (model.level < data.upgrades.length + 1) {
      const costs: BuildingCosts = model.level ? data.upgrades[model.level - 1] : data.costs;
      if (costs.prosperity && costs.prosperity > gameManager.campaignManager.prosperityLevel()) {
        return false;
      }

      if (!this.resourcesAffordable(costs)) {
        return false;
      }

      const characterGold = this.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure.progress.gold);
      return characterGold.length > 0 && (costs.gold || 0) <= characterGold.reduce((a, b) => a + b);
    }

    return false;
  }

  upgradeCosts(data: BuildingData, model: BuildingModel): BuildingCosts {
    return model.level ? data.upgrades[model.level - 1] : data.costs;
  }

  pay(payment: SelectResourceResult | undefined) {
    if (payment) {
      if (payment.morale) {
        gameManager.campaignManager.changeMorale(-payment.morale);
      } else {
        gameManager.lootManager.applySelectResources(payment);
      }
    }
  }

  upgradeBuilding(
    data: BuildingData,
    model: BuildingModel,
    payment: SelectResourceResult | undefined = undefined
  ): BuildingRewards | undefined {
    this.pay(payment);
    model.level++;
    gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.buildings);
    this.unlockBuildings();
    if (this.game.party.campaignMode && settingsManager.settings.applyBuildingRewards && data.rewards && data.rewards[model.level - 1]) {
      const rewards = data.rewards[model.level - 1];
      this.applyRewards(rewards);
      return rewards;
    }
    return undefined;
  }

  rebuildBuilding(model: BuildingModel, payment: SelectResourceResult | undefined = undefined) {
    this.pay(payment);
    model.state = 'normal';
  }

  repairBuilding(model: BuildingModel, payment: SelectResourceResult | undefined = undefined) {
    this.pay(payment);
    model.state = 'normal';
  }

  nextBuildingState(data: BuildingData, model: BuildingModel, force: boolean = false): 'normal' | 'damaged' | 'wrecked' | undefined {
    if (!data.repair || model.level < 1) {
      return undefined;
    }
    if (model.state === 'normal') {
      return 'damaged';
    } else if (model.state === 'damaged') {
      return 'wrecked';
    } else if (force && model.state === 'wrecked') {
      return 'normal';
    }
    return undefined;
  }

  removableBuilding(data: BuildingData): boolean {
    return !this.initialBuilding(data) && !this.availableBuilding(data);
  }

  downgradeable(data: BuildingData, model: BuildingModel): boolean {
    return this.removableBuilding(data) || model.level > 1;
  }

  downgradeBuilding(data: BuildingData, model: BuildingModel, remove: boolean = false) {
    const index = this.game.party.buildings.indexOf(model);
    if (index === -1) {
      return;
    }
    if (this.removableBuilding(data) && (model.level === 0 || remove)) {
      model.state = 'normal';
      this.game.party.buildings.splice(index, 1);
      this.removeRewardConclusion(data, 0);
    } else if (this.downgradeable(data, model)) {
      model.level--;
      if (model.level === 0) {
        model.state = 'normal';
      }
      this.removeRewardConclusion(data, model.level);
    }
  }

  private removeRewardConclusion(data: BuildingData, level: number) {
    if (this.game.party.campaignMode && data.rewards && data.rewards[level] && data.rewards[level].section) {
      const section = gameManager
        .sectionData(gameManager.currentEdition())
        .find((sectionData) => sectionData.index === data.rewards[level].section);
      if (section) {
        const conclusion = this.rewardSection(section);
        if (conclusion) {
          this.game.party.conclusions = this.game.party.conclusions.filter(
            (model) => model.edition !== conclusion.edition || model.group !== conclusion.group || model.index !== conclusion.index
          );
        }
      }
    }
  }

  plantGardenHerb(herb: LootType, slot: number, source: Character | 'party' | undefined = undefined) {
    const garden = Object.assign(new GardenModel(), this.game.party.garden || new GardenModel());
    garden.plots = garden.plots || [];
    garden.plots[slot] = herb;
    if (source === 'party') {
      this.game.party.loot[herb] = (this.game.party.loot[herb] || 1) - 1;
    } else if (source) {
      source.progress.loot[herb] = (source.progress.loot[herb] || 1) - 1;
    }
    this.game.party.garden = garden;
  }

  harvestGarden() {
    if (this.game.party.garden) {
      this.game.party.garden.plots.forEach((herb) => {
        if (herb) {
          this.game.party.loot[herb] = (this.game.party.loot[herb] || 0) + 1;
        }
      });
    }
  }

  setPetActive(pet: PetIdentifier, active: boolean, force: boolean = false) {
    pet.active = active;
    const stables = this.game.party.buildings.find((building) => building.name === 'stables' && building.level);
    while (!force && stables && this.game.party.pets.filter((value) => value.active).length > (stables.level < 3 ? 1 : 2)) {
      const other = this.game.party.pets.find((value) => value.active && value !== pet);
      if (!other) {
        break;
      }
      other.active = false;
    }
  }

  nextWeek() {
    if (this.gardenEnabled) {
      const gardenBuilding = this.game.party.buildings.find((value) => value.name === 'garden' && value.level);
      this.game.party.garden = this.game.party.garden || new GardenModel();
      if (gardenBuilding) {
        if (gardenBuilding.level < 3) {
          this.game.party.garden.flipped = !this.game.party.garden.flipped;
        } else {
          this.game.party.garden.flipped = false;
        }

        if (this.game.party.garden.automated && (gardenBuilding.level > 2 || this.game.party.garden.flipped)) {
          this.harvestGarden();
        }
      }
    }
  }

  coordinatesFromModel(input: BuildingModel): WorldMapCoordinates | undefined {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign) {
      return undefined;
    }
    const buildingData = campaign.buildings.find((data) => data.name === input.name);
    if (!buildingData || !buildingData.coordinates || !buildingData.coordinates.length) {
      return undefined;
    }
    let level = 0;
    while (!buildingData.coordinates[level] && level < buildingData.coordinates.length - 1) {
      level++;
    }

    let editionData = gameManager.editionData.find((editionData) => editionData.edition === gameManager.currentEdition());
    if (editionData && !editionData.worldMap && editionData.extendWorldMap) {
      editionData = gameManager.editionData.find((other) => editionData && other.edition === editionData.extendWorldMap && other.worldMap);
    }

    return buildingData.coordinates[level] || undefined;
  }

  distanceBetween(a: BuildingModel, b: BuildingModel): number | undefined {
    const coordsA = this.coordinatesFromModel(a);
    const coordsB = this.coordinatesFromModel(b);
    if (!coordsA || !coordsB) {
      return undefined;
    }
    const centerAx = coordsA.x + coordsA.width / 2;
    const centerAy = coordsA.y + coordsA.height / 2;
    const centerBx = coordsB.x + coordsB.width / 2;
    const centerBy = coordsB.y + coordsB.height / 2;

    return Math.sqrt(Math.pow(centerBx - centerAx, 2) + Math.pow(centerBy - centerAy, 2));
  }

  distanceFrom(a: BuildingModel, coordsB: WorldMapCoordinates): number | undefined {
    const coordsA = this.coordinatesFromModel(a);

    if (!coordsA) {
      return undefined;
    }
    const centerAx = coordsA.x + coordsA.width / 2;
    const centerAy = coordsA.y + coordsA.height / 2;
    const centerBx = coordsB.x + coordsB.width / 2;
    const centerBy = coordsB.y + coordsB.height / 2;

    return Math.sqrt(Math.pow(centerBx - centerAx, 2) + Math.pow(centerBy - centerAy, 2));
  }

  distance(coordsA: WorldMapCoordinates, coordsB: WorldMapCoordinates): number {
    const centerAx = coordsA.x + coordsA.width / 2;
    const centerAy = coordsA.y + coordsA.height / 2;
    const centerBx = coordsB.x + coordsB.width / 2;
    const centerBy = coordsB.y + coordsB.height / 2;

    return Math.sqrt(Math.pow(centerBx - centerAx, 2) + Math.pow(centerBy - centerAy, 2));
  }
}
