import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BASE_TYPE, CommandImpl } from 'src/app/game/commands/Command';
import { findCharacter } from 'src/app/game/commands/CommandHelper';
import { payment, paymentValid, tradeResult, tradeValid } from 'src/app/game/commands/party/payment';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PetIdentifier } from 'src/app/game/model/data/PetCard';

function buildingData(name: BASE_TYPE): BuildingData | undefined {
  const campaign = gameManager.campaignManager.campaignData();
  return campaign && campaign.buildings ? campaign.buildings.find((buildingData) => buildingData.name === name) : undefined;
}

function buildingModel(name: BASE_TYPE): BuildingModel | undefined {
  return gameManager.game.party.buildings.find((model) => model.name === name);
}

export class BuildingAddCommand extends CommandImpl {
  id: string = 'building.add';
  requiredParameters: number = 1;

  data(building: BASE_TYPE): BuildingData | undefined {
    return typeof building === 'string' ? gameManager.buildingsManager.findBuilding(building) : undefined;
  }

  validParameters(building: string): boolean {
    const data = this.data(building);
    return !!data && gameManager.buildingsManager.canAddBuilding(data);
  }

  executeWithParameters(building: string) {
    const data = this.data(building);
    if (data) {
      gameManager.buildingsManager.addBuilding(data);
    } else {
      this.executionError('building not found');
    }
  }
}

function paymentParameters(values: BASE_TYPE[]): { force: boolean; payment: BASE_TYPE[] } {
  return values[0] === true ? { force: true, payment: values.slice(1) } : { force: false, payment: values };
}

export class BuildingUpgradeCommand extends CommandImpl {
  id: string = 'building.upgrade';
  requiredParameters: number = 1;

  validParameters(name: string, ...values: BASE_TYPE[]): boolean {
    const data = buildingData(name);
    const model = buildingModel(name);
    const { force, payment: paymentValues } = paymentParameters(values);
    return (
      !!data &&
      !!model &&
      paymentValid(paymentValues) &&
      gameManager.buildingsManager.canUpgrade(data, model, payment(paymentValues), force)
    );
  }

  executeWithParameters(name: string) {
    const data = buildingData(name);
    const model = buildingModel(name);
    const { force, payment: paymentValues } = paymentParameters(this.parameters.slice(1));
    if (data && model) {
      gameManager.buildingsManager.upgradeBuilding(data, model, payment(paymentValues), force);
    } else {
      this.executionError('building not found');
    }
  }
}

export class BuildingDowngradeCommand extends CommandImpl {
  id: string = 'building.downgrade';
  requiredParameters: number = 1;

  validParameters(name: string, remove: boolean = false): boolean {
    const data = buildingData(name);
    const model = buildingModel(name);
    return !!data && !!model && typeof remove === 'boolean' && gameManager.buildingsManager.canDowngrade(data, model);
  }

  executeWithParameters(name: string, remove: boolean = false) {
    const data = buildingData(name);
    const model = buildingModel(name);
    if (data && model) {
      gameManager.buildingsManager.downgradeBuilding(data, model, remove);
    } else {
      this.executionError('building not found');
    }
  }
}

export class BuildingStateCommand extends CommandImpl {
  id: string = 'building.state';
  requiredParameters: number = 2;

  validParameters(name: string, state: string, force: boolean = false): boolean {
    const data = buildingData(name);
    const model = buildingModel(name);
    return !!data && !!model && typeof force === 'boolean' && gameManager.buildingsManager.canSetBuildingState(data, model, state, force);
  }

  executeWithParameters(name: string, state: 'normal' | 'damaged' | 'wrecked', force: boolean = false) {
    const data = buildingData(name);
    const model = buildingModel(name);
    if (data && model) {
      gameManager.buildingsManager.setBuildingState(data, model, state, force);
    } else {
      this.executionError('building not found');
    }
  }
}

export class BuildingRepairCommand extends CommandImpl {
  id: string = 'building.repair';
  requiredParameters: number = 1;

  validParameters(name: string, ...values: BASE_TYPE[]): boolean {
    const data = buildingData(name);
    const model = buildingModel(name);
    const { force, payment: paymentValues } = paymentParameters(values);
    return (
      !!data && !!model && paymentValid(paymentValues) && gameManager.buildingsManager.canRepair(data, model, payment(paymentValues), force)
    );
  }

  executeWithParameters(name: string) {
    const data = buildingData(name);
    const model = buildingModel(name);
    const { force, payment: paymentValues } = paymentParameters(this.parameters.slice(1));
    if (data && model) {
      gameManager.buildingsManager.repairBuilding(data, model, payment(paymentValues), force);
    } else {
      this.executionError('building not found');
    }
  }
}

function gardenSource(source: BASE_TYPE | undefined): Character | 'party' | undefined {
  return source === -1 ? 'party' : findCharacter(source);
}

export class GardenPlantCommand extends CommandImpl {
  id: string = 'garden.plant';
  requiredParameters: number = 2;

