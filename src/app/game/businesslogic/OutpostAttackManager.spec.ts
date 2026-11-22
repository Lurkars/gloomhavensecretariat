import { gameManager } from 'src/app/game/businesslogic/Managers';
import { BuildingModel } from 'src/app/game/model/Building';
import {
  AttackModifier,
  AttackModifierDeck,
  AttackModifierEffect,
  AttackModifierEffectType,
  AttackModifierType,
  AttackResult
} from 'src/app/game/model/data/AttackModifier';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CampaignData } from 'src/app/game/model/data/EditionData';
import { EventCardAttack, EventCardAttackTarget, EventCardEffect, EventCardEffectType } from 'src/app/game/model/data/EventCard';
import { OutpostAttackModel, OutpostAttackResource } from 'src/app/game/model/data/OutpostAttack';

describe('OutpostAttackManager', () => {
  const outpostAttackManager = gameManager.outpostAttackManager;

  beforeEach(() => {
    gameManager.game.party.buildings = [];
    gameManager.game.party.soldiers = 3;
  });

  afterEach(() => vi.restoreAllMocks());

  it('maps morale to defense', () => {
    [
      [0, -10],
      [3, -5],
      [5, 0],
      [8, 5],
      [11, 10],
      [14, 15]
    ].forEach(([morale, defense]) => {
      gameManager.game.party.morale = morale;
      expect(outpostAttackManager.moraleDefense()).toBe(defense);
    });
  });

  it('calculates the barracks bonus', () => {
    expect(outpostAttackManager.barracksBonus()).toBeUndefined();
    const barracks = new BuildingModel('barracks', 2);
    gameManager.game.party.buildings = [barracks];
    expect(outpostAttackManager.barracksBonus()).toEqual({ available: true, bonus: -15 });
    barracks.state = 'wrecked';
    expect(outpostAttackManager.barracksBonus()).toEqual({ available: false, bonus: 0 });
  });

  it('selects outpost targets by number, parity and state', () => {
    const data = Object.assign(new BuildingData(), { id: '12', name: 'hunting-lodge' });
    const model = new BuildingModel('hunting-lodge', 1);
    const target = new EventCardAttackTarget();
    expect(outpostAttackManager.isTarget(data, model, target)).toBe(true);
    target.parity = 'odd';
    expect(outpostAttackManager.isTarget(data, model, target)).toBe(false);
    target.parity = 'even';
    target.upperBoundary = 10;
    expect(outpostAttackManager.isTarget(data, model, target)).toBe(false);
    target.upperBoundary = 0;
    target.lowerBoundary = 20;
    expect(outpostAttackManager.isTarget(data, model, target)).toBe(false);
    target.lowerBoundary = 0;
    model.state = 'wrecked';
    expect(outpostAttackManager.isTarget(data, model, target)).toBe(false);
  });

  it('resolves and applies the attacked building state', () => {
    const model = new BuildingModel('hunting-lodge', 1);
    const deck = new AttackModifierDeck([
      new AttackModifier(AttackModifierType.wreck),
      new AttackModifier(AttackModifierType.townguard, 10)
    ]);
    expect(outpostAttackManager.attackedState(model, deck, undefined, 30)).toBe('normal');
    expect(outpostAttackManager.attackedState(model, deck, { index: 0, result: 50 } as AttackResult, 30)).toBe('wrecked');
    expect(outpostAttackManager.attackedState(model, deck, { index: 1, result: 20 } as AttackResult, 30)).toBe('damaged');
    expect(outpostAttackManager.attackedState(model, deck, { index: 1, result: 40 } as AttackResult, 30)).toBe('normal');

    outpostAttackManager.attackBuilding(model, 'damaged', 2);
    expect(model.state).toBe('damaged');
    expect(model.attacked).toBe(true);
    expect(gameManager.game.party.soldiers).toBe(1);
  });

  it('collects resources from drawn town guard cards', () => {
    const resource = new AttackModifier(AttackModifierType.townguard, 10);
    resource.effects = [new AttackModifierEffect(AttackModifierEffectType.custom, '+1%game.resource.hide%')];
    const material = new AttackModifier(AttackModifierType.townguard, 10);
    material.effects = [new AttackModifierEffect(AttackModifierEffectType.custom, '%game.custom.materialResource:2%')];
    const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus0), resource, material]);
    deck.current = 2;
    expect(outpostAttackManager.townGuardResources(deck, 0).map((effect) => [effect.type, effect.values])).toEqual([
      [EventCardEffectType.collectiveResource, [1, 'hide']],
      [EventCardEffectType.collectiveResourceType, [2, 'material_resources']]
    ]);
  });
});

