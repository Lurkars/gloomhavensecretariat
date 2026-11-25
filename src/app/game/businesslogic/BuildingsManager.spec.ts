import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { BuildingCosts, BuildingData, BuildingRewards, BuildingTrade, SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { CampaignData, EditionData } from 'src/app/game/model/data/EditionData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PetCard, PetIdentifier } from 'src/app/game/model/data/PetCard';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';
import { Scenario } from 'src/app/game/model/Scenario';

function buildRewards(overrides: Partial<BuildingRewards> = {}): BuildingRewards {
  return Object.assign(new BuildingRewards(), overrides);
}

function gardenFlipped(): boolean | undefined {
  return gameManager.game.party.garden?.flipped;
}

// BuildingsManager also covers update()/coordinatesFromModel()/rewardSection(), which pull in
// campaign/edition data and fhRules(). This spec sticks to the pure geometry helper (distance)
// and the party-state helpers (costs, upgrade/downgrade, rewards, garden, pets).

function buildCharacter(gold: number = 0): Character {
  const character = new Character(
    Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }),
    1
  );
  character.progress.gold = gold;
  return character;
}

function costs(overrides: Partial<BuildingCosts> = {}): BuildingCosts {
  return Object.assign({ prosperity: 0, lumber: 0, metal: 0, hide: 0, gold: 0, manual: 0 }, overrides);
}

function buildBuildingData(overrides: Partial<BuildingData> = {}): BuildingData {
  return Object.assign(new BuildingData(), { costs: { prosperity: 0, lumber: 0, metal: 0, hide: 0, gold: 0, manual: 0 } }, overrides);
}

