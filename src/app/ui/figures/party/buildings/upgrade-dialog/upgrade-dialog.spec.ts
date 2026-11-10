import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { BuildingModel } from 'src/app/game/model/Building';
import { Character } from 'src/app/game/model/Character';
import { BuildingData, SelectResourceResult } from 'src/app/game/model/data/BuildingData';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { LootType } from 'src/app/game/model/data/Loot';
import { Building } from 'src/app/ui/figures/party/buildings/buildings';
import { BuildingUpgradeDialog } from 'src/app/ui/figures/party/buildings/upgrade-dialog/upgrade-dialog';

// BuildingUpgradeDialog's constructor computes the party-vs-character resource split for a
// build/upgrade/repair action — pure arithmetic over gameManager.game.party.loot and the carpenter
// discount. Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges(), and call methods directly. sectionRewards()/confirm()'s morale/paid
// branches that open dialogs are exercised only through ghsDialogClosingHelper's non-animated path
// (settingsManager.settings.animations = false avoids touching dialogRef.overlayRef).

function buildBuilding(costs: Partial<Record<string, number>>, level: number = 0): Building {
  const data = Object.assign(new BuildingData(), {
    name: 'sanctuary',
    costs: { prosperity: 0, lumber: 0, metal: 0, hide: 0, gold: 0, manual: 0, ...costs }
  });
  const model = new BuildingModel('sanctuary', level, 'normal');
  return { model, data };
}

