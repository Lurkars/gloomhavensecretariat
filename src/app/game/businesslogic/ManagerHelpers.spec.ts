import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { createTestCharacter, createTestObjective, resetTestGame } from 'src/app/game/commands/commandsTestHelpers';
import { BuildingModel } from 'src/app/game/model/Building';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import {
  AttackModifier,
  AttackModifierDeck,
  AttackModifierType,
  Gh2ESealedDeckAttackModifier
} from 'src/app/game/model/data/AttackModifier';
import { ConditionName } from 'src/app/game/model/data/Condition';
import { Identifier } from 'src/app/game/model/data/Identifier';
import { Loot, LootType } from 'src/app/game/model/data/Loot';
import { PerkCard } from 'src/app/game/model/data/Perks';
import { PetCard } from 'src/app/game/model/data/PetCard';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { ScenarioRule, ScenarioRuleIdentifier } from 'src/app/game/model/data/ScenarioRule';
import { GameClockTimestamp } from 'src/app/game/model/Game';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { deckMoveValid } from 'src/app/game/util/deck';

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
    expect(attackModifierManager.removeCard(amDeck, 5)).toBe(false);
    const deleted = attackModifierManager.deletedModifiers(amDeck, undefined)[0];
    expect(attackModifierManager.restoreCard(amDeck, deleted, undefined)).toBe(true);
    expect(amDeck.cards[1]).toBe(deleted);
    expect(
      attackModifierManager.restoreCard(amDeck, Object.assign(new AttackModifier(AttackModifierType.double), { id: 'unknown' }), undefined)
    ).toBe(false);
  });

  it('removes only upcoming cards of a type', () => {
    const amDeck = deck(AttackModifierType.bless, AttackModifierType.plus0, AttackModifierType.bless, AttackModifierType.bless);
    amDeck.current = 0;
    attackModifierManager.changeModifierCount(amDeck, AttackModifierType.bless, -1, true);
    expect(amDeck.cards.filter((am) => am.type === AttackModifierType.bless).length).toBe(2);
    expect(amDeck.cards[0].type).toBe(AttackModifierType.bless);
    expect(attackModifierManager.changeModifierCount(amDeck, AttackModifierType.bless, -5, true)).toBe(false);
    expect(attackModifierManager.changeModifierCount(amDeck, AttackModifierType.bless, -1, true)).toBe(true);
    expect(amDeck.cards.map((am) => am.type)).toEqual([AttackModifierType.bless, AttackModifierType.plus0]);
  });

  it('removes additional modifiers of a character only', () => {
    const character = createTestCharacter(1);
    const amDeck = deck(AttackModifierType.plus0);
    amDeck.cards.push(Object.assign(new AttackModifier(AttackModifierType.empower), { id: 'additional-' + character.name + '1' }));
    amDeck.cards.push(Object.assign(new AttackModifier(AttackModifierType.empower), { id: 'additional-other1' }));
    expect(attackModifierManager.changeAdditionalCount(amDeck, character, AttackModifierType.empower, -2)).toBe(false);
    expect(attackModifierManager.changeAdditionalCount(amDeck, character, AttackModifierType.empower, -1)).toBe(true);
    expect(amDeck.cards.filter((am) => am.type === AttackModifierType.empower).map((am) => am.id)).toEqual(['additional-other1']);
    attackModifierManager.changeAdditionalCount(amDeck, undefined, AttackModifierType.empower, -1);
    expect(amDeck.cards.length).toBe(1);
  });

  it('adds and removes faction modifiers', () => {
    const character = createTestCharacter(1);
    const other = createTestCharacter(2);
    const amDeck = deck(AttackModifierType.plus0);
    const factionModifier = Gh2ESealedDeckAttackModifier[0];
    vi.spyOn(gameManager.campaignManager, 'gh2eFactionUnlocks').mockReturnValue([]);
    expect(attackModifierManager.setFactionModifier(amDeck, character, factionModifier, true)).toBe(true);
    expect(amDeck.cards.map((am) => am.id)).toContain(factionModifier.id);
    expect(amDeck.cards.find((am) => am.id === factionModifier.id)).not.toBe(factionModifier);
    expect(attackModifierManager.setFactionModifier(amDeck, character, factionModifier, true)).toBe(false);
    character.attackModifierDeck = amDeck;
    expect(attackModifierManager.canSetFactionModifier(other.attackModifierDeck, other, factionModifier, true)).toBe(false);
    expect(attackModifierManager.canSetFactionModifier(other.attackModifierDeck, other, factionModifier, true, true)).toBe(true);
    attackModifierManager.setFactionModifier(amDeck, character, factionModifier, false);
    expect(amDeck.cards.map((am) => am.id)).not.toContain(factionModifier.id);
    expect(
      attackModifierManager.canSetFactionModifier(
        amDeck,
        character,
        Object.assign(new AttackModifier(AttackModifierType.plus1), { id: 'gh2e-test-1' }),
        true
      )
    ).toBe(false);
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
    expect(gameManager.trialsManager.applyFavors([], [2])).toBe(true);
    expect(gameManager.game.favors).toEqual([]);
    expect(gameManager.game.favorPoints).toEqual([1]);
    expect(refund).toHaveBeenCalledWith([2], 2);
    expect(gameManager.trialsManager.canApplyFavors([], [3])).toBe(false);
    expect(gameManager.trialsManager.canApplyFavors([], [2, 2, 2, 2])).toBe(false);
    expect(gameManager.trialsManager.canApplyFavors([], [2, 2, 2, 2], true)).toBe(true);
    expect(gameManager.trialsManager.canApplyFavors([new Identifier('unknown', 'fh')], [2])).toBe(false);
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
    expect(gameManager.attackModifierManager.setDiscarded(deck, 0, true)).toBe(false);
    deck.cards[0].active = true;
    expect(gameManager.attackModifierManager.setDiscarded(deck, 0, true)).toBe(true);
    expect(gameManager.attackModifierManager.setDiscarded(deck, 0, true)).toBe(false);
    expect(deck.discarded).toEqual([0]);
    expect(gameManager.attackModifierManager.setDiscarded(deck, 0, false)).toBe(false);
    expect(gameManager.attackModifierManager.setDiscarded(deck, 0, false, true)).toBe(true);
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
    gameManager.treasureManager.setPartyTreasure('gh', 5, true);
    gameManager.treasureManager.setPartyTreasure('gh', 5, true);
    expect(gameManager.treasureManager.hasPartyTreasure('gh', '5')).toBe(true);
    expect(gameManager.game.party.treasures.length).toBe(1);
    gameManager.treasureManager.setPartyTreasure('gh', 5, false);
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
    const change = vi.spyOn(gameManager.campaignManager, 'changeParty').mockImplementation(() => {});
    gameManager.game.parties = [gameManager.game.party];
    gameManager.game.party.id = 0;
    expect(gameManager.campaignManager.nextPartyId()).toBe(1);
    const party = gameManager.campaignManager.addParty('second');
    expect(party.id).toBe(1);
    expect(change).toHaveBeenCalledWith(party);
    gameManager.campaignManager.removeParty(party);
    expect(gameManager.game.parties.length).toBe(1);
    gameManager.campaignManager.removeParty(gameManager.game.parties[0]);
    expect(gameManager.game.parties.length).toBe(1);

    gameManager.game.conditions = [];
    gameManager.conditionManager.setGameCondition(ConditionName.bless, true);
    gameManager.conditionManager.setGameCondition(ConditionName.bless, true);
    expect(gameManager.game.conditions).toEqual([ConditionName.bless]);
    gameManager.conditionManager.setGameCondition(ConditionName.bless, false);
    expect(gameManager.game.conditions).toEqual([]);
  });

  it('adds and removes pets and toggles the garden', () => {
    gameManager.game.party.pets = [];
    vi.spyOn(gameManager.buildingsManager, 'petCard').mockReturnValue(new PetCard());
    const pet = gameManager.buildingsManager.addPet('fh', '1');
    expect(pet).toBeDefined();
    expect(gameManager.buildingsManager.addPet('fh', '1')).toBeUndefined();
    gameManager.buildingsManager.removePet('fh', '1');
    expect(gameManager.game.party.pets).toEqual([]);

    delete gameManager.game.party.garden;
    gameManager.game.party.buildings = [new BuildingModel('garden', 1)];
    settingsManager.settings.automaticPassTime = true;
    gameManager.buildingsManager.setGardenFlipped(true);
    gameManager.buildingsManager.setGardenAutomated(true);
    expect(gameManager.game.party.garden!.flipped).toBe(true);
    expect(gameManager.game.party.garden!.automated).toBe(true);
    settingsManager.settings.automaticPassTime = true;
    vi.restoreAllMocks();
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
    gameManager.campaignManager.removeConclusion('gh', '1');
    expect(gameManager.game.party.conclusions.map((model) => model.index)).toEqual(['2']);
  });
});

