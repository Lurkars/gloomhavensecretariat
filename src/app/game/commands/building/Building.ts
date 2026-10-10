import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { applyPayment, paymentValid } from 'src/app/game/commands/party/payment';
import { BuildingModel, GardenModel } from 'src/app/game/model/Building';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { herbResourceLootTypes, LootType } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { PetIdentifier } from 'src/app/game/model/data/PetCard';

function buildingData(name: BASE_TYPE): BuildingData | undefined {
  const campaign = gameManager.campaignManager.campaignData();
  return campaign && campaign.buildings ? campaign.buildings.find((buildingData) => buildingData.name === name) : undefined;
}

function buildingModel(name: BASE_TYPE): BuildingModel | undefined {
  return gameManager.game.party.buildings.find((model) => model.name === name);
}

function removeRewardConclusion(data: BuildingData, level: number) {
  if (gameManager.game.party.campaignMode && data.rewards && data.rewards[level] && data.rewards[level].section) {
    const section = gameManager
      .sectionData(gameManager.currentEdition())
      .find((sectionData) => sectionData.index === data.rewards[level].section);
    if (section) {
      const conclusion = gameManager.buildingsManager.rewardSection(section);
      if (conclusion) {
        gameManager.game.party.conclusions = gameManager.game.party.conclusions.filter(
          (model) => model.edition !== conclusion.edition || model.group !== conclusion.group || model.index !== conclusion.index
        );
      }
    }
  }
}

export class BuildingAddCommand extends CommandImpl {
  id: string = 'building.add';
  requiredParameters: number = 1;

  data(building: BASE_TYPE): BuildingData | undefined {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign || !campaign.buildings || typeof building !== 'string') {
      return undefined;
    }
    return campaign.buildings.find(
      (buildingData) =>
        buildingData.name === building.toLowerCase().replaceAll(' ', '-') ||
        buildingData.id === building ||
        (!isNaN(+buildingData.id) && !isNaN(+building) && +buildingData.id === +building)
    );
  }

  validParameters(building: string): boolean {
    const data = this.data(building);
    return !!data && !buildingModel(data.name);
  }

  executeWithParameters(building: string) {
    const data = this.data(building);
    if (data) {
      gameManager.game.party.buildings.push(new BuildingModel(data.name, 0));
    } else {
      this.executionError('building not found');
    }
  }
}

export class BuildingUpgradeCommand extends CommandImpl {
  id: string = 'building.upgrade';
  requiredParameters: number = 1;

  validParameters(name: string, ...payment: BASE_TYPE[]): boolean {
    const data = buildingData(name);
    const model = buildingModel(name);
    return !!data && !!model && model.level < data.upgrades.length + 1 && paymentValid(payment);
  }

  executeWithParameters(name: string) {
    const data = buildingData(name);
    const model = buildingModel(name);
    if (data && model) {
      applyPayment(this.parameters.slice(1));
      model.level++;
      gameManager.personalQuestManager.trackPersonalQuestProgressForParty(PersonalQuestAutotrackType.buildings);
      if (
        gameManager.game.party.campaignMode &&
        settingsManager.settings.applyBuildingRewards &&
        data.rewards &&
        data.rewards[model.level - 1]
      ) {
        gameManager.buildingsManager.applyRewards(data.rewards[model.level - 1]);
      }
    } else {
      this.executionError('building not found');
    }
  }
}

export class BuildingDowngradeCommand extends CommandImpl {
  id: string = 'building.downgrade';
  requiredParameters: number = 1;

  removable(data: BuildingData): boolean {
    return !gameManager.buildingsManager.initialBuilding(data) && !gameManager.buildingsManager.availableBuilding(data);
  }

  remove(data: BuildingData, model: BuildingModel, remove: BASE_TYPE): boolean {
    return this.removable(data) && (model.level === 0 || !!remove);
  }

  validParameters(name: string): boolean {
    const data = buildingData(name);
    const model = buildingModel(name);
    return !!data && !!model && (this.removable(data) || model.level > 1);
  }

  executeWithParameters(name: string, remove: boolean = false) {
    const data = buildingData(name);
    const model = buildingModel(name);
    if (data && model) {
      if (this.remove(data, model, remove)) {
        model.state = 'normal';
        gameManager.game.party.buildings.splice(gameManager.game.party.buildings.indexOf(model), 1);
        removeRewardConclusion(data, 0);
      } else {
        model.level--;
        if (model.level === 0) {
          model.state = 'normal';
        }
        removeRewardConclusion(data, model.level);
      }
    } else {
      this.executionError('building not found');
    }
  }
}

export class BuildingStateCommand extends CommandImpl {
  id: string = 'building.state';
  requiredParameters: number = 2;

  validParameters(name: string, state: string): boolean {
    const data = buildingData(name);
    const model = buildingModel(name);
    return !!data && !!data.repair && !!model && model.level > 0 && ['normal', 'damaged', 'wrecked'].includes(state);
  }

  executeWithParameters(name: string, state: 'normal' | 'damaged' | 'wrecked') {
    const model = buildingModel(name);
    if (model) {
      model.state = state;
    } else {
      this.executionError('building not found');
    }
  }
}

export class BuildingRepairCommand extends CommandImpl {
  id: string = 'building.repair';
  requiredParameters: number = 1;

  validParameters(name: string, ...payment: BASE_TYPE[]): boolean {
    const model = buildingModel(name);
    return !!buildingData(name) && !!model && model.state !== 'normal' && paymentValid(payment);
  }