describe('OutpostAttackManager session', () => {
  const outpostAttackManager = gameManager.outpostAttackManager;
  const buildingData = (id: string, name: string) => Object.assign(new BuildingData(), { id, name });
  const campaign = Object.assign(new CampaignData(), {
    townGuardPerks: [{}],
    buildings: [buildingData('05', 'mining-camp'), buildingData('12', 'hunting-lodge'), buildingData('98', 'barracks')]
  });

  beforeEach(() => {
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(campaign);
    vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
    vi.spyOn(gameManager.attackModifierManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
      () => new AttackModifierDeck([new AttackModifier(AttackModifierType.wreck), new AttackModifier(AttackModifierType.success)])
    );
    gameManager.game.party.buildings = [
      new BuildingModel('mining-camp', 1),
      new BuildingModel('hunting-lodge', 2),
      new BuildingModel('barracks', 1)
    ];
    gameManager.game.party.buildings[0].attacked = true;
    gameManager.game.party.townGuardDeck = undefined;
    gameManager.game.party.outpostAttack = undefined;
    gameManager.game.party.soldiers = 2;
    gameManager.game.party.morale = 5;
    gameManager.game.party.defense = 10;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gameManager.game.party.outpostAttack = undefined;
  });

  it('starts an attack with cleared flags, stored deck and target order', () => {
    const target = Object.assign(new EventCardAttackTarget(false), { parity: 'even' });
    outpostAttackManager.start(new EventCardAttack(30, 2, target, '', '', []), [
      new EventCardEffect(EventCardEffectType.outpostTarget, [1])
    ]);
    const model = gameManager.game.party.outpostAttack as OutpostAttackModel;
    expect(model.attack?.targetNumber).toBe(2);
    expect(outpostAttackManager.attack()?.targetNumber).toBe(3);
    expect(model.buildings).toEqual(['hunting-lodge', 'barracks']);
    expect(model.others).toEqual(['mining-camp']);
    expect(gameManager.game.party.buildings.every((building) => !building.attacked)).toBe(true);
    expect(gameManager.game.party.townGuardDeck).toBeDefined();
  });

  it('applies soldiers, filter and order changes', () => {
    outpostAttackManager.start(undefined);
    const model = gameManager.game.party.outpostAttack as OutpostAttackModel;
    expect(model.buildings).toEqual(['mining-camp', 'hunting-lodge', 'barracks']);

    outpostAttackManager.toggleSoldier(2);
    expect(model.soldiers).toBe(2);
    expect(outpostAttackManager.attack()?.attackValue).toBe(50 - 10);
    expect(outpostAttackManager.factor()).toBe('advantage');
    outpostAttackManager.toggleSoldier(2);
    expect(model.soldiers).toBe(1);

    outpostAttackManager.setTarget({ level: 'high' });
    expect(model.buildings).toEqual(['hunting-lodge', 'mining-camp', 'barracks']);
    outpostAttackManager.moveBuilding('buildings', 0, 'others', 0);
    expect(model.buildings).toEqual(['mining-camp', 'barracks']);
    expect(model.others).toEqual(['hunting-lodge']);
  });

  it('draws, attacks the next target and finishes with resources', () => {
    outpostAttackManager.start(undefined);
    const model = gameManager.game.party.outpostAttack as OutpostAttackModel;
    const deck = outpostAttackManager.townGuardDeck() as AttackModifierDeck;
    model.soldiers = 1;

    outpostAttackManager.beforeDraw(deck);
    deck.current = 0;
    outpostAttackManager.afterDraw(deck, true);
    expect(model.attackResult).toBe(0);
    expect(outpostAttackManager.targetState(deck)).toBe('wrecked');

    outpostAttackManager.attackTarget(deck);
    expect(gameManager.game.party.buildings[0].state).toBe('wrecked');
    expect(gameManager.game.party.buildings[0].attacked).toBe(true);
    expect(gameManager.game.party.soldiers).toBe(1);
    expect(model.attacks).toBe(1);
    expect(model.soldiers).toBe(0);
    expect(model.attackResult).toBe(-1);

    model.resources = [
      new OutpostAttackResource(new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide'])),
      new OutpostAttackResource(new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'metal']))
    ];
    outpostAttackManager.toggleResource(1);
    expect(outpostAttackManager.finish()).toEqual([model.resources[0].effect]);
    expect(gameManager.game.party.outpostAttack).toBeUndefined();
    expect(gameManager.game.party.buildings[0].attacked).toBeUndefined();
  });
});

