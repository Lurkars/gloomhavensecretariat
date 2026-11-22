import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { CharacterRetireCommand } from 'src/app/game/commands/character/CharacterRetire';
import { Character } from 'src/app/game/model/Character';
import { BuildingData } from 'src/app/game/model/data/BuildingData';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { CampaignData, EditionData } from 'src/app/game/model/data/EditionData';
import { ItemData } from 'src/app/game/model/data/ItemData';
import { PersonalQuest } from 'src/app/game/model/data/PersonalQuest';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';

function buildCharacter(personalQuest: string = ''): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  const character = new Character(data, 1);
  character.progress.personalQuest = personalQuest;
  return character;
}

function setupEdition(personalQuests: PersonalQuest[], extra: Partial<EditionData> = {}) {
  gameManager.editionData = [
    Object.assign(new EditionData('gh', [], [], [], [], [], [], undefined, [], [], personalQuests), {
      campaign: new CampaignData(),
      ...extra
    })
  ];
}

describe('RetirementManager', () => {
  const retirementManager = gameManager.retirementManager;
  const scenarioA = Object.assign(new ScenarioData(), { index: '50', edition: 'gh', group: undefined });
  const scenarioB = Object.assign(new ScenarioData(), { index: '51', edition: 'gh', group: undefined });
  const itemA = Object.assign(new ItemData(), { id: 70, edition: 'gh' });
  const itemB = Object.assign(new ItemData(), { id: 71, edition: 'gh' });

  beforeEach(() => {
    gameManager.game.edition = 'gh';
    gameManager.game.figures = [];
    gameManager.game.unlockedCharacters = [];
    gameManager.game.party.campaignMode = true;
    gameManager.game.party.retirements = [];
    gameManager.game.party.buildings = [];
    gameManager.game.party.conclusions = [];
    gameManager.game.party.manualScenarios = [];
    gameManager.game.party.unlockedItems = [];
    gameManager.game.party.inspiration = 20;
    settingsManager.settings.editions = ['gh'];
    settingsManager.settings.automaticUnlocking = true;
    settingsManager.settings.unlockEnvelopeBuildings = false;
    settingsManager.settings.applyRetirement = true;
    settingsManager.settings.drawRandomScenario = true;
    settingsManager.settings.drawRandomItem = true;
    settingsManager.settings.events = false;
    setupEdition([]);
    vi.spyOn(gameManager.campaignManager, 'changeProsperity').mockImplementation(() => {});
    vi.spyOn(gameManager.scenarioManager, 'drawRandomScenariosBatch').mockImplementation(() => [scenarioA, scenarioB]);
    vi.spyOn(gameManager.itemManager, 'drawRandomItemsBatch').mockImplementation(() => [itemA, itemB]);
  });

  afterEach(() => vi.restoreAllMocks());

  it('retires a character without rewards', () => {
    const character = buildCharacter();
    gameManager.game.figures = [character];
    retirementManager.retireCharacter(character);
    expect(character.progress.retired).toBe(true);
    expect(gameManager.game.figures).toEqual([]);
    expect(gameManager.game.party.retirements.length).toBe(1);

    const other = buildCharacter();
    gameManager.game.figures = [other];
    gameManager.game.party.campaignMode = false;
    retirementManager.retireCharacter(other);
    expect(other.progress.retired).toBe(true);
    expect(gameManager.game.figures).toEqual([other]);
  });

  it('unlocks the character of the personal quest', () => {
    const pq = Object.assign(new PersonalQuest(), { cardId: '510', edition: 'gh', unlockCharacter: 'squidface', unlockPQ: '520' });
    setupEdition([pq], {
      characters: [Object.assign(new CharacterData(), { name: 'squidface', edition: 'gh', unlockEvent: 'city:81' })]
    });
    settingsManager.settings.events = true;
    const addEvent = vi.spyOn(gameManager.eventCardManager, 'addEvent').mockImplementation(() => {});
    const unlockPQ = vi.spyOn(gameManager.personalQuestManager, 'unlockPersonalQuest').mockImplementation(() => {});
    const character = buildCharacter('510');
    gameManager.game.figures = [character];

    const retirement = retirementManager.retirement(character);
    expect(retirement.personalQuest?.characterAlreadyUnlocked).toBe(false);
    expect(retirement.personalQuest?.unlockEvent).toBe('city:81');

    retirementManager.retire(retirement);
    expect(gameManager.game.unlockedCharacters).toEqual(['gh:squidface']);
    expect(addEvent).toHaveBeenCalledWith('city', '81', true);
    expect(unlockPQ).toHaveBeenCalledWith('gh', '520');
    expect(gameManager.game.party.manualScenarios).toEqual([]);
  });

  it('draws a random scenario and item design if the character is already unlocked', () => {
    const pq = Object.assign(new PersonalQuest(), { cardId: '510', edition: 'gh', unlockCharacter: 'squidface' });
    setupEdition([pq]);
    gameManager.game.unlockedCharacters = ['gh:squidface'];
    const character = buildCharacter('510');
    gameManager.game.figures = [character];

    const retirement = retirementManager.retirement(character);
    expect(retirement.personalQuest?.characterScenario).toBe(scenarioB);
    expect(retirement.personalQuest?.characterItemDesign).toBe(itemB);
    expect(retirement.reservedRandomScenario).toBe(scenarioA);
    expect(retirement.reservedRandomItem).toBe(itemA);

    retirementManager.retire(retirement);
    expect(gameManager.game.party.manualScenarios.map((model) => model.index)).toEqual(['51']);
    expect(gameManager.game.party.unlockedItems.map((identifier) => identifier.name)).toEqual(['71']);
  });

  it('only flags random rewards when drawing is disabled', () => {
    const pq = Object.assign(new PersonalQuest(), { cardId: '510', edition: 'gh', unlockCharacter: 'squidface' });
    setupEdition([pq]);
    settingsManager.settings.drawRandomScenario = false;
    settingsManager.settings.drawRandomItem = false;
    gameManager.game.unlockedCharacters = ['gh:squidface'];
    const retirement = retirementManager.retirement(buildCharacter('510'));
    expect(retirement.personalQuest?.characterScenario).toBe(true);
    expect(retirement.personalQuest?.characterItemDesign).toBe(true);
    retirementManager.retire(retirement);
    expect(gameManager.game.party.manualScenarios).toEqual([]);
    expect(gameManager.game.party.unlockedItems).toEqual([]);
  });

  it('applies an additional personal quest only when selected', () => {
    const pq = Object.assign(new PersonalQuest(), { cardId: '510', edition: 'gh' });
    const additional = Object.assign(new PersonalQuest(), { cardId: '511', edition: 'gh', unlockCharacter: 'three-spears' });
    setupEdition([pq, additional]);
    vi.spyOn(gameManager, 'fhRules').mockReturnValue(true);

    const retirement = retirementManager.retirement(buildCharacter('510'));
    retirementManager.setAdditionalQuest(retirement, '511');
    expect(retirement.additional?.personalQuest).toBe(additional);
    retirementManager.retire(retirement, false);
    expect(gameManager.game.unlockedCharacters).toEqual([]);
    expect(gameManager.game.party.inspiration).toBe(20);

    const second = retirementManager.retirement(buildCharacter('510'));
    retirementManager.setAdditionalQuest(second, '511');
    retirementManager.retire(second, true);
    expect(gameManager.game.unlockedCharacters).toEqual(['gh:three-spears']);
    expect(gameManager.game.party.inspiration).toBe(5);
    expect(gameManager.campaignManager.changeProsperity).toHaveBeenCalledWith(2);

    retirementManager.setAdditionalQuest(second, 'unknown');
    expect(second.additional).toBeUndefined();
  });

  it('unlocks the envelope building', () => {
    const pq = Object.assign(new PersonalQuest(), { cardId: '581', edition: 'gh', openEnvelope: 'a:b' });
    const buildingA = Object.assign(new BuildingData(), { id: 'a', name: 'sanctuary' });
    const buildingB = Object.assign(new BuildingData(), { id: 'b', name: 'shrine' });
    setupEdition([pq], { campaign: Object.assign(new CampaignData(), { buildings: [buildingA, buildingB] }) });
    settingsManager.settings.unlockEnvelopeBuildings = true;

    const retirement = retirementManager.retirement(buildCharacter('581'));
    expect(retirement.personalQuest?.building).toBe(buildingA);
    retirementManager.retire(retirement);
    expect(gameManager.game.party.buildings.map((building) => building.name)).toEqual(['sanctuary']);
  });

  it('returns the retirement conclusions not finished yet', () => {
    const conclusion = Object.assign(new ScenarioData(), { edition: 'gh', index: 'c1', conclusion: true, retirement: 'brute' });
    setupEdition([], { sections: [conclusion] });
    const retirement = retirementManager.retirement(buildCharacter());
    expect(retirement.conclusion).toBe(conclusion);
    expect(retirementManager.retire(retirement)).toEqual([conclusion]);
  });

  describe('envelopeBuilding', () => {
    const buildingA = Object.assign(new BuildingData(), { id: 'a', name: 'sanctuary' });
    const buildingB = Object.assign(new BuildingData(), { id: 'b', name: 'shrine' });

    beforeEach(() => {
      setupEdition([], { campaign: Object.assign(new CampaignData(), { buildings: [buildingA, buildingB] }) });
    });

    it('returns the first not yet built envelope building', () => {
      expect(retirementManager.envelopeBuilding('a:b')).toBe(buildingA);
    });

    it('falls through to the second building once the first is built or excluded', () => {
      expect(retirementManager.envelopeBuilding('a:b', true, buildingA)).toBe(buildingB);
      gameManager.game.party.buildings = [{ name: 'sanctuary', level: 1 } as any];
      expect(retirementManager.envelopeBuilding('a:b')).toBe(buildingB);
      expect(retirementManager.envelopeBuilding('a:b', false)).toBeUndefined();
    });

    it('returns undefined once all envelope buildings are built', () => {
      gameManager.game.party.buildings = [{ name: 'sanctuary', level: 1 } as any, { name: 'shrine', level: 1 } as any];
      expect(retirementManager.envelopeBuilding('a:b')).toBeUndefined();
    });
  });

  describe('CharacterRetireCommand', () => {
    it('applies the full retirement with an additional personal quest', () => {
      const pq = Object.assign(new PersonalQuest(), { cardId: '510', edition: 'gh', unlockCharacter: 'squidface' });
      const additional = Object.assign(new PersonalQuest(), { cardId: '511', edition: 'gh', unlockCharacter: 'three-spears' });
      setupEdition([pq, additional]);
      const character = buildCharacter('510');
      character.number = 1;
      gameManager.game.figures = [character];
      const retire = vi.spyOn(retirementManager, 'retire');

      expect(new CharacterRetireCommand(1, 5, 'unknown').validParameters(1, 5, 'unknown')).toBe(false);
      new CharacterRetireCommand(1, 5, '511').execute();
      expect(retire).toHaveBeenCalledWith(expect.objectContaining({ character }), true);
      expect(gameManager.game.unlockedCharacters).toEqual(['gh:squidface', 'gh:three-spears']);
    });

    it('only retires without the retirement setting', () => {
      settingsManager.settings.applyRetirement = false;
      const character = buildCharacter();
      character.number = 1;
      gameManager.game.figures = [character];
      const retire = vi.spyOn(retirementManager, 'retire');
      new CharacterRetireCommand(1, 5).execute();
      expect(retire).not.toHaveBeenCalled();
      expect(character.progress.retired).toBe(true);
    });
  });
});

describe('RetirementManager reactivate', () => {
  const retirementManager = gameManager.retirementManager;

  it('reactivates retired characters not already in play', () => {
    const character = new Character(
      Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }),
      1
    );
    character.progress.retired = true;
    const model = character.toModel();
    gameManager.game.figures = [];
    gameManager.game.party.availableCharacters = [];
    gameManager.game.party.retirements = [model];
    expect(retirementManager.reactivatable(model)).toBe(true);
    retirementManager.reactivateCharacter(model);
    expect(gameManager.game.party.retirements).toEqual([]);
    expect((gameManager.game.figures[0] as Character).progress.retired).toBe(false);
    expect(retirementManager.reactivatable(model)).toBe(false);
  });
});