describe('BuildingsManager', () => {
  const buildingsManager = gameManager.buildingsManager;

  beforeEach(() => {
    gameManager.game.party.buildings = [];
    gameManager.game.party.defense = 0;
    gameManager.game.party.morale = 0;
    gameManager.game.party.prosperity = 0;
    gameManager.game.party.soldiers = 0;
    gameManager.game.party.loot = {};
    gameManager.game.party.inspiration = 0;
    gameManager.game.party.campaignMode = false;
    gameManager.game.party.conclusions = [];
    gameManager.game.party.pets = [];
    gameManager.game.party.garden = undefined;
    gameManager.game.figures = [];
    gameManager.game.scenario = undefined;
    gameManager.roundManager.firstRound = false;
  });

  describe('distance', () => {
    it('computes the euclidean distance between the centers of two coordinate boxes', () => {
      const a = Object.assign(new WorldMapCoordinates(), { x: 0, y: 0, width: 0, height: 0 });
      const b = Object.assign(new WorldMapCoordinates(), { x: 3, y: 4, width: 0, height: 0 });
      expect(buildingsManager.distance(a, b)).toEqual(5);
    });

    it('accounts for the width/height offset when locating the center', () => {
      const a = Object.assign(new WorldMapCoordinates(), { x: 0, y: 0, width: 2, height: 2 });
      const b = Object.assign(new WorldMapCoordinates(), { x: 0, y: 0, width: 2, height: 2 });
      expect(buildingsManager.distance(a, b)).toEqual(0);
    });
  });

  describe('initialBuilding', () => {
    it('is true when all costs are zero', () => {
      expect(buildingsManager.initialBuilding(buildBuildingData())).toBe(true);
    });

    it('is false when any cost is non-zero', () => {
      expect(
        buildingsManager.initialBuilding(buildBuildingData({ costs: { prosperity: 1, lumber: 0, metal: 0, hide: 0, gold: 0, manual: 0 } }))
      ).toBe(false);
    });
  });

  describe('availableBuilding', () => {
    it('is false when prosperityUnlock is not set', () => {
      const data = buildBuildingData({ name: 'sanctuary', prosperityUnlock: false });
      expect(buildingsManager.availableBuilding(data)).toBe(false);
    });

    it('is false when the prosperity cost exceeds the current prosperity level', () => {
      const data = buildBuildingData({
        name: 'sanctuary',
        prosperityUnlock: true,
        costs: { prosperity: 99, lumber: 0, metal: 0, hide: 0, gold: 0, manual: 0 }
      });
      expect(buildingsManager.availableBuilding(data)).toBe(false);
    });

    it('is false when the building is already built', () => {
      const data = buildBuildingData({ name: 'sanctuary', prosperityUnlock: true });
      gameManager.game.party.buildings = [new BuildingModel('sanctuary', 1)];
      expect(buildingsManager.availableBuilding(data)).toBe(false);
    });

    it('is true when unbuilt, unlocked and prosperity-affordable', () => {
      const data = buildBuildingData({ name: 'sanctuary', prosperityUnlock: true });
      expect(buildingsManager.availableBuilding(data)).toBe(true);
    });

    it('requires the "requires" building to be present and leveled when set', () => {
      const data = buildBuildingData({ name: 'temple', prosperityUnlock: true, requires: 'sanctuary' });
      expect(buildingsManager.availableBuilding(data)).toBe(false);

      gameManager.game.party.buildings = [new BuildingModel('sanctuary', 1)];
      expect(buildingsManager.availableBuilding(data)).toBe(true);
    });
  });

  describe('applyRewards', () => {
    it('adds defense and prosperity rewards', () => {
      buildingsManager.applyRewards(buildRewards({ defense: 2, prosperity: 3 }));
      expect(gameManager.game.party.defense).toEqual(2);
      expect(gameManager.game.party.prosperity).toEqual(3);
    });

    it('subtracts loseMorale, clamped at zero', () => {
      gameManager.game.party.morale = 1;
      buildingsManager.applyRewards(buildRewards({ loseMorale: 3 }));
      expect(gameManager.game.party.morale).toEqual(0);
    });

    it('adds soldiers, capped by the barracks level limit', () => {
      gameManager.game.party.buildings = [new BuildingModel('barracks', 2)];
      buildingsManager.applyRewards(buildRewards({ soldiers: 99 }));
      expect(gameManager.game.party.soldiers).toEqual(6);
    });

    it('adds soldiers uncapped when there is no barracks', () => {
      buildingsManager.applyRewards(buildRewards({ soldiers: 5 }));
      expect(gameManager.game.party.soldiers).toEqual(5);
    });
  });

  describe('nextWeek', () => {
    it('does nothing when the garden is not enabled', () => {
      buildingsManager.gardenEnabled = false;
      gameManager.game.party.garden = undefined;
      buildingsManager.nextWeek();
      expect(gameManager.game.party.garden).toBeUndefined();
    });

    it('flips the garden when the garden building is below level 3', () => {
      buildingsManager.gardenEnabled = true;
      gameManager.game.party.buildings = [new BuildingModel('garden', 2)];
      gameManager.game.party.garden = undefined;
      buildingsManager.nextWeek();
      expect(gardenFlipped()).toBe(true);
    });

    it('keeps the garden unflipped at level 3+', () => {
      buildingsManager.gardenEnabled = true;
      gameManager.game.party.buildings = [new BuildingModel('garden', 3)];
      gameManager.game.party.garden = undefined;
      buildingsManager.nextWeek();
      expect(gardenFlipped()).toBe(false);
    });
  });

  describe('trade', () => {
    it('is undefined for buildings without trade', () => {
      expect(buildingsManager.trade(new BuildingModel('garden', 2))).toBeUndefined();
    });

    it('is undefined for unbuilt, damaged or wrecked buildings', () => {
      expect(buildingsManager.trade(new BuildingModel('mining-camp', 0))).toBeUndefined();
      expect(buildingsManager.trade(new BuildingModel('mining-camp', 2, 'damaged'))).toBeUndefined();
      expect(buildingsManager.trade(new BuildingModel('mining-camp', 2, 'wrecked'))).toBeUndefined();
    });

    it('buys a single resource type up to the building level for 2 gold', () => {
      const trade = buildingsManager.trade(new BuildingModel('hunting-lodge', 3));
      expect(trade).toEqual(new BuildingTrade('hunting-lodge', LootType.money, 2, [LootType.hide], 1, 3));
    });

    it('buys any material resources at the inn', () => {
      const trade = buildingsManager.trade(new BuildingModel('inn', 2));
      expect(trade).toEqual(new BuildingTrade('inn', LootType.money, 2, [LootType.lumber, LootType.metal, LootType.hide], 1, 2, true));
    });

    it('sells resources at depots for 5 gold', () => {
      const trade = buildingsManager.trade(new BuildingModel('metal-depot', 2));
      expect(trade).toEqual(new BuildingTrade('metal-depot', LootType.metal, 1, [LootType.money], 5, 2));
    });
  });

  describe('partyResource', () => {
    it('sums party loot and character loot for the given type', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 2 };
      const character = buildCharacter();
      character.progress.loot = { [LootType.lumber]: 3 };
      gameManager.game.figures = [character];
      expect(buildingsManager.partyResource(LootType.lumber)).toEqual(5);
    });

    it('is just the party loot without characters', () => {
      gameManager.game.party.loot = { [LootType.metal]: 4 };
      expect(buildingsManager.partyResource(LootType.metal)).toEqual(4);
    });
  });

  describe('upgradeable', () => {
    const buildData = (overrides: Partial<BuildingData> = {}) =>
      buildBuildingData(Object.assign({ costs: costs({ lumber: 2, gold: 5 }) }, overrides));

    it('is true when the party can afford the build costs', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 2 };
      gameManager.game.figures = [buildCharacter(5)];
      expect(buildingsManager.upgradeable(buildData(), new BuildingModel('x', 0))).toBe(true);
    });

    it('is false when lumber is short, unless inspiration covers it', () => {
      gameManager.game.figures = [buildCharacter(5)];
      expect(buildingsManager.upgradeable(buildData(), new BuildingModel('x', 0))).toBe(false);
      gameManager.game.party.inspiration = 2;
      expect(buildingsManager.upgradeable(buildData(), new BuildingModel('x', 0))).toBe(true);
    });

    it('lets a carpenter discount cover exactly one missing resource', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 1 };
      gameManager.game.figures = [buildCharacter(5)];
      expect(buildingsManager.upgradeable(buildData(), new BuildingModel('x', 0))).toBe(false);
      gameManager.game.party.buildings = [new BuildingModel('carpenter', 1)];
      expect(buildingsManager.upgradeable(buildData(), new BuildingModel('x', 0))).toBe(true);
      expect(buildingsManager.upgradeable(buildData({ costs: costs({ lumber: 2, metal: 1, gold: 5 }) }), new BuildingModel('x', 0))).toBe(
        false
      );
    });

    it('is false without enough combined gold or prosperity', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 2 };
      gameManager.game.figures = [buildCharacter(1)];
      expect(buildingsManager.upgradeable(buildData(), new BuildingModel('x', 0))).toBe(false);
      gameManager.game.figures = [buildCharacter(5)];
      expect(
        buildingsManager.upgradeable(buildData({ costs: costs({ prosperity: 5, lumber: 2, gold: 5 }) }), new BuildingModel('x', 0))
      ).toBe(false);
    });

    it('is false for a built building without repair table', () => {
      gameManager.game.figures = [buildCharacter(5)];
      expect(buildingsManager.upgradeable(buildData({ upgrades: [costs()] }), new BuildingModel('x', 1))).toBe(false);
    });

    it('checks the repair costs against all resources plus inspiration, or available morale', () => {
      const data = buildData({ repair: [10] });
      gameManager.game.party.loot = { [LootType.lumber]: 5, [LootType.metal]: 5, [LootType.hide]: 5 };
      expect(buildingsManager.upgradeable(data, new BuildingModel('x', 1, 'damaged'))).toBe(true);
      gameManager.game.party.loot = {};
      expect(buildingsManager.upgradeable(data, new BuildingModel('x', 1, 'damaged'))).toBe(false);
      gameManager.game.party.morale = 1;
      expect(buildingsManager.upgradeable(data, new BuildingModel('x', 1, 'damaged'))).toBe(true);
    });

    it('checks the rebuild costs for a wrecked building', () => {
      const data = buildData({ repair: [1], rebuild: [costs({ metal: 2 })] });
      expect(buildingsManager.upgradeable(data, new BuildingModel('x', 1, 'wrecked'))).toBe(false);
      gameManager.game.party.loot = { [LootType.metal]: 2 };
      expect(buildingsManager.upgradeable(data, new BuildingModel('x', 1, 'wrecked'))).toBe(true);
    });
  });

  describe('upgradeBuilding / rebuildBuilding / repairBuilding', () => {
    it('pays, levels up and returns the applied rewards in campaign mode', () => {
      gameManager.game.party.campaignMode = true;
      settingsManager.settings.applyBuildingRewards = true;
      const character = buildCharacter(10);
      gameManager.game.figures = [character];
      const rewards = buildRewards({ defense: 2, section: '1.1' });
      const data = buildBuildingData({ costs: costs({ gold: 4 }), rewards: [rewards] });
      const model = new BuildingModel('x', 0);
      gameManager.game.party.buildings = [model];
      const result = buildingsManager.upgradeBuilding(data, model, new SelectResourceResult([character], [costs({ gold: 4 })], costs()));
      expect(model.level).toEqual(1);
      expect(character.progress.gold).toEqual(6);
      expect(gameManager.game.party.defense).toEqual(2);
      expect(result).toBe(rewards);
    });

    it('does not apply rewards outside campaign mode', () => {
      gameManager.game.figures = [buildCharacter()];
      const data = buildBuildingData({ rewards: [buildRewards({ defense: 2 })] });
      const model = new BuildingModel('x', 0);
      gameManager.game.party.buildings = [model];
      expect(buildingsManager.upgradeBuilding(data, model)).toBeUndefined();
      expect(model.level).toEqual(1);
      expect(gameManager.game.party.defense).toEqual(0);
    });

    it('rejects upgrades without sufficient payment unless forced', () => {
      const character = buildCharacter(10);
      gameManager.game.figures = [character];
      gameManager.game.party.loot = { [LootType.lumber]: 3 };
      const data = buildBuildingData({ costs: costs({ lumber: 2, gold: 4 }), upgrades: [costs()] });
      const model = new BuildingModel('x', 0);
      gameManager.game.party.buildings = [model];
      expect(buildingsManager.canUpgrade(data, model)).toBe(false);
      expect(
        buildingsManager.canUpgrade(data, model, new SelectResourceResult([character], [costs({ gold: 4 })], costs({ lumber: 1 })))
      ).toBe(false);
      expect(
        buildingsManager.canUpgrade(data, model, new SelectResourceResult([character], [costs({ gold: 3 })], costs({ lumber: 2 })))
      ).toBe(false);
      expect(
        buildingsManager.upgradeBuilding(data, model, new SelectResourceResult([character], [costs({ gold: 4 })], costs({ lumber: 4 })))
      ).toBe(false);
      expect(model.level).toEqual(0);

      const valid = new SelectResourceResult([character], [costs({ gold: 4 })], costs({ lumber: 2 }));
      expect(buildingsManager.upgradeBuilding(data, model, valid)).toBeUndefined();
      expect(model.level).toEqual(1);
      expect(gameManager.game.party.loot[LootType.lumber]).toEqual(1);

      model.level = 2;
      expect(buildingsManager.canUpgrade(data, model, undefined, true)).toBe(false);
      model.level = 1;
      model.state = 'damaged';
      expect(buildingsManager.canUpgrade(data, model, undefined, true)).toBe(false);
      model.state = 'normal';
      expect(buildingsManager.upgradeBuilding(data, model, undefined, true)).toBeUndefined();
      expect(model.level).toEqual(2);
    });

    it('applies the carpenter discount and rejects payments a payer cannot afford', () => {
      const character = buildCharacter(2);
      gameManager.game.figures = [character];
      gameManager.game.party.loot = { [LootType.metal]: 1 };
      const data = buildBuildingData({ costs: costs({ metal: 2, gold: 4 }) });
      expect(
        buildingsManager.paymentCovers(data.costs, new SelectResourceResult([character], [costs({ gold: 4 })], costs({ metal: 1 })))
      ).toBe(false);
      character.progress.gold = 4;
      expect(
        buildingsManager.paymentCovers(data.costs, new SelectResourceResult([character], [costs({ gold: 4 })], costs({ metal: 1 })))
      ).toBe(false);
      gameManager.game.party.buildings = [new BuildingModel('carpenter', 1)];
      expect(
        buildingsManager.paymentCovers(data.costs, new SelectResourceResult([character], [costs({ gold: 4 })], costs({ metal: 1 })))
      ).toBe(true);
      expect(
        buildingsManager.paymentCovers(data.costs, new SelectResourceResult([buildCharacter(4)], [costs({ gold: 4 })], costs({ metal: 1 })))
      ).toBe(false);
    });

    it('repairs with morale instead of resources', () => {
      gameManager.game.party.morale = 3;
      const character = buildCharacter(10);
      gameManager.game.figures = [character];
      const data = buildBuildingData({ repair: [2] });
      const model = new BuildingModel('x', 1, 'damaged');
      gameManager.game.party.buildings = [model];
      expect(buildingsManager.repairBuilding(data, model, new SelectResourceResult([character], [costs({ gold: 4 })], costs(), 1))).toBe(
        true
      );
      expect(model.state).toEqual('normal');
      expect(gameManager.game.party.morale).toEqual(2);
      expect(character.progress.gold).toEqual(10);
      expect(buildingsManager.repairBuilding(data, model, undefined, true)).toBe(false);
    });

    it('repairs with any resources and inspiration', () => {
      gameManager.game.figures = [buildCharacter()];
      gameManager.game.party.loot = { [LootType.lumber]: 1, [LootType.hide]: 1 };
      gameManager.game.party.inspiration = 1;
      const data = buildBuildingData({ repair: [3] });
      const model = new BuildingModel('x', 1, 'damaged');
      gameManager.game.party.buildings = [model];
      expect(buildingsManager.canRepair(data, model, new SelectResourceResult([], [], costs({ lumber: 1, hide: 1 })))).toBe(false);
      expect(buildingsManager.repairBuilding(data, model, new SelectResourceResult([], [], costs({ lumber: 1, hide: 1, manual: 1 })))).toBe(
        true
      );
      expect(gameManager.game.party.inspiration).toEqual(0);
    });

    it('rebuilds a wrecked building', () => {
      gameManager.game.figures = [buildCharacter()];
      gameManager.game.party.loot = { [LootType.metal]: 3 };
      const data = buildBuildingData({ repair: [1], rebuild: [costs({ metal: 2 })] });
      const model = new BuildingModel('x', 1, 'wrecked');
      gameManager.game.party.buildings = [model];
      expect(buildingsManager.canRepair(data, model, new SelectResourceResult([], [], costs({ metal: 1 })))).toBe(false);
      expect(buildingsManager.repairBuilding(data, model, new SelectResourceResult([], [], costs({ metal: 2 })))).toBe(true);
      expect(model.state).toEqual('normal');
      expect(gameManager.game.party.loot[LootType.metal]).toEqual(1);
      expect(buildingsManager.canRepair(data, model, undefined, true)).toBe(false);
    });
  });

  describe('applyTrade', () => {
    it('trades whole amounts of the pay resource for the received resources', () => {
      const character = buildCharacter(10);
      gameManager.game.figures = [character];
      const model = new BuildingModel('mining-camp', 2);
      gameManager.game.party.buildings = [model];
      const trade = (gold: number, metal: number) =>
        new SelectResourceResult([character], [costs({ gold })], costs(), 0, [costs()], costs({ metal }));
      expect(buildingsManager.canApplyTrade(model, trade(3, 1))).toBe(false);
      expect(buildingsManager.canApplyTrade(model, trade(4, 1))).toBe(false);
      expect(buildingsManager.canApplyTrade(model, trade(6, 3))).toBe(false);
      expect(buildingsManager.canApplyTrade(model, trade(12, 6))).toBe(false);
      expect(buildingsManager.applyTrade(model, trade(4, 2))).toBe(true);
      expect(character.progress.gold).toEqual(6);
      expect(gameManager.game.party.loot[LootType.metal]).toEqual(2);
      expect(
        buildingsManager.canApplyTrade(
          model,
          new SelectResourceResult([character], [costs({ gold: 2 })], costs(), 0, [costs()], costs({ gold: 1 }))
        )
      ).toBe(false);
      model.state = 'damaged';
      expect(buildingsManager.canApplyTrade(model, trade(2, 1))).toBe(false);
    });

    it('limits distinct trades to one of each received resource', () => {
      const character = buildCharacter(10);
      gameManager.game.figures = [character];
      const model = new BuildingModel('inn', 2);
      gameManager.game.party.buildings = [model];
      expect(
        buildingsManager.canApplyTrade(
          model,
          new SelectResourceResult([character], [costs({ gold: 4 })], costs(), 0, [costs()], costs({ hide: 2 }))
        )
      ).toBe(false);
      expect(
        buildingsManager.canApplyTrade(
          model,
          new SelectResourceResult([character], [costs({ gold: 4 })], costs(), 0, [costs()], costs({ hide: 1, lumber: 1 }))
        )
      ).toBe(true);
    });
  });

  describe('soldiers', () => {
    it('trains soldiers up to the barracks capacity with 3 gold and 1 material resource', () => {
      gameManager.game.party.campaignMode = true;
      const character = buildCharacter(3);
      gameManager.game.figures = [character];
      gameManager.game.party.loot = { [LootType.hide]: 1 };
      gameManager.game.party.buildings = [new BuildingModel('barracks', 1)];
      gameManager.game.party.soldiers = 3;
      expect(buildingsManager.soldierCapacity()).toEqual(4);
      expect(buildingsManager.soldierTrainable()).toBe(true);
      expect(buildingsManager.canTrainSoldier(new SelectResourceResult([character], [costs({ gold: 3 })], costs()))).toBe(false);
      expect(buildingsManager.canTrainSoldier(new SelectResourceResult([], [], costs({ hide: 1 }), 1))).toBe(false);
      expect(buildingsManager.trainSoldier(new SelectResourceResult([character], [costs({ gold: 3 })], costs({ hide: 1 })))).toBe(true);
      expect(gameManager.game.party.soldiers).toEqual(4);
      expect(character.progress.gold).toEqual(0);
      expect(buildingsManager.soldierTrainable()).toBe(false);
      expect(buildingsManager.canTrainSoldier(undefined)).toBe(false);
      expect(buildingsManager.trainSoldier(undefined, true)).toBe(true);
      expect(buildingsManager.setSoldiers(6)).toBe(false);
      expect(buildingsManager.setSoldiers(2)).toBe(true);
      expect(gameManager.game.party.soldiers).toEqual(2);
    });
  });

  describe('setBuildingState', () => {
    it('follows the state cycle, wrecked to normal only with force', () => {
      const data = buildBuildingData({ repair: [1] });
      const model = new BuildingModel('x', 1);
      gameManager.game.party.buildings = [model];
      expect(buildingsManager.setBuildingState(data, model, 'wrecked')).toBe(false);
      expect(buildingsManager.setBuildingState(data, model, 'damaged')).toBe(true);
      expect(buildingsManager.setBuildingState(data, model, 'wrecked')).toBe(true);
      expect(buildingsManager.canSetBuildingState(data, model, 'normal')).toBe(false);
      expect(buildingsManager.setBuildingState(data, model, 'normal', true)).toBe(true);
      expect(model.state).toEqual('normal');
    });
  });

  describe('nextBuildingState', () => {
    const data = buildBuildingData({ repair: [1] });

    it('cycles normal -> damaged -> wrecked, wrecked -> normal only with force', () => {
      expect(buildingsManager.nextBuildingState(data, new BuildingModel('x', 1, 'normal'))).toEqual('damaged');
      expect(buildingsManager.nextBuildingState(data, new BuildingModel('x', 1, 'damaged'))).toEqual('wrecked');
      expect(buildingsManager.nextBuildingState(data, new BuildingModel('x', 1, 'wrecked'))).toBeUndefined();
      expect(buildingsManager.nextBuildingState(data, new BuildingModel('x', 1, 'wrecked'), true)).toEqual('normal');
    });

    it('is undefined for unbuilt buildings or buildings without repair table', () => {
      expect(buildingsManager.nextBuildingState(data, new BuildingModel('x', 0, 'normal'))).toBeUndefined();
      expect(buildingsManager.nextBuildingState(buildBuildingData(), new BuildingModel('x', 1, 'normal'))).toBeUndefined();
    });
  });

  describe('downgradeBuilding', () => {
    const data = buildBuildingData({ costs: costs({ lumber: 2 }) });

    it('removes an unbuilt, removable building', () => {
      const model = new BuildingModel('x', 0);
      gameManager.game.party.buildings = [model];
      buildingsManager.downgradeBuilding(data, model);
      expect(gameManager.game.party.buildings).toEqual([]);
    });

    it('decrements a built building and removes it only with remove flag', () => {
      const model = new BuildingModel('x', 2, 'damaged');
      gameManager.game.party.buildings = [model];
      buildingsManager.downgradeBuilding(data, model);
      expect(model.level).toEqual(1);
      buildingsManager.downgradeBuilding(data, model, true);
      expect(gameManager.game.party.buildings).toEqual([]);
    });

    it('keeps an initial building at level 1', () => {
      const initial = buildBuildingData();
      const model = new BuildingModel('x', 1);
      gameManager.game.party.buildings = [model];
      expect(buildingsManager.downgradeable(initial, model)).toBe(false);
      buildingsManager.downgradeBuilding(initial, model, true);
      expect(model.level).toEqual(1);
      expect(gameManager.game.party.buildings).toEqual([model]);
    });
  });

  describe('garden', () => {
    it('plants a herb paid by the party or a character and harvests all plots', () => {
      const character = buildCharacter();
      character.progress.loot = { [LootType.axenut]: 1 };
      gameManager.game.figures = [character];
      gameManager.game.party.buildings = [new BuildingModel('garden', 4)];
      gameManager.game.party.loot = { [LootType.rockroot]: 2 };
      expect(buildingsManager.plantGardenHerb(LootType.rockroot, 0, 'party')).toBe(true);
      expect(buildingsManager.plantGardenHerb(LootType.axenut, 1, character)).toBe(true);
      expect(buildingsManager.plantGardenHerb(LootType.flamefruit, 2)).toBe(false);
      expect(buildingsManager.plantGardenHerb(LootType.flamefruit, 2, undefined, true)).toBe(true);
      expect(gameManager.game.party.garden?.plots).toEqual([LootType.rockroot, LootType.axenut, LootType.flamefruit]);
      expect(gameManager.game.party.loot[LootType.rockroot]).toEqual(1);
      expect(character.progress.loot[LootType.axenut]).toEqual(0);

      expect(buildingsManager.harvestGarden()).toBe(true);
      expect(gameManager.game.party.loot[LootType.rockroot]).toEqual(2);
      expect(gameManager.game.party.loot[LootType.axenut]).toEqual(1);
      expect(gameManager.game.party.loot[LootType.flamefruit]).toEqual(1);
    });

    it('limits slots by garden level and blocks planting while flipped below level 3', () => {
      gameManager.game.party.buildings = [new BuildingModel('garden', 2)];
      gameManager.game.party.loot = { [LootType.rockroot]: 2 };
      expect(buildingsManager.gardenSlots()).toEqual(2);
      expect(buildingsManager.canPlantGardenHerb(LootType.rockroot, 2, 'party', true)).toBe(false);
      expect(buildingsManager.canPlantGardenHerb(LootType.rockroot, 1, 'party')).toBe(true);
      expect(buildingsManager.canPlantGardenHerb(LootType.lumber, 1, 'party', true)).toBe(false);
      expect(buildingsManager.setGardenFlipped(true)).toBe(true);
      expect(buildingsManager.canPlantGardenHerb(LootType.rockroot, 1, 'party')).toBe(false);
      expect(buildingsManager.canPlantGardenHerb(LootType.rockroot, 1, 'party', true)).toBe(true);
      expect(buildingsManager.canHarvestGarden()).toBe(false);
      gameManager.game.party.buildings = [new BuildingModel('garden', 3)];
      expect(buildingsManager.canFlipGarden(true)).toBe(false);
      gameManager.game.party.buildings = [];
      expect(buildingsManager.canPlantGardenHerb(LootType.rockroot, 0, 'party', true)).toBe(false);
    });
  });

  describe('pets', () => {
    afterEach(() => {
      gameManager.game.scenario = undefined;
      gameManager.editionManager.editionData = [];
    });

    it('limits active pets to the stables level unless forced', () => {
      gameManager.game.party.buildings = [new BuildingModel('stables', 1)];
      const a = new PetIdentifier('a', 'fh', '', true);
      const b = new PetIdentifier('b', 'fh');
      gameManager.game.party.pets = [a, b];
      expect(buildingsManager.setPetActive(b, true)).toBe(false);
      gameManager.roundManager.firstRound = true;
      gameManager.game.scenario = new Scenario(new ScenarioData());
      expect(buildingsManager.setPetActive(b, true)).toBe(true);
      expect(a.active).toBe(false);
      expect(b.active).toBe(true);
      buildingsManager.setPetActive(a, true, true);
      expect(a.active).toBe(true);
      expect(b.active).toBe(true);
      gameManager.roundManager.firstRound = false;
    });

    it('adds only known pets once, renames, loses and restores only with force', () => {
      gameManager.editionManager.editionData = [
        Object.assign(new EditionData('fh', [], [], [], [], [], []), { pets: [Object.assign(new PetCard(), { id: 'a', edition: 'fh' })] })
      ];
      expect(buildingsManager.addPet('fh', 'unknown')).toBeUndefined();
      const pet = buildingsManager.addPet('fh', 'a') as PetIdentifier;
      expect(pet).toBeDefined();
      expect(buildingsManager.canAddPet('fh', 'a')).toBe(false);
      expect(buildingsManager.setPetName(pet, 'Rex')).toBe(true);
      expect(pet.petname).toEqual('Rex');
      expect(buildingsManager.setPetLost(pet, true)).toBe(true);
      expect(buildingsManager.setPetLost(pet, false)).toBe(false);
      expect(buildingsManager.setPetLost(pet, false, true)).toBe(true);
      expect(buildingsManager.removePet('fh', 'a')).toBe(true);
      expect(buildingsManager.removePet('fh', 'a')).toBe(false);
    });
  });
});