  validParameters(herb: string, slot: number, source: number = -2, force: boolean = false): boolean {
    return (
      typeof slot === 'number' &&
      typeof source === 'number' &&
      typeof force === 'boolean' &&
      (source === -2 || !!gardenSource(source)) &&
      gameManager.buildingsManager.canPlantGardenHerb(herb as LootType, slot, gardenSource(source), force)
    );
  }

  executeWithParameters(herb: LootType, slot: number, source: number = -2, force: boolean = false) {
    gameManager.buildingsManager.plantGardenHerb(herb, slot, gardenSource(source), force);
  }
}

export class GardenFlipCommand extends CommandImpl {
  id: string = 'garden.flip';
  requiredParameters: number = 1;

  validParameters(value: boolean, force: boolean = false): boolean {
    return typeof value === 'boolean' && typeof force === 'boolean' && gameManager.buildingsManager.canFlipGarden(force);
  }

  executeWithParameters(value: boolean, force: boolean = false) {
    gameManager.buildingsManager.setGardenFlipped(value, force);
  }
}

export class GardenAutomationCommand extends CommandImpl {
  id: string = 'garden.automation';
  requiredParameters: number = 1;

  validParameters(value: boolean): boolean {
    return typeof value === 'boolean' && gameManager.buildingsManager.canSetGardenAutomated();
  }

  executeWithParameters(value: boolean) {
    gameManager.buildingsManager.setGardenAutomated(value);
  }
}

export class GardenHarvestCommand extends CommandImpl {
  id: string = 'garden.harvest';
  requiredParameters: number = 0;

  validParameters(): boolean {
    return gameManager.buildingsManager.canHarvestGarden();
  }

  executeWithParameters() {
    gameManager.buildingsManager.harvestGarden();
  }
}

function pet(edition: BASE_TYPE, name: BASE_TYPE): PetIdentifier | undefined {
  return gameManager.buildingsManager.findPet(edition as string, name as string);
}

export class PetCommand extends CommandImpl {
  id: string = 'pet';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, value: boolean): boolean {
    return (
      typeof edition === 'string' &&
      typeof name === 'string' &&
      typeof value === 'boolean' &&
      (value ? gameManager.buildingsManager.canAddPet(edition, name) : gameManager.buildingsManager.canRemovePet(edition, name))
    );
  }

  executeWithParameters(edition: string, name: string, value: boolean) {
    if (value) {
      gameManager.buildingsManager.addPet(edition, name);
    } else {
      gameManager.buildingsManager.removePet(edition, name);
    }
  }
}

export class PetNameCommand extends CommandImpl {
  id: string = 'pet.name';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, petname: string): boolean {
    const model = pet(edition, name);
    return !!model && gameManager.buildingsManager.canSetPetName(model, petname);
  }

  executeWithParameters(edition: string, name: string, petname: string) {
    const model = pet(edition, name);
    if (model) {
      gameManager.buildingsManager.setPetName(model, petname);
    }
  }
}

export class PetLostCommand extends CommandImpl {
  id: string = 'pet.lost';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, lost: boolean, force: boolean = false): boolean {
    const model = pet(edition, name);
    return (
      !!model && typeof lost === 'boolean' && typeof force === 'boolean' && gameManager.buildingsManager.canSetPetLost(model, lost, force)
    );
  }

  executeWithParameters(edition: string, name: string, lost: boolean, force: boolean = false) {
    const model = pet(edition, name);
    if (model) {
      gameManager.buildingsManager.setPetLost(model, lost, force);
    }
  }
}

export class PetActiveCommand extends CommandImpl {
  id: string = 'pet.active';
  requiredParameters: number = 3;

  validParameters(edition: string, name: string, active: boolean, force: boolean = false): boolean {
    const model = pet(edition, name);
    return (
      !!model && typeof active === 'boolean' && typeof force === 'boolean' && gameManager.buildingsManager.canSetPetActive(model, force)
    );
  }

  executeWithParameters(edition: string, name: string, active: boolean, force: boolean = false) {
    const model = pet(edition, name);
    if (model) {
      gameManager.buildingsManager.setPetActive(model, active, force);
    }
  }
}

export class BuildingTradeCommand extends CommandImpl {
  id: string = 'building.trade';
  requiredParameters: number = 1;

  validParameters(name: string, ...values: BASE_TYPE[]): boolean {
    const model = buildingModel(name);
    return !!model && tradeValid(values) && gameManager.buildingsManager.canApplyTrade(model, tradeResult(values));
  }

  executeWithParameters(name: string) {
    const model = buildingModel(name);
    if (model) {
      gameManager.buildingsManager.applyTrade(model, tradeResult(this.parameters.slice(1)));
    } else {
      this.executionError('building not found');
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
      gameManager.outpostAttackManager.attackBuilding(model, state, soldiers);
    } else {
      this.executionError('building not found');
    }
  }
}