describe('manager helpers for character progress and game clock', () => {
  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('changes scenario experience without going below zero', () => {
    const character = createTestCharacter(1);
    character.experience = 1;
    gameManager.characterManager.changeExperience(character, -3);
    expect(character.experience).toBe(0);
    gameManager.characterManager.changeExperience(character, 2);
    expect(character.experience).toBe(2);
  });

  it('normalizes perks and the minimum experience of the level', () => {
    const character = createTestCharacter(1, 3);
    character.progress.perks = [1];
    character.progress.experience = 0;
    gameManager.characterManager.normalizeProgress(character);
    expect(character.progress.perks.length).toBe(15);
    expect(character.progress.perks[0]).toBe(1);
    expect(character.progress.experience).toBe(gameManager.characterManager.xpMap[2]);
  });

  it('resumes a clock out from a refresh and merges clock entries', () => {
    const now = new Date().getTime();
    gameManager.game.gameClock = [new GameClockTimestamp(now - 10000, now - 1000)];
    expect(gameManager.gameClockManager.clockedIn()).toBe(false);
    gameManager.gameClockManager.automaticClockIn();
    expect(gameManager.game.gameClock.length).toBe(1);
    expect(gameManager.gameClockManager.clockedIn()).toBe(true);

    gameManager.game.gameClock = [new GameClockTimestamp(now - 1000, now), new GameClockTimestamp(now - 5000, now - 2000)];
    gameManager.gameClockManager.mergeGameClock(1);
    expect(gameManager.game.gameClock.length).toBe(1);
    expect(gameManager.game.gameClock[0].clockIn).toBe(now - 5000);
    expect(gameManager.game.gameClock[0].clockOut).toBe(now);
  });
});

