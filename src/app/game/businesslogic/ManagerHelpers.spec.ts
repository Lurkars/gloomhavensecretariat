import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { createTestCharacter, createTestObjective, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { Loot, LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioRule, ScenarioRuleIdentifier } from 'src/app/game/model/data/ScenarioRule';
import { GameScenarioModel } from 'src/app/game/model/Scenario';

describe('AttackModifierManager deck editing', () => {
  const attackModifierManager = gameManager.attackModifierManager;

  function deck(...types: AttackModifierType[]): AttackModifierDeck {
    return new AttackModifierDeck(types.map((type) => new AttackModifier(type)));
  }

  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes a drawn card and keeps the current index in place', () => {
    const amDeck = deck(AttackModifierType.plus1, AttackModifierType.minus1, AttackModifierType.plus0);
    amDeck.current = 1;
    attackModifierManager.removeCard(amDeck, 0);
    expect(amDeck.current).toBe(0);
    expect(amDeck.cards.map((am) => am.type)).toEqual([AttackModifierType.minus1, AttackModifierType.plus0]);
    attackModifierManager.restoreCard(amDeck, new AttackModifier(AttackModifierType.double));
    expect(amDeck.cards[1].type).toBe(AttackModifierType.double);
  });

  it('removes only upcoming cards of a type', () => {
    const amDeck = deck(AttackModifierType.bless, AttackModifierType.plus0, AttackModifierType.bless, AttackModifierType.bless);
    amDeck.current = 0;
    attackModifierManager.changeModifierCount(amDeck, AttackModifierType.bless, -1, true);
    expect(amDeck.cards.filter((am) => am.type === AttackModifierType.bless).length).toBe(2);
    expect(amDeck.cards[0].type).toBe(AttackModifierType.bless);
    attackModifierManager.changeModifierCount(amDeck, AttackModifierType.bless, -5, true);
    expect(amDeck.cards.map((am) => am.type)).toEqual([AttackModifierType.bless, AttackModifierType.plus0]);
  });

  it('removes additional modifiers of a character only', () => {
    const character = createTestCharacter(1);
    const amDeck = deck(AttackModifierType.plus0);
    amDeck.cards.push(Object.assign(new AttackModifier(AttackModifierType.empower), { id: 'additional-' + character.name + '-1' }));
    amDeck.cards.push(Object.assign(new AttackModifier(AttackModifierType.empower), { id: 'additional-other-1' }));
    attackModifierManager.changeAdditionalCount(amDeck, character, AttackModifierType.empower, -2);
    expect(amDeck.cards.filter((am) => am.type === AttackModifierType.empower).map((am) => am.id)).toEqual(['additional-other-1']);
    attackModifierManager.changeAdditionalCount(amDeck, undefined, AttackModifierType.empower, -1);
    expect(amDeck.cards.length).toBe(1);
  });

  it('adds and removes faction modifiers', () => {
    const amDeck = deck(AttackModifierType.plus0);
    const factionModifier = Object.assign(new AttackModifier(AttackModifierType.plus1), { id: 'gh2e-test-1' });
    vi.spyOn(gameManager.campaignManager, 'gh2eFactionUnlocks').mockReturnValue([]);
    attackModifierManager.setFactionModifier(amDeck, factionModifier, true);
    expect(amDeck.cards.map((am) => am.id)).toContain('gh2e-test-1');
    expect(amDeck.cards.find((am) => am.id === 'gh2e-test-1')).not.toBe(factionModifier);
    attackModifierManager.setFactionModifier(amDeck, factionModifier, false);
    expect(amDeck.cards.map((am) => am.id)).not.toContain('gh2e-test-1');
  });

  it('lists objective decks and falls back to the monster deck for a missing character', () => {
    const character = createTestCharacter(1);
    settingsManager.settings.allyAttackModifierDeck = false;
    expect(attackModifierManager.objectiveAmDecks()).toEqual(['M', character.name]);

    const objective = createTestObjective();
    objective.amDeck = 'missing';
    expect(attackModifierManager.byFigure(objective)).toBe(gameManager.game.monsterAttackModifierDeck);
  });
});

