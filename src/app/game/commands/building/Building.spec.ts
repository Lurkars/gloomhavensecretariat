import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import {
  BuildingAddCommand,
  BuildingDowngradeCommand,
  BuildingRepairCommand,
  BuildingStateCommand,
  BuildingTradeCommand,
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
import { createTestCharacter, createTestEdition, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { BuildingModel } from 'src/app/game/model/Building';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { LootType } from 'src/app/game/model/data/Loot';
import { PetCard } from 'src/app/game/model/data/PetCard';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { Scenario } from 'src/app/game/model/Scenario';

describe('Building commands', () => {
  beforeEach(() => {
    resetTestGame();
    const buildings = [
      Object.assign(new BuildingData(), {
        id: '05',
        name: 'mining-camp',
        costs: { prosperity: 0, lumber: 0, metal: 0, hide: 0, gold: 5, manual: 0 },
        upgrades: [{}, {}],
        repair: [1, 2, 3]
      }),
      Object.assign(new BuildingData(), { id: '', name: 'garden', upgrades: [{}, {}, {}] })
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
    expect(new BuildingUpgradeCommand('mining-camp').validParameters('mining-camp')).toBe(false);
    expect(new BuildingUpgradeCommand('mining-camp', 1, 'gold', 4).validParameters('mining-camp', 1, 'gold', 4)).toBe(false);
    new BuildingUpgradeCommand('mining-camp', 1, 'gold', 5).execute();
    new BuildingUpgradeCommand('mining-camp').execute();
    const model = gameManager.game.party.buildings[0];
    expect(model.level).toBe(2);
    expect(character.progress.gold).toBe(5);

    expect(new BuildingStateCommand('mining-camp', 'wrecked').validParameters('mining-camp', 'wrecked')).toBe(false);
    new BuildingStateCommand('mining-camp', 'damaged').execute();
    expect(new BuildingUpgradeCommand('mining-camp', true).validParameters('mining-camp', true)).toBe(false);
    new BuildingStateCommand('mining-camp', 'wrecked').execute();
    expect(model.state).toBe('wrecked');
    new BuildingRepairCommand('mining-camp').execute();
    expect(model.state).toBe('normal');
    expect(new BuildingRepairCommand('mining-camp').validParameters('mining-camp')).toBe(false);

    new BuildingStateCommand('mining-camp', 'damaged').execute();
    expect(new BuildingRepairCommand('mining-camp').validParameters('mining-camp')).toBe(false);
    gameManager.game.party.loot[LootType.lumber] = 2;
    new BuildingRepairCommand('mining-camp', -1, 'lumber', 2).execute();
    expect(model.state).toBe('normal');
    expect(gameManager.game.party.loot[LootType.lumber]).toBe(0);
    new BuildingStateCommand('mining-camp', 'damaged').execute();
    new BuildingRepairCommand('mining-camp', true).execute();
    expect(model.state).toBe('normal');

    new BuildingDowngradeCommand('mining-camp').execute();
    expect(model.level).toBe(1);
    new BuildingDowngradeCommand('mining-camp', true).execute();
    expect(gameManager.game.party.buildings).toEqual([]);
  });

  it('trades at a building', () => {
    const character = createTestCharacter(1);
    character.progress.gold = 5;
    gameManager.game.party.buildings = [new BuildingModel('mining-camp', 2)];
    expect(new BuildingTradeCommand('mining-camp', 1, 'gold', 4).validParameters('mining-camp', 1, 'gold', 4)).toBe(false);
    expect(
      new BuildingTradeCommand('mining-camp', 1, 'gold', 4, 'receive', -1, 'metal', 1).validParameters(
        'mining-camp',
        1,
        'gold',
        4,
        'receive',
        -1,
        'metal',
        1
      )
    ).toBe(false);
    new BuildingTradeCommand('mining-camp', 1, 'gold', 4, 'receive', -1, 'metal', 1, 1, 'metal', 1).execute();
    expect(character.progress.gold).toBe(1);
    expect(gameManager.game.party.loot[LootType.metal]).toBe(1);
    expect(character.progress.loot[LootType.metal]).toBe(1);
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
      gameManager.game.party.buildings = [new BuildingModel('garden', 1)];
      gameManager.game.party.loot[LootType.axenut] = 1;
      expect(new GardenPlantCommand(LootType.lumber, 0).validParameters(LootType.lumber, 0)).toBe(false);
      expect(new GardenPlantCommand(LootType.axenut, 0).validParameters(LootType.axenut, 0)).toBe(false);
      expect(new GardenPlantCommand(LootType.axenut, 1, -1).validParameters(LootType.axenut, 1, -1)).toBe(false);
      new GardenPlantCommand(LootType.axenut, 0, -1).execute();
      expect(gameManager.game.party.garden?.plots).toEqual([LootType.axenut]);
      expect(gameManager.game.party.loot[LootType.axenut]).toBe(0);

      new GardenFlipCommand(true).execute();
      expect(gameManager.game.party.garden?.flipped).toBe(true);
      settingsManager.settings.automaticPassTime = true;
      new GardenAutomationCommand(false).execute();
      expect(gameManager.game.party.garden?.automated).toBe(false);
      settingsManager.settings.automaticPassTime = false;
      expect(new GardenAutomationCommand(true).validParameters(true)).toBe(false);
      settingsManager.settings.automaticPassTime = true;

      new GardenHarvestCommand().execute();
      expect(gameManager.game.party.loot[LootType.axenut]).toBe(1);
      gameManager.game.party.buildings = [new BuildingModel('garden', 3)];
      expect(new GardenFlipCommand(false).validParameters(false, true)).toBe(false);
    });
  });

  describe('pets', () => {
    beforeEach(() => {
      createTestEdition({
        edition: 'fh',
        pets: ['1', '2', '3'].map((id) => Object.assign(new PetCard(), { id, edition: 'fh' }))
      });
    });

    afterEach(() => {
      gameManager.game.scenario = undefined;
      gameManager.roundManager.firstRound = false;
    });

    it('adds, names, plays and removes pets', () => {
      expect(new PetCommand('fh', 'unknown', true).validParameters('fh', 'unknown', true)).toBe(false);
      new PetCommand('fh', '3', true).execute();
      expect(new PetCommand('fh', '3', true).validParameters('fh', '3', true)).toBe(false);
      expect(gameManager.game.party.pets.length).toBe(1);
      const pet = gameManager.game.party.pets[0];
      new PetNameCommand('fh', '3', 'Fluffy').execute();
      new PetLostCommand('fh', '3', true).execute();
      expect(pet.petname).toBe('Fluffy');
      expect(pet.lost).toBe(true);
      expect(new PetLostCommand('fh', '3', false).validParameters('fh', '3', false)).toBe(false);
      new PetLostCommand('fh', '3', false, true).execute();
      expect(pet.lost).toBe(false);
      new PetCommand('fh', '3', false).execute();
      expect(gameManager.game.party.pets).toEqual([]);
    });

    it('limits active pets to the stables level', () => {
      gameManager.game.party.buildings = [new BuildingModel('stables', 1)];
      new PetCommand('fh', '1', true).execute();
      new PetCommand('fh', '2', true).execute();
      expect(new PetActiveCommand('fh', '1', true).validParameters('fh', '1', true)).toBe(false);
      gameManager.game.scenario = new Scenario(new ScenarioData());
      gameManager.roundManager.firstRound = true;
      new PetActiveCommand('fh', '1', true).execute();
      new PetActiveCommand('fh', '2', true).execute();
      expect(gameManager.game.party.pets.filter((pet) => pet.active).map((pet) => pet.name)).toEqual(['2']);
    });
  });
});