describe('AttackModifierManager change limits', () => {
  const attackModifierManager = gameManager.attackModifierManager;

  beforeEach(() => {
    resetTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('limits blesses, curses and extra -1 cards to the supply', () => {
    const deck = new AttackModifierDeck([]);
    expect(attackModifierManager.canChangeModifierCount(deck, AttackModifierType.bless, 10, false)).toBe(true);
    expect(attackModifierManager.canChangeModifierCount(deck, AttackModifierType.bless, 11, false)).toBe(false);
    expect(attackModifierManager.canChangeModifierCount(deck, AttackModifierType.curse, 10, true)).toBe(true);
    expect(attackModifierManager.canChangeModifierCount(deck, AttackModifierType.minus1extra, 16, true)).toBe(false);
    expect(attackModifierManager.canChangeModifierCount(deck, AttackModifierType.plus1, 1, true)).toBe(false);
    expect(attackModifierManager.canChangeModifierCount(deck, AttackModifierType.bless, 0, true)).toBe(false);
    expect(attackModifierManager.changeModifierCount(gameManager.game.monsterAttackModifierDeck, AttackModifierType.bless, 9, true)).toBe(
      true
    );
    expect(attackModifierManager.canChangeModifierCount(deck, AttackModifierType.bless, 2, false)).toBe(false);
  });

  it('limits empower to the perk count and rejects immune deck owners', () => {
    const character = createTestCharacter(1);
    const owner = createTestCharacter(2);
    character.additionalModifier = [
      Object.assign(new PerkCard(), { count: 2, attackModifier: new AttackModifier(AttackModifierType.empower) })
    ];
    const deck = new AttackModifierDeck([]);
    expect(attackModifierManager.additionalAvailable(character, AttackModifierType.empower)).toBe(2);
    expect(attackModifierManager.canChangeAdditionalCount(deck, character, AttackModifierType.empower, 3)).toBe(false);
    expect(attackModifierManager.canChangeAdditionalCount(deck, character, AttackModifierType.enfeeble, 1)).toBe(false);
    expect(attackModifierManager.canChangeAdditionalCount(deck, undefined, AttackModifierType.empower, 1)).toBe(false);
    vi.spyOn(gameManager.conditionManager, 'isImmune').mockReturnValue(true);
    expect(attackModifierManager.canChangeAdditionalCount(deck, character, AttackModifierType.empower, 1, owner)).toBe(false);
    expect(attackModifierManager.canChangeAdditionalCount(deck, character, AttackModifierType.empower, 1)).toBe(true);
  });

  it('validates move positions of upcoming and discarded cards', () => {
    expect(deckMoveValid(0, 3, 'upcoming', 1, 'upcoming', 1)).toBe(true);
    expect(deckMoveValid(0, 3, 'upcoming', 2, 'upcoming', 0)).toBe(false);
    expect(deckMoveValid(0, 3, 'upcoming', 0, 'upcoming', 2)).toBe(false);
    expect(deckMoveValid(0, 3, 'upcoming', 0, 'discarded', 1)).toBe(true);
    expect(deckMoveValid(0, 3, 'discarded', 0, 'upcoming', 2)).toBe(true);
    expect(deckMoveValid(0, 3, 'discarded', 1, 'upcoming', 0)).toBe(false);
    expect(deckMoveValid(0, 3, 'other', 0, 'upcoming', 0)).toBe(false);
  });
});