function createComponent(data: Record<string, any>): BuildingUpgradeDialog {
  TestBed.configureTestingModule({
    imports: [BuildingUpgradeDialog],
    providers: [
      { provide: DIALOG_DATA, useValue: data },
      { provide: DialogRef, useValue: { close: () => {} } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(BuildingUpgradeDialog);
  return fixture.componentInstance;
}

describe('BuildingUpgradeDialog', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.party.buildings = [];
    gameManager.game.party.loot = {};
    gameManager.game.party.campaignMode = false;
    settingsManager.settings.animations = false;
    settingsManager.settings.applyBuildingRewards = true;
  });

  describe('constructor (build/upgrade costs)', () => {
    it('spends from party resources up to the cost, without a discount', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 5, [LootType.metal]: 5, [LootType.hide]: 5 };
      const building = buildBuilding({ lumber: 3, metal: 2, hide: 1 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      expect(component.fhSupportSpent.lumber).toEqual(3);
      expect(component.fhSupportSpent.metal).toEqual(2);
      expect(component.fhSupportSpent.hide).toEqual(1);
      expect(component.paidResources).toEqual(6);
      expect(component.requiredResources).toEqual(6);
    });

    it('caps spending at the available party resources', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 1 };
      const building = buildBuilding({ lumber: 3 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      expect(component.fhSupportSpent.lumber).toEqual(1);
    });

    it('applies a 1-resource carpenter discount to the first affordable resource', () => {
      gameManager.game.party.buildings = [{ name: 'carpenter', level: 1, state: 'normal' } as any];
      gameManager.game.party.loot = { [LootType.lumber]: 5 };
      const building = buildBuilding({ lumber: 3 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      expect(component.discount).toBe(true);
      expect(component.fhSupportSpent.lumber).toEqual(2);
    });

    it('does not apply the discount for a wrecked carpenter', () => {
      gameManager.game.party.buildings = [{ name: 'carpenter', level: 1, state: 'wrecked' } as any];
      gameManager.game.party.loot = { [LootType.lumber]: 5 };
      const building = buildBuilding({ lumber: 3 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      expect(component.discount).toBe(false);
      expect(component.fhSupportSpent.lumber).toEqual(3);
    });
  });

  describe('constructor (repair)', () => {
    it('spreads the repair cost equally across lumber/metal/hide', () => {
      const building = buildBuilding({}, 1);
      const component = createComponent({ costs: undefined, repair: 4, building, action: 'repair', force: false });
      expect(component.costs.lumber).toEqual(4);
      expect(component.costs.metal).toEqual(4);
      expect(component.costs.hide).toEqual(4);
      expect(component.requiredResources).toEqual(4);
    });
  });

  describe('upgradeEntries / upgradeInitialPartyValues', () => {
    it('only lists non-zero cost fields', () => {
      const building = buildBuilding({ lumber: 2, gold: 5 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      expect(component.upgradeEntries.map((e) => e.type)).toEqual(['gold', 'lumber']);
    });

    it('reflects the party-spent amounts', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 5 };
      const building = buildBuilding({ lumber: 3 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      expect(component.upgradeInitialPartyValues['lumber']).toEqual(3);
    });
  });

  describe('onCostChange / recalculatePaidResources', () => {
    it('updates fhSupportSpent from a party-sourced change', () => {
      const building = buildBuilding({ lumber: 5 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      component.onCostChange({ type: 'lumber', source: 'party', value: 2 } as any);
      expect(component.fhSupportSpent.lumber).toEqual(2);
      expect(component.paidResources).toEqual(2);
    });

    it('updates characterSpent from a character-sourced change', () => {
      const building = buildBuilding({ lumber: 5 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      component.characterSpent = [{ gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 }];
      component.onCostChange({ type: 'lumber', source: 0, value: 3 } as any);
      expect(component.characterSpent[0].lumber).toEqual(3);
      expect(component.paidResources).toEqual(3);
    });
  });

  describe('changeValue', () => {
    it('adds to paidResources for a resource type', () => {
      const building = buildBuilding({ lumber: 5 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      const spent = { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
      component.changeValue('lumber', spent, 2);
      expect(spent.lumber).toEqual(2);
      expect(component.paidResources).toEqual(2);
    });

    it('does not add gold to paidResources', () => {
      const building = buildBuilding({ gold: 10 });
      const component = createComponent({ costs: building.data.costs, repair: 0, building, action: 'build', force: false });
      const spent = { gold: 0, hide: 0, lumber: 0, metal: 0, prosperity: 0, manual: 0 };
      const before = component.paidResources;
      component.changeValue('gold', spent, 5);
      expect(spent.gold).toEqual(5);
      expect(component.paidResources).toEqual(before);
    });
  });

  describe('confirm', () => {
    it('closes with true when forced', () => {
      const dialogRef = { close: vi.fn() };
      TestBed.configureTestingModule({
        imports: [BuildingUpgradeDialog],
        providers: [
          { provide: DIALOG_DATA, useValue: { costs: undefined, repair: 0, building: undefined, action: 'build', force: true } },
          { provide: DialogRef, useValue: dialogRef },
          { provide: Dialog, useValue: {} }
        ]
      });
      const fixture = TestBed.createComponent(BuildingUpgradeDialog);
      const component = fixture.componentInstance;
      component.confirm();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('is a no-op when paidResources is insufficient', () => {
      gameManager.game.party.loot = {};
      const dialogRef = { close: vi.fn() };
      const building = buildBuilding({ lumber: 5 });
      TestBed.configureTestingModule({
        imports: [BuildingUpgradeDialog],
        providers: [
          { provide: DIALOG_DATA, useValue: { costs: building.data.costs, repair: 0, building, action: 'build', force: false } },
          { provide: DialogRef, useValue: dialogRef },
          { provide: Dialog, useValue: {} }
        ]
      });
      const fixture = TestBed.createComponent(BuildingUpgradeDialog);
      const component = fixture.componentInstance;
      component.confirm();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('closes with a SelectResourceResult once fully paid', () => {
      gameManager.game.party.loot = { [LootType.lumber]: 5 };
      const dialogRef = { close: vi.fn() };
      const building = buildBuilding({ lumber: 5 });
      TestBed.configureTestingModule({
        imports: [BuildingUpgradeDialog],
        providers: [
          { provide: DIALOG_DATA, useValue: { costs: building.data.costs, repair: 0, building, action: 'build', force: false } },
          { provide: DialogRef, useValue: dialogRef },
          { provide: Dialog, useValue: {} }
        ]
      });
      const fixture = TestBed.createComponent(BuildingUpgradeDialog);
      const component = fixture.componentInstance;
      component.confirm();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });

  describe('trade', () => {
    function buildCharacter(name: string, gold: number): Character {
      const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
      const character = new Character(data, 1);
      character.progress.gold = gold;
      return character;
    }

    function createTrade(name: string, level: number, dialogRef: any = { close: () => {} }): BuildingUpgradeDialog {
      const model = new BuildingModel(name, level, 'normal');
      const building: Building = { model, data: Object.assign(new BuildingData(), { name }) };
      TestBed.configureTestingModule({
        imports: [BuildingUpgradeDialog],
        providers: [
          { provide: DIALOG_DATA, useValue: { building, action: 'trade', trade: gameManager.buildingsManager.trade(model) } },
          { provide: DialogRef, useValue: dialogRef },
          { provide: Dialog, useValue: {} }
        ]
      });
      return TestBed.createComponent(BuildingUpgradeDialog).componentInstance;
    }

    it('limits the trade by building level and available gold', () => {
      gameManager.game.figures = [buildCharacter('brute', 5)];
      const component = createTrade('mining-camp', 4);
      expect(component.tradeMax).toEqual(2);
      expect(component.upgradeEntries).toEqual([{ type: 'gold', total: 4 }]);
      expect(component.tradeReceiveEntries).toEqual([{ type: LootType.metal, total: 2 }]);
    });

    it('receives bought resources into the Frosthaven supply by default', () => {
      gameManager.game.figures = [buildCharacter('brute', 10)];
      const component = createTrade('mining-camp', 2);
      expect(component.tradeInitialReceived).toEqual({ [LootType.metal]: 2 });
      expect(component.tradeComplete).toBe(false);
      component.onCostChange({ type: 'gold', source: 0, value: 4 });
      expect(component.tradeComplete).toBe(true);
    });

    it('allows trading less than the maximum if gold matches', () => {
      gameManager.game.figures = [buildCharacter('brute', 10)];
      const component = createTrade('mining-camp', 2);
      component.onTradeReceive({ type: LootType.metal, source: 'party', value: 1 });
      component.onCostChange({ type: 'gold', source: 0, value: 4 });
      expect(component.tradeComplete).toBe(false);
      component.onCostChange({ type: 'gold', source: 0, value: 2 });
      expect(component.tradeComplete).toBe(true);
    });

    it('limits receiving any material resource by the maximum at the inn', () => {
      gameManager.game.figures = [buildCharacter('brute', 10)];
      const component = createTrade('inn', 2);
      expect(component.tradeReceiveEntries.map((entry) => entry.type)).toEqual([LootType.lumber, LootType.metal, LootType.hide]);
      expect(component.tradeReceiveGlobalTotal).toEqual(2);
      component.onCostChange({ type: 'gold', source: 0, value: 4 });
      component.onTradeReceive({ type: LootType.lumber, source: 0, value: 1 });
      expect(component.tradeComplete).toBe(false);
      component.onTradeReceive({ type: LootType.hide, source: 0, value: 1 });
      expect(component.tradeComplete).toBe(true);
    });

    it('only allows different material resources at the inn', () => {
      gameManager.game.figures = [buildCharacter('brute', 10)];
      const component = createTrade('inn', 3);
      expect(component.tradeReceiveGlobalTotal).toEqual(3);
      expect(component.tradeReceiveEntries).toEqual([
        { type: LootType.lumber, total: 1 },
        { type: LootType.metal, total: 1 },
        { type: LootType.hide, total: 1 }
      ]);
      component.onCostChange({ type: 'gold', source: 0, value: 4 });
      component.onTradeReceive({ type: LootType.lumber, source: 0, value: 2 });
      expect(component.tradeComplete).toBe(false);
      component.onTradeReceive({ type: LootType.lumber, source: 0, value: 1 });
      component.onTradeReceive({ type: LootType.metal, source: 'party', value: 1 });
      expect(component.tradeComplete).toBe(true);
    });

    it('spends resources from the Frosthaven supply first, then from characters, when selling', () => {
      settingsManager.settings.fhShareResources = false;
      const brute = buildCharacter('brute', 0);
      brute.progress.loot[LootType.hide] = 3;
      gameManager.game.figures = [brute];
      gameManager.game.party.loot = { [LootType.hide]: 1 };
      const component = createTrade('hide-depot', 2);
      expect(component.upgradeEntries).toEqual([{ type: LootType.hide, total: 2 }]);
      expect(component.fhSupportSpent.hide).toEqual(1);
      expect(component.characterSpent[0].hide).toEqual(1);
      expect(component.upgradeInitialCharacterValues[0]['hide']).toEqual(1);
      expect(component.tradeReceiveEntries).toEqual([{ type: 'gold', total: 10 }]);
      component.onTradeReceive({ type: 'gold', source: 0, value: 10 });
      expect(component.tradeComplete).toBe(true);
    });

    it('closes with spent and received resources once complete', () => {
      gameManager.game.figures = [buildCharacter('brute', 10)];
      const dialogRef = { close: vi.fn() };
      const component = createTrade('mining-camp', 1, dialogRef);
      component.onTradeReceive({ type: LootType.metal, source: 'party', value: 0 });
      component.onCostChange({ type: 'gold', source: 0, value: 2 });
      component.confirm();
      expect(dialogRef.close).not.toHaveBeenCalled();
      component.onTradeReceive({ type: LootType.metal, source: 0, value: 1 });
      component.confirm();
      const result = dialogRef.close.mock.calls[0][0] as SelectResourceResult;
      expect(result).toBeInstanceOf(SelectResourceResult);
      expect(result.characterSpent[0].gold).toEqual(2);
      expect(result.characterReceived[0].metal).toEqual(1);
      expect(result.fhSupportReceived?.metal).toEqual(0);
    });
  });
});
