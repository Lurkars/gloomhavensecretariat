import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { BuildingData, BuildingRewards } from 'src/app/game/model/data/BuildingData';
import { WorldMapCoordinates } from 'src/app/game/model/data/WorldMap';

function buildRewards(overrides: Partial<BuildingRewards> = {}): BuildingRewards {
  return Object.assign(new BuildingRewards(), overrides);
}

function gardenFlipped(): boolean | undefined {
  return gameManager.game.party.garden?.flipped;
}

// BuildingsManager also covers update()/coordinatesFromModel()/rewardSection(), which pull in
// campaign/edition data and fhRules(). This spec sticks to the pure geometry helper (distance)
// and the small, clearly-scoped party-state helpers: applyRewards, initialBuilding, availableBuilding, nextWeek.

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
});
