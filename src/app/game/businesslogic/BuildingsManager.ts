import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel, GardenModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { BuildingCosts, BuildingData, BuildingRewards, BuildingTrade, SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { herbResourceLootTypes, LootType, materialResourceLootTypes } from 'src/app/game/model/data/Loot';
import { PersonalQuestAutotrackType } from 'src/app/game/model/data/PersonalQuest';
import { PetCard, PetIdentifier } from 'src/app/game/model/data/PetCard';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';
import { Game } from 'src/app/game/model/Game';

const PAYMENT_MATERIALS = ['lumber', 'metal', 'hide'] as const;

function emptyCosts(): BuildingCosts {
  return { prosperity: 0, lumber: 0, metal: 0, hide: 0, gold: 0, manual: 0 };
}

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
      gameManager.fhRules() && this.game.party.buildings.find((value) => value.name === 'stables' && value.level) !== undefined;
    this.petsEnabled = this.petsAvailable && settingsManager.settings.fhPets;
    this.gardenAvailable =
      gameManager.fhRules() && this.game.party.buildings.find((value) => value.name === 'garden' && value.level) !== undefined;
    this.gardenEnabled = this.gardenAvailable && settingsManager.settings.fhGarden;
    this.distillAvailable =
      (settingsManager.settings.characterItems || settingsManager.settings.characterSheet) &&
      gameManager.fhRules() &&
      this.game.party.buildings.find((value) => value.name === 'alchemist' && value.level > 1 && value.state !== 'wrecked') != undefined;
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

  canApplyTrade(model: BuildingModel, result: SelectResourceResult): boolean {
    const trade = this.trade(model);
    if (!trade || !this.game.party.buildings.includes(model) || result.morale || !this.paymentAffordable(result)) {
      return false;
    }
    const costType = (type: LootType): 'gold' | 'hide' | 'lumber' | 'metal' =>
      type === LootType.money ? 'gold' : (type as 'hide' | 'lumber' | 'metal');
    const types = ['gold', ...PAYMENT_MATERIALS] as const;
    const received = result.fhSupportReceived || emptyCosts();
    const spent = (type: 'gold' | 'hide' | 'lumber' | 'metal') =>
      ((result.fhSupportSpent && result.fhSupportSpent[type]) || 0) +
      result.characterSpent.reduce((sum, value) => sum + ((value && value[type]) || 0), 0);
    const receivedValues = [received, ...result.characterReceived];
    const gained = (type: 'gold' | 'hide' | 'lumber' | 'metal') =>
      receivedValues.reduce((sum, value) => sum + ((value && value[type]) || 0), 0);
    const payType = costType(trade.pay);
    const receiveTypes = trade.receive.map(costType);
    if (
      result.characterReceived.length > result.characters.length ||
      received.gold ||
      receivedValues.some((value) => value && types.some((type) => (value[type] || 0) < 0 || !Number.isInteger(value[type] || 0))) ||
      types.some((type) => type !== payType && spent(type) > 0) ||
      types.some((type) => !receiveTypes.includes(type) && gained(type) > 0)
    ) {
      return false;
    }
    const trades = spent(payType) / trade.payAmount;
    return (
      Number.isInteger(trades) &&
      trades > 0 &&
      trades <= trade.max &&
      receiveTypes.reduce((sum, type) => sum + gained(type), 0) === trades * trade.receiveAmount &&
      (!trade.distinct || receiveTypes.every((type) => gained(type) <= trade.receiveAmount))
    );
  }

  applyTrade(model: BuildingModel, result: SelectResourceResult): boolean {
    if (!this.canApplyTrade(model, result)) {
      return false;
    }
    gameManager.lootManager.applySelectResources(result);
    return true;
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
  soldierCapacity(): number | undefined {
    const barracks = this.game.party.buildings.find((model) => model.name === 'barracks');
    return barracks ? (barracks.level ? 2 + barracks.level * 2 : 0) : undefined;
  }

  addSoldiers(value: number) {
    const capacity = this.soldierCapacity();
    this.game.party.soldiers = Math.max(0, this.game.party.soldiers + value);
    if (capacity !== undefined && this.game.party.soldiers > capacity) {
      this.game.party.soldiers = capacity;
    }
  }

  canSetSoldiers(value: number, force: boolean = false): boolean {
    return Number.isInteger(value) && value >= 0 && (value <= this.game.party.soldiers || force);
  }

  setSoldiers(value: number, force: boolean = false): boolean {
    if (!this.canSetSoldiers(value, force)) {
      return false;
    }
    this.game.party.soldiers = value;
    return true;
  }

  soldierTrainable(): boolean {
    if (!this.game.party.campaignMode) {
      return true;
    }
    const barracks = this.game.party.buildings.find((model) => model.name === 'barracks' && model.level > 0 && model.state === 'normal');
    const capacity = this.soldierCapacity();
    const characters = this.game.figures.filter((figure) => figure instanceof Character);
    const gold = characters.reduce((sum, character) => sum + character.progress.gold, 0);
    const resources = PAYMENT_MATERIALS.reduce((sum, type) => sum + this.partyResource(type as LootType), 0);
    return !!barracks && capacity !== undefined && this.game.party.soldiers < capacity && gold >= 3 && resources > 0;
  }

  canTrainSoldier(payment: SelectResourceResult | undefined, force: boolean = false): boolean {
    if (force) {
      return true;
    }
    if (this.game.party.campaignMode) {
      const barracks = this.game.party.buildings.find((model) => model.name === 'barracks' && model.level > 0 && model.state === 'normal');
      const capacity = this.soldierCapacity();
      if (!barracks || capacity === undefined || this.game.party.soldiers >= capacity) {
        return false;
      }
    }
    return !!payment && !payment.morale && this.paymentCovers({ ...emptyCosts(), gold: 3 }, payment, 1);
  }

  trainSoldier(payment: SelectResourceResult | undefined, force: boolean = false): boolean {
    if (!this.canTrainSoldier(payment, force)) {
      return false;
    }
    this.pay(payment);
    this.game.party.soldiers++;
    return true;
  }

  rewardSection(section: ScenarioData): ScenarioData | undefined {
    if (
      this.game.party.conclusions.find(
        (model) => model.edition === section.edition && model.index === section.index && model.group === section.group
      )
    ) {
      return section;
    }

    const conclusions = gameManager.editionManager
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
      !this.game.party.buildings.find((model) => buildingData.name === model.name && model.level) &&
      (!buildingData.requires ||
        this.game.party.buildings.find((model) => model.name === buildingData.requires && model.level) !== undefined)
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

  findBuilding(nameOrId: string): BuildingData | undefined {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign || !campaign.buildings || !nameOrId) {
      return undefined;
    }
    return campaign.buildings.find(
      (buildingData) =>
        buildingData.name === nameOrId.toLowerCase().replaceAll(' ', '-') ||
        buildingData.id === nameOrId ||
        (!isNaN(+buildingData.id) && !isNaN(+nameOrId) && +buildingData.id === +nameOrId)
    );
  }

  canAddBuilding(data: BuildingData): boolean {
    return !this.game.party.buildings.some((model) => model.name === data.name);
  }

  addBuilding(data: BuildingData): boolean {
    if (!this.canAddBuilding(data)) {
      return false;
    }
    this.game.party.buildings.push(new BuildingModel(data.name, 0));
    return true;
  }

  buildingsToUnlock(): { data: BuildingData; level: number }[] {
    const campaign = gameManager.campaignManager.campaignData();
    if (!campaign || !campaign.buildings) {
      return [];
    }
    const missing = (buildingData: BuildingData) => !this.game.party.buildings.some((model) => model.name === buildingData.name);
    const initial = campaign.buildings.filter((buildingData) => this.initialBuilding(buildingData) && missing(buildingData));
    const built = (name: string) =>
      initial.some((buildingData) => buildingData.name === name) ||
      this.game.party.buildings.some((model) => model.name === name && model.level);
    const prosperity = campaign.buildings.filter(
      (buildingData) =>
        buildingData.prosperityUnlock &&
        !this.initialBuilding(buildingData) &&
        buildingData.costs.prosperity <= gameManager.campaignManager.prosperityLevel() &&
        missing(buildingData) &&
        (!buildingData.requires || built(buildingData.requires))
    );
    return [
      ...initial.map((buildingData) => ({ data: buildingData, level: 1 })),
      ...prosperity.map((buildingData) => ({ data: buildingData, level: 0 }))
    ];
  }

  unlockBuildings(): boolean {
    const unlocks = this.buildingsToUnlock();
    unlocks.forEach(({ data, level }) => {
      this.game.party.buildings.push(new BuildingModel(data.name, level));
      if (level && data.rewards && data.rewards[0]) {
        this.applyRewards(data.rewards[0]);
      }
    });
    return unlocks.length > 0;
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
          this.game.party.inspiration >=
          data.repair[model.level - 1] || this.game.party.morale > 0
      );
    }

    if (model.state === 'wrecked') {
      return this.resourcesAffordable(this.repairCosts(data, model));
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

  carpenterDiscount(): boolean {
    return this.game.party.buildings.some((model) => model.name === 'carpenter' && model.level > 0 && model.state !== 'wrecked');
  }

  paymentAffordable(payment: SelectResourceResult): boolean {
    const characters = this.game.figures.filter((figure) => figure instanceof Character);
    const party = payment.fhSupportSpent || emptyCosts();
    return (
      payment.characters.every((character, index) => {
        const spent = payment.characterSpent[index] || emptyCosts();
        return (
          characters.includes(character) &&
          (spent.gold || 0) >= 0 &&
          (spent.gold || 0) <= character.progress.gold &&
          PAYMENT_MATERIALS.every((type) => (spent[type] || 0) >= 0 && (spent[type] || 0) <= (character.progress.loot[type] || 0))
        );
      }) &&
      !party.gold &&
      (party.manual || 0) >= 0 &&
      (party.manual || 0) <= this.game.party.inspiration &&
      PAYMENT_MATERIALS.every((type) => (party[type] || 0) >= 0 && (party[type] || 0) <= (this.game.party.loot[type] || 0))
    );
  }

  paymentCovers(costs: BuildingCosts, payment: SelectResourceResult | undefined, repair: number = 0): boolean {
    if (payment && payment.morale) {
      return repair > 0 && payment.morale === 1 && this.game.party.morale >= payment.morale;
    }
    const result = payment || new SelectResourceResult([], [], emptyCosts());
    if (!this.paymentAffordable(result)) {
      return false;
    }
    const spent = (type: 'gold' | 'lumber' | 'metal' | 'hide') =>
      ((result.fhSupportSpent && result.fhSupportSpent[type]) || 0) +
      result.characterSpent.reduce((sum, value) => sum + ((value && value[type]) || 0), 0);
    const required = repair || PAYMENT_MATERIALS.reduce((sum, type) => sum + (costs[type] || 0), 0);
    const paid =
      PAYMENT_MATERIALS.reduce((sum, type) => sum + spent(type), 0) + ((result.fhSupportSpent && result.fhSupportSpent.manual) || 0);
    const discount = !repair && this.carpenterDiscount();
    return (
      (repair > 0 || PAYMENT_MATERIALS.every((type) => spent(type) <= (costs[type] || 0))) &&
      paid >= required - (discount ? 1 : 0) &&
      spent('gold') === (costs.gold || 0)
    );
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

  canUpgrade(
    data: BuildingData,
    model: BuildingModel,
    payment: SelectResourceResult | undefined = undefined,
    force: boolean = false
  ): boolean {
    return (
      this.game.party.buildings.includes(model) &&
      model.level < data.upgrades.length + 1 &&
      model.state === 'normal' &&
      (force || (this.upgradeable(data, model) && this.paymentCovers(this.upgradeCosts(data, model), payment)))
    );
  }

  upgradeBuilding(
    data: BuildingData,
    model: BuildingModel,
    payment: SelectResourceResult | undefined = undefined,
    force: boolean = false
  ): BuildingRewards | undefined | false {
    if (!this.canUpgrade(data, model, payment, force)) {
      return false;
    }
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

  repairCosts(data: BuildingData, model: BuildingModel): BuildingCosts {
    return (model.state === 'wrecked' && data.rebuild && data.rebuild[model.level - 1]) || emptyCosts();
  }

  repairValue(data: BuildingData, model: BuildingModel): number {
    return (model.state === 'damaged' && data.repair && data.repair[model.level - 1]) || 0;
  }

  canRepair(
    data: BuildingData,
    model: BuildingModel,
    payment: SelectResourceResult | undefined = undefined,
    force: boolean = false
  ): boolean {
    return (
      this.game.party.buildings.includes(model) &&
      model.level > 0 &&
      (model.state === 'damaged' || model.state === 'wrecked') &&
      (force ||
        (this.upgradeable(data, model) && this.paymentCovers(this.repairCosts(data, model), payment, this.repairValue(data, model))))
    );
  }

  repairBuilding(
    data: BuildingData,
    model: BuildingModel,
    payment: SelectResourceResult | undefined = undefined,
    force: boolean = false
  ): boolean {
    if (!this.canRepair(data, model, payment, force)) {
      return false;
    }
    this.pay(payment);
    model.state = 'normal';
    return true;
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

  canSetBuildingState(data: BuildingData, model: BuildingModel, state: string, force: boolean = false): boolean {
    return this.game.party.buildings.includes(model) && !!state && this.nextBuildingState(data, model, force) === state;
  }

  setBuildingState(data: BuildingData, model: BuildingModel, state: 'normal' | 'damaged' | 'wrecked', force: boolean = false): boolean {
    if (!this.canSetBuildingState(data, model, state, force)) {
      return false;
    }
    model.state = state;
    return true;
  }

  removableBuilding(data: BuildingData): boolean {
    return !this.initialBuilding(data) && !this.availableBuilding(data);
  }

  downgradeable(data: BuildingData, model: BuildingModel): boolean {
    return this.removableBuilding(data) || model.level > 1;
  }

  canDowngrade(data: BuildingData, model: BuildingModel): boolean {
    return this.game.party.buildings.includes(model) && this.downgradeable(data, model);
  }

  downgradeBuilding(data: BuildingData, model: BuildingModel, remove: boolean = false): boolean {
    if (!this.canDowngrade(data, model)) {
      return false;
    }
    if (this.removableBuilding(data) && (model.level === 0 || remove)) {
      model.state = 'normal';
      this.game.party.buildings.splice(this.game.party.buildings.indexOf(model), 1);
      this.removeRewardConclusion(data, 0);
    } else {
      model.level--;
      if (model.level === 0) {
        model.state = 'normal';
      }
      this.removeRewardConclusion(data, model.level);
    }
    return true;
  }

  private removeRewardConclusion(data: BuildingData, level: number) {
    if (this.game.party.campaignMode && data.rewards && data.rewards[level] && data.rewards[level].section) {
      const section = gameManager.editionManager
        .sectionData(gameManager.editionManager.currentEdition())
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

  gardenBuilding(): BuildingModel | undefined {
    return this.game.party.buildings.find((model) => model.name === 'garden' && model.level);
  }

  gardenSlots(): number {
    const building = this.gardenBuilding();
    return building ? [0, 1, 2, 2, 3][building.level] || 0 : 0;
  }

  canPlantGardenHerb(herb: LootType, slot: number, source: Character | 'party' | undefined = undefined, force: boolean = false): boolean {
    const building = this.gardenBuilding();
    const garden = this.game.party.garden || new GardenModel();
    if (
      !building ||
      !herbResourceLootTypes.includes(herb) ||
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= this.gardenSlots() ||
      (garden.plots || [])[slot] === herb
    ) {
      return false;
    }
    if (force) {
      return true;
    }
    const available =
      source === 'party'
        ? this.game.party.loot[herb] || 0
        : source && this.game.figures.includes(source)
          ? source.progress.loot[herb] || 0
          : 0;
    return !this.game.scenario && (building.level > 2 || !garden.flipped) && available > 0;
  }

  plantGardenHerb(herb: LootType, slot: number, source: Character | 'party' | undefined = undefined, force: boolean = false): boolean {
    if (!this.canPlantGardenHerb(herb, slot, source, force)) {
      return false;
    }
    const garden = Object.assign(new GardenModel(), this.game.party.garden || new GardenModel());
    garden.plots = garden.plots || [];
    garden.plots[slot] = herb;
    if (source === 'party') {
      this.game.party.loot[herb] = (this.game.party.loot[herb] || 1) - 1;
    } else if (source) {
      source.progress.loot[herb] = (source.progress.loot[herb] || 1) - 1;
    }
    this.game.party.garden = garden;
    return true;
  }

  canHarvestGarden(): boolean {
    return !!this.game.party.garden && (this.game.party.garden.plots || []).some((herb) => !!herb);
  }

  harvestGarden(): boolean {
    if (!this.game.party.garden || !this.canHarvestGarden()) {
      return false;
    }
    this.game.party.garden.plots.forEach((herb) => {
      if (herb) {
        this.game.party.loot[herb] = (this.game.party.loot[herb] || 0) + 1;
      }
    });
    return true;
  }

  petCard(edition: string, name: string): PetCard | undefined {
    const editionData = gameManager.editionManager.editionData.find((value) => value.edition === edition);
    return editionData && editionData.pets ? editionData.pets.find((petCard) => petCard.id === name) : undefined;
  }

  findPet(edition: string, name: string): PetIdentifier | undefined {
    return this.game.party.pets.find((pet) => pet.edition === edition && pet.name === name);
  }

  canAddPet(edition: string, name: string): boolean {
    return !!this.petCard(edition, name) && !this.findPet(edition, name);
  }

  addPet(edition: string, name: string): PetIdentifier | undefined {
    if (!this.canAddPet(edition, name)) {
      return undefined;
    }
    const pet = new PetIdentifier(name, edition);
    this.game.party.pets.push(pet);
    return pet;
  }

  canRemovePet(edition: string, name: string): boolean {
    return !!this.findPet(edition, name);
  }

  removePet(edition: string, name: string): boolean {
    if (!this.canRemovePet(edition, name)) {
      return false;
    }
    this.game.party.pets = this.game.party.pets.filter((pet) => pet.edition !== edition || pet.name !== name);
    return true;
  }

  canSetPetName(pet: PetIdentifier, petname: string): boolean {
    return this.game.party.pets.includes(pet) && typeof petname === 'string' && pet.petname !== petname;
  }

  setPetName(pet: PetIdentifier, petname: string): boolean {
    if (!this.canSetPetName(pet, petname)) {
      return false;
    }
    pet.petname = petname;
    return true;
  }

  canSetPetLost(pet: PetIdentifier, lost: boolean, force: boolean = false): boolean {
    return this.game.party.pets.includes(pet) && !!pet.lost !== lost && (lost || force);
  }

  setPetLost(pet: PetIdentifier, lost: boolean, force: boolean = false): boolean {
    if (!this.canSetPetLost(pet, lost, force)) {
      return false;
    }
    pet.lost = lost;
    return true;
  }

  canFlipGarden(force: boolean = false): boolean {
    const building = this.gardenBuilding();
    return !!building && building.level < 3 && (force || !this.game.scenario);
  }

  setGardenFlipped(flipped: boolean, force: boolean = false): boolean {
    if (!this.canFlipGarden(force)) {
      return false;
    }
    this.game.party.garden = Object.assign(new GardenModel(), this.game.party.garden || new GardenModel(), { flipped: flipped });
    return true;
  }

  canSetGardenAutomated(): boolean {
    return !!this.gardenBuilding() && settingsManager.settings.automaticPassTime;
  }

  setGardenAutomated(automated: boolean): boolean {
    if (!this.canSetGardenAutomated()) {
      return false;
    }
    this.game.party.garden = Object.assign(new GardenModel(), this.game.party.garden || new GardenModel(), { automated: automated });
    return true;
  }

  canSetPetActive(pet: PetIdentifier, force: boolean = false): boolean {
    return this.game.party.pets.includes(pet) && (force || (!!this.game.scenario && gameManager.roundManager.firstRound));
  }

  setPetActive(pet: PetIdentifier, active: boolean, force: boolean = false): boolean {
    if (!this.canSetPetActive(pet, force)) {
      return false;
    }
    pet.active = active;
    const stables = this.game.party.buildings.find((building) => building.name === 'stables' && building.level);
    while (!force && stables && this.game.party.pets.filter((value) => value.active).length > (stables.level < 3 ? 1 : 2)) {
      const other = this.game.party.pets.find((value) => value.active && value !== pet);
      if (!other) {
        break;
      }
      other.active = false;
    }
    return true;
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

    let editionData = gameManager.editionManager.editionData.find(
      (editionData) => editionData.edition === gameManager.editionManager.currentEdition()
    );
    if (editionData && !editionData.worldMap && editionData.extendWorldMap) {
      editionData = gameManager.editionManager.editionData.find(
        (other) => editionData && other.edition === editionData.extendWorldMap && other.worldMap
      );
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
