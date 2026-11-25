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
    vi.spyOn(gameManager.attackModifierBuildManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
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

    expect(gameManager.game.party.townGuardDeck?.active).toBe(false);

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

describe('OutpostAttackManager checks', () => {
  const outpostAttackManager = gameManager.outpostAttackManager;
  const buildingData = (id: string, name: string) => Object.assign(new BuildingData(), { id, name });
  const campaign = Object.assign(new CampaignData(), {
    townGuardPerks: [{}],
    buildings: [buildingData('05', 'mining-camp'), buildingData('12', 'hunting-lodge'), buildingData('98', 'barracks')]
  });

  beforeEach(() => {
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(campaign);
    vi.spyOn(gameManager.attackModifierManager, 'shuffleModifiers').mockImplementation(() => {});
    vi.spyOn(gameManager.attackModifierBuildManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
      () => new AttackModifierDeck([new AttackModifier(AttackModifierType.wreck), new AttackModifier(AttackModifierType.success)])
    );
    gameManager.game.party.buildings = [
      new BuildingModel('mining-camp', 1),
      new BuildingModel('hunting-lodge', 2),
      new BuildingModel('barracks', 1)
    ];
    gameManager.game.party.townGuardDeck = undefined;
    gameManager.game.party.outpostAttack = undefined;
    gameManager.game.party.soldiers = 2;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    gameManager.game.party.outpostAttack = undefined;
  });

  it('starts only without running attack unless replaced and with town guard', () => {
    expect(outpostAttackManager.start(undefined)).toBe(true);
    const running = gameManager.game.party.outpostAttack;
    expect(outpostAttackManager.canStart()).toBe(false);
    expect(outpostAttackManager.start(undefined)).toBe(false);
    expect(gameManager.game.party.outpostAttack).toBe(running);
    expect(outpostAttackManager.start(undefined, [], true)).toBe(true);
    expect(gameManager.game.party.outpostAttack).not.toBe(running);

    vi.mocked(gameManager.campaignManager.campaignData).mockReturnValue(new CampaignData());
    expect(outpostAttackManager.canStart(true)).toBe(false);
  });

  it('starts from an event result', () => {
    const attack = new EventCardAttack(20, 2, new EventCardAttackTarget(false), '', '', []);
    const spy = vi.spyOn(gameManager.eventCardManager, 'eventOutpostAttack').mockReturnValue({ attack, effects: [] });
    expect(outpostAttackManager.startFromEvent('summer-outpost', 'SO-07')).toBe(true);
    expect(gameManager.game.party.outpostAttack?.attack?.attackValue).toBe(20);
    spy.mockReturnValue(undefined);
    expect(outpostAttackManager.canStartFromEvent('summer-outpost', 'SO-07', true)).toBe(false);
  });

  it('rejects changes without running attack', () => {
    expect(outpostAttackManager.canFinish()).toBe(false);
    expect(outpostAttackManager.canToggleSoldier(1)).toBe(false);
    expect(outpostAttackManager.canToggleResource(0)).toBe(false);
    expect(outpostAttackManager.canSetManual(10, 2)).toBe(false);
    expect(outpostAttackManager.canSetTarget({ desc: true })).toBe(false);
    expect(outpostAttackManager.canRandomize()).toBe(false);
    expect(outpostAttackManager.canMoveBuilding('buildings', 0, 'others', 0)).toBe(false);
    expect(outpostAttackManager.canDrawTownGuard()).toBe(false);
    expect(outpostAttackManager.finish()).toEqual([]);
  });

  it('validates soldiers, manual values, target, order and resources', () => {
    outpostAttackManager.start(undefined);
    const model = gameManager.game.party.outpostAttack as OutpostAttackModel;
    expect(outpostAttackManager.canToggleSoldier(0)).toBe(false);
    expect(outpostAttackManager.toggleSoldier(3)).toBe(false);
    expect(model.soldiers).toBe(0);

    expect(outpostAttackManager.setManual(-1, 2)).toBe(false);
    expect(outpostAttackManager.setManual(30, 2)).toBe(true);
    expect(model.manualAttackValue).toBe(30);

    expect(outpostAttackManager.canSetTarget({ parity: 'any' as never })).toBe(false);
    expect(outpostAttackManager.canSetTarget({ distance: 'unknown-building' })).toBe(false);
    expect(outpostAttackManager.canSetTarget({ lowerBoundary: -1 })).toBe(false);
    expect(outpostAttackManager.setTarget({ distance: 'barracks', desc: true })).toBe(true);

    expect(outpostAttackManager.moveBuilding('buildings', 3, 'others', 0)).toBe(false);
    expect(outpostAttackManager.canMoveBuilding('buildings', 0, 'buildings', 3)).toBe(false);
    expect(outpostAttackManager.canMoveBuilding('buildings', 0, 'buildings', 2)).toBe(true);
    expect(outpostAttackManager.canMoveBuilding('buildings', 0, 'others', 0)).toBe(true);

    expect(outpostAttackManager.toggleResource(0)).toBe(false);
    model.resources = [new OutpostAttackResource(new EventCardEffect(EventCardEffectType.collectiveResource, [1, 'hide']))];
    expect(outpostAttackManager.toggleResource(0)).toBe(true);
    expect(model.resources[0].enabled).toBe(false);
  });

  it('keeps manual values and filters for card attacks', () => {
    outpostAttackManager.start(new EventCardAttack(20, 2, new EventCardAttackTarget(false), '', '', []));
    expect(outpostAttackManager.canSetManual(30, 2)).toBe(false);
    expect(outpostAttackManager.canSetTarget({ desc: true })).toBe(false);
    expect(outpostAttackManager.canRandomize()).toBe(false);
  });

  it('draws from the town guard deck and attacks the next target', () => {
    outpostAttackManager.start(undefined);
    const model = gameManager.game.party.outpostAttack as OutpostAttackModel;
    expect(outpostAttackManager.drawTownGuard()).toBe(true);
    expect(gameManager.game.party.townGuardDeck?.current).toBe(0);
    expect(model.attackResult).toBe(0);
    const deck = outpostAttackManager.townGuardDeck() as AttackModifierDeck;
    expect(outpostAttackManager.canToggleResult(deck)).toBe(false);
    expect(outpostAttackManager.attackTarget(deck)).toBe(true);
    expect(gameManager.game.party.buildings[0].state).toBe('wrecked');
    expect(model.attacks).toBe(1);
  });
});

describe('OutpostAttackManager town guard deck setup', () => {
  const outpostAttackManager = gameManager.outpostAttackManager;

  beforeEach(() => {
    vi.spyOn(gameManager.campaignManager, 'campaignData').mockReturnValue(Object.assign(new CampaignData(), { townGuardPerks: [{}] }));
    vi.spyOn(gameManager.attackModifierBuildManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
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
    vi.spyOn(gameManager.attackModifierBuildManager, 'buildTownGuardAttackModifierDeck').mockImplementation(
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

  it('adds perk sections only within the limit unless forced', () => {
    gameManager.game.party.townGuardPerks = 3;
    gameManager.game.party.townGuardPerkSections = ['1.1'];
    expect(outpostAttackManager.setTownGuardPerkSection('2.1', true)).toBe(false);
    expect(outpostAttackManager.setTownGuardPerkSection('1.1', true)).toBe(false);
    expect(outpostAttackManager.setTownGuardPerkSection('2.1', true, true)).toBe(true);
    expect(gameManager.game.party.townGuardPerkSections).toEqual(['1.1', '2.1']);
    expect(outpostAttackManager.setTownGuardPerkSection('1.1', false)).toBe(true);
  });

  it('keeps chosen perk sections when the perks are lowered and reports the excess', () => {
    gameManager.game.party.townGuardPerks = 6;
    gameManager.game.party.townGuardPerkSections = ['1.1', '2.1'];
    expect(outpostAttackManager.townGuardPerkSectionsExceeded()).toBe(false);
    expect(outpostAttackManager.setTownGuardPerks(-1)).toBe(false);
    expect(gameManager.campaignManager.setPartyValue('townGuardPerks', 5)).toBe(true);
    expect(gameManager.game.party.townGuardPerks).toBe(5);
    expect(gameManager.game.party.townGuardPerkSections).toEqual(['1.1', '2.1']);
    expect(outpostAttackManager.townGuardPerkSectionsExceeded()).toBe(true);
    expect(outpostAttackManager.townGuardPerkSectionAvailable('3.1')).toBe(false);
    expect(outpostAttackManager.townGuardPerkSectionAvailable('1.1')).toBe(true);
  });

  describe('OutpostAttackManager previous target distance', () => {
    const outpostAttackManager = gameManager.outpostAttackManager;

    afterEach(() => {
      vi.restoreAllMocks();
      gameManager.game.party.outpostAttack = undefined;
    });

    it('measures the distance from the last attacked building', () => {
      gameManager.game.party.buildings = [new BuildingModel('a', 1), new BuildingModel('b', 1), new BuildingModel('c', 1)];
      const model = new OutpostAttackModel();
      model.target = Object.assign(new EventCardAttackTarget(false), { distance: 'previousTarget' });
      model.buildings = ['a', 'b', 'c'];
      model.attacks = 1;
      gameManager.game.party.outpostAttack = model;
      const between = vi.spyOn(gameManager.buildingsManager, 'distanceBetween').mockReturnValue(4);
      const data = new BuildingData();

      expect(outpostAttackManager.distance({ model: gameManager.game.party.buildings[0], data })).toBe(0);
      expect(outpostAttackManager.distance({ model: gameManager.game.party.buildings[1], data })).toBe(4);
      expect(between).toHaveBeenCalledWith(gameManager.game.party.buildings[1], gameManager.game.party.buildings[0]);
    });
  });
});
