import { gameManager } from 'src/app/game/businesslogic/GameManager';
import {
  BuildingAddCommand,
  BuildingDowngradeCommand,
  BuildingRepairCommand,
  BuildingStateCommand,
  BuildingUpgradeCommand,
  GardenAutomationCommand,
  GardenFlipCommand,
  GardenHarvestCommand,
  GardenPlantCommand,
  OutpostBuildingAttackedCommand,
  PetActiveCommand,
  PetCommand,
  PetLostCommand,
  PetNameCommand
} from 'src/app/game/commands/building/Building';
import { createTestCharacter, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { BuildingModel } from 'src/app/game/model/Building';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { LootType } from 'src/app/game/model/data/Loot';

describe('Building commands', () => {
  beforeEach(() => {
    resetTestGame();
    const buildings = [
      Object.assign(new BuildingData(), { id: '05', name: 'mining-camp', upgrades: [{}, {}], repair: [1, 2, 3] }),
      Object.assign(new BuildingData(), { id: '', name: 'garden', upgrades: [{}] })
    ];
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue({ buildings: buildings } as never);
    vi.spyOn(gameManager.buildingsManager, 'initialBuilding').mockReturnValue(false);
    vi.spyOn(gameManager.buildingsManager, 'availableBuilding').mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds a building by name or id', () => {
    new BuildingAddCommand('05').execute();
    expect(gameManager.game.party.buildings).toEqual([new BuildingModel('mining-camp', 0)]);
    expect(new BuildingAddCommand('Mining Camp').validParameters('Mining Camp')).toBe(false);
    expect(new BuildingAddCommand('unknown').validParameters('unknown')).toBe(false);
  });

  it('upgrades, damages, repairs and downgrades a building', () => {
    const character = createTestCharacter(1);
    character.progress.gold = 10;
    gameManager.game.party.buildings = [new BuildingModel('mining-camp', 0)];
    new BuildingUpgradeCommand('mining-camp', 1, 'gold', 5).execute();
    new BuildingUpgradeCommand('mining-camp').execute();
    const model = gameManager.game.party.buildings[0];
    expect(model.level).toBe(2);
    expect(character.progress.gold).toBe(5);

    new BuildingStateCommand('mining-camp', 'wrecked').execute();
    expect(model.state).toBe('wrecked');
    new BuildingRepairCommand('mining-camp').execute();
    expect(model.state).toBe('normal');
    expect(new BuildingRepairCommand('mining-camp').validParameters('mining-camp')).toBe(false);

    new BuildingDowngradeCommand('mining-camp').execute();
    expect(model.level).toBe(1);
    new BuildingDowngradeCommand('mining-camp', true).execute();
    expect(gameManager.game.party.buildings).toEqual([]);
  });

  it('resolves an outpost attack on a building', () => {
    gameManager.game.party.buildings = [new BuildingModel('mining-camp', 1)];
    gameManager.game.party.soldiers = 2;
    expect(new OutpostBuildingAttackedCommand('mining-camp', 'damaged', 3).validParameters('mining-camp', 'damaged', 3)).toBe(false);
    new OutpostBuildingAttackedCommand('mining-camp', 'damaged', 1).execute();
    expect(gameManager.game.party.buildings[0].state).toBe('damaged');
    expect(gameManager.game.party.buildings[0].attacked).toBe(true);
    expect(gameManager.game.party.soldiers).toBe(1);
  });

  describe('garden', () => {
    it('plants herbs from the party supply, flips, automates and harvests', () => {
      gameManager.game.party.loot[LootType.axenut] = 1;
      expect(new GardenPlantCommand(LootType.lumber, 0).validParameters(LootType.lumber, 0)).toBe(false);
      new GardenPlantCommand(LootType.axenut, 0, -1).execute();
      expect(gameManager.game.party.garden?.plots).toEqual([LootType.axenut]);
      expect(gameManager.game.party.loot[LootType.axenut]).toBe(0);

      new GardenFlipCommand(true).execute();
      expect(gameManager.game.party.garden?.flipped).toBe(true);
      new GardenAutomationCommand(false).execute();
      expect(gameManager.game.party.garden?.automated).toBe(false);

      new GardenHarvestCommand().execute();
      expect(gameManager.game.party.loot[LootType.axenut]).toBe(1);
    });
  });

  describe('pets', () => {
    it('adds, names, plays and removes pets', () => {
      new PetCommand('fh', '3', true).execute();
      new PetCommand('fh', '3', true).execute();
      expect(gameManager.game.party.pets.length).toBe(1);
      const pet = gameManager.game.party.pets[0];
      new PetNameCommand('fh', '3', 'Fluffy').execute();
      new PetLostCommand('fh', '3', true).execute();
      expect(pet.petname).toBe('Fluffy');
      expect(pet.lost).toBe(true);
      new PetCommand('fh', '3', false).execute();
      expect(gameManager.game.party.pets).toEqual([]);
    });

    it('limits active pets to the stables level', () => {
      gameManager.game.party.buildings = [new BuildingModel('stables', 1)];
      new PetCommand('fh', '1', true).execute();
      new PetCommand('fh', '2', true).execute();
      new PetActiveCommand('fh', '1', true).execute();
      new PetActiveCommand('fh', '2', true).execute();
      expect(gameManager.game.party.pets.filter((pet) => pet.active).map((pet) => pet.name)).toEqual(['2']);
    });
  });
});