  executeWithParameters(name: string) {
    const model = buildingModel(name);
    if (model) {
      applyPayment(this.parameters.slice(1));
      model.state = 'normal';
    } else {
      this.executionError('building not found');
    }
  }
}

function garden(): GardenModel {
  return Object.assign(new GardenModel(), gameManager.game.party.garden || new GardenModel());
}

export class GardenPlantCommand extends CommandImpl {
  id: string = 'garden.plant';
  requiredParameters: number = 2;

  validParameters(herb: string, slot: number, source: number = -2): boolean {
    const character = findCharacter(source);
    return (
      herbResourceLootTypes.includes(herb as LootType) &&
      typeof slot === 'number' &&
      slot >= 0 &&
      slot < 3 &&
      garden().plots[slot] !== herb &&
      (source === -2 ||
        (source === -1 && (gameManager.game.party.loot[herb as LootType] || 0) > 0) ||
        (!!character && (character.progress.loot[herb as LootType] || 0) > 0))
    );
  }

  executeWithParameters(herb: LootType, slot: number, source: number = -2) {
    const model = garden();
    model.plots = model.plots || [];
    model.plots[slot] = herb;
    if (source === -1) {
      gameManager.game.party.loot[herb] = (gameManager.game.party.loot[herb] || 1) - 1;
    } else {
      const character = findCharacter(source);
      if (character) {
        character.progress.loot[herb] = (character.progress.loot[herb] || 1) - 1;
      }
    }
    gameManager.game.party.garden = model;
  }
}

export class GardenFlipCommand extends CommandImpl {
  id: string = 'garden.flip';
  requiredParameters: number = 1;

  validParameters(value: boolean): boolean {
    return typeof value === 'boolean';
  }

  executeWithParameters(value: boolean) {
    const model = garden();
    model.flipped = value;
    gameManager.game.party.garden = model;
  }
}

export class GardenAutomationCommand extends CommandImpl {
  id: string = 'garden.automation';
  requiredParameters: number = 1;

  validParameters(value: boolean): boolean {
    return typeof value === 'boolean';
  }

  executeWithParameters(value: boolean) {
    const model = garden();
    model.automated = value;
    gameManager.game.party.garden = model;
  }
}

export class GardenHarvestCommand extends CommandImpl {
  id: string = 'garden.harvest';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return garden().plots.length > 0;
  }

  executeWithParameters() {
    garden().plots.forEach((herb) => {
      if (herb) {
        gameManager.game.party.loot[herb] = (gameManager.game.party.loot[herb] || 0) + 1;
      }
    });
  }
}

function pet(edition: BASE_TYPE, name: BASE_TYPE): PetIdentifier | undefined {
  return gameManager.game.party.pets.find((value) => value.edition === edition && value.name === name);
}

export class PetCommand extends CommandImpl {
  id: string = 'pet';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, value: boolean): boolean {
    return typeof edition === 'string' && typeof name === 'string' && !!name && typeof value === 'boolean';
  }

  executeWithParameters(edition: string, name: string, value: boolean) {
    if (!value) {
      gameManager.game.party.pets = gameManager.game.party.pets.filter((value) => value.edition !== edition || value.name !== name);
    } else if (!pet(edition, name)) {
      gameManager.game.party.pets.push(new PetIdentifier(name, edition));
    }
  }
}

export class PetNameCommand extends CommandImpl {
  id: string = 'pet.name';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, petname: string): boolean {
    return !!pet(edition, name) && typeof petname === 'string';
  }

  executeWithParameters(edition: string, name: string, petname: string) {
    const model = pet(edition, name);
    if (model) {
      model.petname = petname;
    }
  }
}

export class PetLostCommand extends CommandImpl {
  id: string = 'pet.lost';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, lost: boolean): boolean {
    return !!pet(edition, name) && typeof lost === 'boolean';
  }

  executeWithParameters(edition: string, name: string, lost: boolean) {
    const model = pet(edition, name);
    if (model) {
      model.lost = lost;
    }
  }
}

export class PetActiveCommand extends CommandImpl {
  id: string = 'pet.active';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, active: boolean): boolean {
    return !!pet(edition, name) && typeof active === 'boolean';
  }

  executeWithParameters(edition: string, name: string, active: boolean, force: boolean = false) {
    const model = pet(edition, name);
    if (model) {
      model.active = active;
      const stables = gameManager.game.party.buildings.find((building) => building.name === 'stables' && building.level);
      while (!force && stables && gameManager.game.party.pets.filter((value) => value.active).length > (stables.level < 3 ? 1 : 2)) {
        const other = gameManager.game.party.pets.find((value) => value.active && value !== model);
        if (other) {
          other.active = false;
        } else {
          break;
        }
      }
    }
  }
}

export class OutpostBuildingAttackedCommand extends CommandImpl {
  id: string = 'outpost.buildingAttacked';
  requiredParameters: number = 2;

  validParameters(name: string, state: string, soldiers: number = 0): boolean {
    return (
      !!buildingModel(name) &&
      ['normal', 'damaged', 'wrecked'].includes(state) &&
      typeof soldiers === 'number' &&
      soldiers >= 0 &&
      soldiers <= gameManager.game.party.soldiers
    );
  }

  executeWithParameters(name: string, state: 'normal' | 'damaged' | 'wrecked', soldiers: number = 0) {
    const model = buildingModel(name);
    if (model) {
      gameManager.game.party.soldiers -= soldiers;
      model.attacked = true;
      model.state = state;
    } else {
      this.executionError('building not found');
    }
  }
}