describe('ShieldRetaliateManager', () => {
  const shieldRetaliateManager = gameManager.shieldRetaliateManager;

  beforeEach(() => {
    resetTestGame();
  });

  it('sets, adds and removes shield values', () => {
    const character = createTestCharacter(1);
    shieldRetaliateManager.setShield(character, false, 2, false);
    expect(shieldRetaliateManager.effectiveValue(shieldRetaliateManager.shieldAction(character, false))).toBe(2);
    shieldRetaliateManager.setShield(character, false, -3, true);
    const shield = shieldRetaliateManager.shieldAction(character, false);
    expect(shield?.valueType).toBe(ActionValueType.minus);
    expect(shieldRetaliateManager.effectiveValue(shield)).toBe(-1);
    shieldRetaliateManager.setShield(character, false, 1, true);
    expect(shieldRetaliateManager.shieldAction(character, false)).toBeUndefined();
  });

  it('merges retaliate actions of the same range and sets taunt', () => {
    const character = createTestCharacter(1);
    shieldRetaliateManager.setRetaliate(character, true, [shieldRetaliateManager.retaliateAction(1, 2)], false);
    shieldRetaliateManager.setRetaliate(
      character,
      true,
      [shieldRetaliateManager.retaliateAction(2, 2), shieldRetaliateManager.retaliateAction(1)],
      true
    );
    const retaliate = shieldRetaliateManager.retaliateActions(character, true);
    expect(retaliate.map((action) => action.value)).toEqual([3, 1]);
    expect(shieldRetaliateManager.rangeValue(retaliate[0])).toBe(2);

    shieldRetaliateManager.setTaunt(character, false, true);
    expect(shieldRetaliateManager.hasTaunt(character, false)).toBe(true);
    expect(character.extraActions.filter((action: Action) => action.type === ActionType.taunt).length).toBe(1);
    shieldRetaliateManager.setTaunt(character, false, false);
    expect(shieldRetaliateManager.hasTaunt(character, false)).toBe(false);
  });
});

describe('manager helpers shared with commands', () => {
  beforeEach(() => {
    resetTestGame();
  });

  it('changes loot without going below zero', () => {
    const character = createTestCharacter(1);
    const track = vi.spyOn(gameManager.personalQuestManager, 'trackMoneyTokens');
    character.loot = 1;
    gameManager.characterManager.changeLoot(character, -3);
    expect(character.loot).toBe(0);
    expect(track).toHaveBeenCalledWith(character, -1);
    track.mockRestore();
  });

  it('sets the hidden round reset', () => {
    gameManager.game.roundResetsHidden = [];
    gameManager.roundManager.setRoundReset(0);
    expect(gameManager.game.roundResetsHidden).toEqual([]);
    gameManager.roundManager.setRoundReset(3);
    gameManager.roundManager.setRoundReset(5);
    expect(gameManager.game.roundResetsHidden).toEqual([5]);
    gameManager.roundManager.setRoundReset(0);
    expect(gameManager.game.roundResetsHidden).toEqual([]);
  });

  it('applies favors and refunds unspent points', () => {
    const refund = vi.spyOn(gameManager.trialsManager, 'refundFavorPoints').mockReturnValue([1]);
    gameManager.trialsManager.applyFavors([], [2], 1);
    expect(gameManager.game.favors).toEqual([]);
    expect(gameManager.game.favorPoints).toEqual([1]);
    expect(refund).toHaveBeenCalledWith([2], 1);
    refund.mockRestore();
  });
});