describe('OutpostAttackManager town guard deck setup', () => {
  const outpostAttackManager = gameManager.outpostAttackManager;

  beforeEach(() => {
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(Object.assign(new CampaignData(), { townGuardPerks: [{}] }));
    vi.spyOn(gameManager.attackModifierManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
      () => new AttackModifierDeck([new AttackModifier(AttackModifierType.wreck), new AttackModifier(AttackModifierType.success)])
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gameManager.game.party.townGuardDeck = undefined;
  });

  it('treats a stored deck without cards as missing', () => {
    gameManager.game.party.townGuardDeck = new AttackModifierDeck([]).toModel();
    expect(outpostAttackManager.hasTownGuardDeck()).toBe(false);
    expect(outpostAttackManager.townGuardDeck()?.cards.length).toBe(2);

    expect(outpostAttackManager.setupTownGuardDeck()).toBe(true);
    expect(gameManager.game.party.townGuardDeck?.cards.length).toBe(2);
    expect(gameManager.game.party.townGuardDeck?.active).toBe(false);
    expect(outpostAttackManager.hasTownGuardDeck()).toBe(true);
    expect(outpostAttackManager.setupTownGuardDeck()).toBe(false);
  });
});

describe('OutpostAttackManager town guard perk sections', () => {
  const outpostAttackManager = gameManager.outpostAttackManager;

  beforeEach(() => {
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(Object.assign(new CampaignData(), { townGuardPerks: [{}] }));
    vi.spyOn(gameManager.attackModifierManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
      () => new AttackModifierDeck([new AttackModifier(AttackModifierType.success)])
    );
    gameManager.game.party.townGuardPerkSections = [];
    gameManager.game.party.townGuardPerks = 3;
    gameManager.game.party.townGuardDeck = Object.assign(new AttackModifierDeck([]).toModel(), { active: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gameManager.game.party.townGuardDeck = undefined;
  });

  it('limits sections by perks and rebuilds the deck keeping it active', () => {
    expect(outpostAttackManager.townGuardPerkSectionAvailable('1.1')).toBe(true);
    outpostAttackManager.setTownGuardPerkSection('1.1', true);
    expect(gameManager.game.party.townGuardPerkSections).toEqual(['1.1']);
    expect(gameManager.game.party.townGuardDeck?.cards.length).toBe(1);
    expect(gameManager.game.party.townGuardDeck?.active).toBe(true);
    expect(outpostAttackManager.townGuardPerkSectionAvailable('2.1')).toBe(false);
    expect(outpostAttackManager.townGuardPerkSectionAvailable('1.1')).toBe(true);
    outpostAttackManager.setTownGuardPerkSection('1.1', false);
    expect(gameManager.game.party.townGuardPerkSections).toEqual([]);
  });
});