describe('BuildingsManager unlockBuildings', () => {
  const buildingsManager = gameManager.buildingsManager;
  const initial = Object.assign(new BuildingData(), { name: 'craftsman', costs: { prosperity: 0 }, rewards: [{ soldiers: 2 }] });
  const prosperity = Object.assign(new BuildingData(), { name: 'alchemist', prosperityUnlock: true, costs: { prosperity: 2 } });

  beforeEach(() => {
    gameManager.game.party.buildings = [];
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(
      Object.assign(new CampaignData(), { buildings: [initial, prosperity] })
    );
    vi.spyOn(buildingsManager, 'initialBuilding').mockImplementation((data) => data === initial);
    vi.spyOn(buildingsManager, 'applyRewards').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('adds initial buildings once and prosperity buildings when unlocked', () => {
    const prosperityLevel = vi.spyOn(gameManager.campaignManager, 'prosperityLevel').mockReturnValue(1);
    expect(buildingsManager.unlockBuildings()).toBe(true);
    expect(gameManager.game.party.buildings.map((building) => [building.name, building.level])).toEqual([['craftsman', 1]]);
    expect(buildingsManager.applyRewards).toHaveBeenCalledWith(initial.rewards[0]);
    expect(buildingsManager.unlockBuildings()).toBe(false);

    prosperityLevel.mockReturnValue(2);
    buildingsManager.unlockBuildings();
    expect(gameManager.game.party.buildings.map((building) => [building.name, building.level])).toEqual([
      ['craftsman', 1],
      ['alchemist', 0]
    ]);
  });

  it('only lists prosperity unlocks whose required building is built', () => {
    vi.spyOn(gameManager.campaignManager, 'prosperityLevel').mockReturnValue(2);
    prosperity.requires = 'craftsman';
    try {
      gameManager.game.party.buildings = [new BuildingModel('craftsman', 0)];
      expect(buildingsManager.buildingsToUnlock()).toEqual([]);
      gameManager.game.party.buildings = [];
      expect(buildingsManager.buildingsToUnlock().map((unlock) => unlock.data.name)).toEqual(['craftsman', 'alchemist']);
    } finally {
      prosperity.requires = '';
    }
  });

  it('removes buildings and their initial rewards', () => {
    vi.spyOn(gameManager.campaignManager, 'prosperityLevel').mockReturnValue(1);
    gameManager.game.party.soldiers = 1;
    buildingsManager.unlockBuildings();
    gameManager.game.party.soldiers = 3;
    buildingsManager.resetBuildings();
    expect(gameManager.game.party.buildings).toEqual([]);
    expect(gameManager.game.party.soldiers).toBe(1);
  });
});

describe('BuildingsManager findBuilding', () => {
  const buildingsManager = gameManager.buildingsManager;

  afterEach(() => vi.restoreAllMocks());

  it('finds buildings by name or number and adds them once', () => {
    const data = Object.assign(new BuildingData(), { id: '05', name: 'mining-camp' });
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(Object.assign(new CampaignData(), { buildings: [data] }));
    gameManager.game.party.buildings = [];
    expect(buildingsManager.findBuilding('Mining Camp')).toBe(data);
    expect(buildingsManager.findBuilding('5')).toBe(data);
    expect(buildingsManager.findBuilding('unknown')).toBeUndefined();
    expect(buildingsManager.addBuilding(data)).toBe(true);
    expect(buildingsManager.addBuilding(data)).toBe(false);
    expect(gameManager.game.party.buildings.map((model) => [model.name, model.level])).toEqual([['mining-camp', 0]]);
  });
});