describe('manager helpers for UI state edits', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an attack modifier deck exclusively in compact mode', () => {
    const deck = gameManager.game.monsterAttackModifierDeck;
    deck.active = false;
    gameManager.game.lootDeck.active = true;
    gameManager.attackModifierManager.toggleDeckActive(deck, true);
    expect(deck.active).toBe(true);
    expect(gameManager.game.lootDeck.active).toBe(false);
    gameManager.attackModifierManager.toggleDeckActive(deck, true);
    expect(deck.active).toBe(false);
  });

  it('toggles discarded attack modifiers', () => {
    const deck = new AttackModifierDeck([new AttackModifier(AttackModifierType.plus1)]);
    gameManager.attackModifierManager.setDiscarded(deck, 0, true);
    gameManager.attackModifierManager.setDiscarded(deck, 0, true);
    expect(deck.discarded).toEqual([0]);
    gameManager.attackModifierManager.setDiscarded(deck, 0, false);
    expect(deck.discarded).toEqual([]);
  });

  it('removes loot cards and remaps the loot cards of characters', () => {
    const character = createTestCharacter(1);
    const deck = gameManager.game.lootDeck;
    deck.cards = [new Loot(LootType.money, 1, 1), new Loot(LootType.money, 2, 1), new Loot(LootType.money, 3, 1)];
    deck.current = 2;
    character.lootCards = [0, 2];
    gameManager.lootManager.removeCard(deck, 0);
    expect(deck.current).toBe(1);
    expect(character.lootCards).toEqual([1]);
    deck.current = 0;
    gameManager.lootManager.dropUpcomingLootCards(deck);
    expect(character.lootCards).toEqual([]);
  });

  it('sets fixed loot types, enhancements and party treasures', () => {
    gameManager.game.lootDeckFixed = [];
    gameManager.lootManager.setFixed(LootType.special1, true);
    gameManager.lootManager.setFixed(LootType.special1, true);
    expect(gameManager.game.lootDeckFixed).toEqual([LootType.special1]);
    gameManager.lootManager.setFixed(LootType.special1, false);
    expect(gameManager.game.lootDeckFixed).toEqual([]);

    const loot = new Loot(LootType.lumber, 1, 1);
    gameManager.lootManager.changeEnhancement([loot], loot, -1);
    expect(loot.enhancements).toBe(0);
    gameManager.lootManager.changeEnhancement([loot], loot, 1);
    expect(gameManager.game.lootDeckEnhancements).toEqual([loot]);

    gameManager.game.party.treasures = [];
    gameManager.lootManager.setPartyTreasure('gh', 5, true);
    gameManager.lootManager.setPartyTreasure('gh', 5, true);
    expect(gameManager.lootManager.hasPartyTreasure('gh', '5')).toBe(true);
    expect(gameManager.game.party.treasures.length).toBe(1);
    gameManager.lootManager.setPartyTreasure('gh', 5, false);
    expect(gameManager.game.party.treasures).toEqual([]);
  });

  it('sets battle goal editions and filters', () => {
    const battleGoalManager = gameManager.battleGoalManager;
    gameManager.game.battleGoalEditions = [];
    gameManager.game.filteredBattleGoals = [];
    battleGoalManager.setBattleGoalEdition('fh', true);
    battleGoalManager.setBattleGoalFilter('fh', 'goal', true);
    expect(battleGoalManager.battleGoalFiltered('fh', 'goal')).toBe(true);
    battleGoalManager.setBattleGoalEdition('fh', false);
    expect(gameManager.game.battleGoalEditions).toEqual([]);
    expect(gameManager.game.filteredBattleGoals).toEqual([]);
  });

  it('adds and removes parties and game conditions', () => {
    const change = vi.spyOn(gameManager, 'changeParty').mockImplementation(() => {});
    gameManager.game.parties = [gameManager.game.party];
    gameManager.game.party.id = 0;
    expect(gameManager.nextPartyId()).toBe(1);
    const party = gameManager.addParty('second');
    expect(party.id).toBe(1);
    expect(change).toHaveBeenCalledWith(party);
    gameManager.removeParty(party);
    expect(gameManager.game.parties.length).toBe(1);
    gameManager.removeParty(gameManager.game.parties[0]);
    expect(gameManager.game.parties.length).toBe(1);

    gameManager.game.conditions = [];
    gameManager.setGameCondition(ConditionName.bless, true);
    gameManager.setGameCondition(ConditionName.bless, true);
    expect(gameManager.game.conditions).toEqual([ConditionName.bless]);
    gameManager.setGameCondition(ConditionName.bless, false);
    expect(gameManager.game.conditions).toEqual([]);
  });

  it('adds and removes pets and toggles the garden', () => {
    gameManager.game.party.pets = [];
    const pet = gameManager.buildingsManager.addPet('fh', '1');
    expect(gameManager.buildingsManager.addPet('fh', '1')).toBe(pet);
    gameManager.buildingsManager.removePet('fh', '1');
    expect(gameManager.game.party.pets).toEqual([]);

    delete gameManager.game.party.garden;
    gameManager.buildingsManager.setGardenFlipped(true);
    gameManager.buildingsManager.setGardenAutomated(true);
    expect(gameManager.game.party.garden!.flipped).toBe(true);
    expect(gameManager.game.party.garden!.automated).toBe(true);
  });

  it('changes character values and moves resources to the supply', () => {
    const character = createTestCharacter(1);
    gameManager.game.party.loot = {};
    character.progress.loot[LootType.hide] = 2;
    gameManager.eventCardManager.changeCharacterValue([character], 'experience', -5);
    expect(character.progress.experience).toBe(0);
    gameManager.eventCardManager.changeCharacterValue([character], 'resource', -5, LootType.hide);
    expect(character.progress.loot[LootType.hide]).toBe(0);

    character.progress.loot[LootType.hide] = 2;
    expect(gameManager.characterManager.moveResourceToSupply(character, LootType.hide, 3)).toBe(2);
    expect(gameManager.game.party.loot[LootType.hide]).toBe(2);
    expect(character.progress.loot[LootType.hide]).toBe(0);
  });

  it('discards applied scenario rules and removes conclusions', () => {
    const identifier = Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 0 });
    vi.spyOn(gameManager.scenarioRulesManager, 'getScenarioForRule').mockReturnValue({
      scenario: Object.assign(new ScenarioData(), { rules: [Object.assign(new ScenarioRule(''), { once: true })] }),
      section: false
    });
    gameManager.game.appliedScenarioRules = [identifier];
    gameManager.game.discardedScenarioRules = [];
    gameManager.scenarioRulesManager.discardAppliedRule(
      Object.assign(new ScenarioRuleIdentifier(), { edition: 'gh', scenario: '1', index: 1 })
    );
    expect(gameManager.game.appliedScenarioRules).toEqual([identifier]);
    gameManager.scenarioRulesManager.discardAppliedRule(identifier);
    expect(gameManager.game.appliedScenarioRules).toEqual([]);
    expect(gameManager.game.discardedScenarioRules).toEqual([identifier]);
    gameManager.scenarioRulesManager.clearDiscardedRules();
    expect(gameManager.game.discardedScenarioRules).toEqual([]);

    gameManager.game.party.conclusions = [new GameScenarioModel('1', 'gh'), new GameScenarioModel('2', 'gh')];
    gameManager.scenarioManager.removeConclusion('gh', '1');
    expect(gameManager.game.party.conclusions.map((model) => model.index)).toEqual(['2']);
  });
});
