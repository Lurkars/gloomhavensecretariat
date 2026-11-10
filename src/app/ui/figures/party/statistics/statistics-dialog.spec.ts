import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Character } from 'src/app/game/model/Character';
import { ScenarioStats } from 'src/app/game/model/CharacterProgress';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { LootType } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameScenarioModel } from 'src/app/game/model/Scenario';
import { StatisticsDialogComponent } from 'src/app/ui/figures/party/statistics/statistics-dialog';

function buildCharacter(name: string = 'brute'): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function buildStat(index: string, success: boolean, values: Partial<ScenarioStats> = {}): ScenarioStats {
  return Object.assign(new ScenarioStats(), { scenario: new GameScenarioModel(index, 'gh'), success }, values);
}

function createComponent(data: { character?: Character; scenario?: ScenarioData }): StatisticsDialogComponent {
  TestBed.overrideProvider(DIALOG_DATA, { useValue: data });
  const component = TestBed.createComponent(StatisticsDialogComponent).componentInstance;
  component.ngOnInit();
  return component;
}

describe('StatisticsDialogComponent', () => {
  let character: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsDialogComponent],
      providers: [{ provide: DIALOG_DATA, useValue: {} }]
    }).compileComponents();

    character = buildCharacter();
    character.progress.scenarioStats = [
      buildStat('1', false, { dealtDamage: 3, level: 1, difficulty: 1, loot: { lumber: 1 } }),
      buildStat('1', true, { dealtDamage: 5, level: 2, difficulty: 2, loot: { lumber: 2, money: 3, random_item: 1 } }),
      buildStat('2', true, { dealtDamage: 7, level: 2, difficulty: 2 })
    ];
    gameManager.game.figures = [character];
  });

  afterEach(() => {
    gameManager.game.figures = [];
  });

  it('does not overwrite the live scenario stats of the character it is opened for', () => {
    const live = Object.assign(new ScenarioStats(), { dealtDamage: 2 });
    character.scenarioStats = live;

    const component = createComponent({ character });

    expect(character.scenarioStats).toBe(live);
    expect(character.scenarioStats.dealtDamage).toBe(2);
    expect(component.characters[0]).not.toBe(character);
    expect(component.characters[0].scenarioStats.dealtDamage).toBe(15);
  });

  it('does not overwrite the live scenario stats in party mode', () => {
    const live = Object.assign(new ScenarioStats(), { dealtDamage: 2 });
    character.scenarioStats = live;

    createComponent({});

    expect(character.scenarioStats).toBe(live);
  });

  it('shows a single selected attempt of a scenario, latest by default', () => {
    const scenario = Object.assign(new ScenarioData(), { index: '1', edition: 'gh' });

    const component = createComponent({ scenario });

    expect(component.attempts.map((attempt) => [attempt.success, attempt.difficulty])).toEqual([
      [false, 1],
      [true, 2]
    ]);
    expect(component.selectedAttempt).toBe(1);
    expect(component.characters[0].scenarioStats.dealtDamage).toBe(5);
    expect(component.characters[0].scenarioStats.level).toBe(2);
    expect(component.overall.dealtDamage).toBe(5);

    component.selectAttempt(0);

    expect(component.characters[0].scenarioStats.dealtDamage).toBe(3);
    expect(component.characters[0].scenarioStats.success).toBe(false);
    expect(component.overall.dealtDamage).toBe(3);
  });

  it('matches attempts across characters by timestamp and only shows participating characters', () => {
    const scenario = Object.assign(new ScenarioData(), { index: '4', edition: 'gh' });
    character.progress.scenarioStats = [
      buildStat('4', false, { timestamp: 100, dealtDamage: 1 }),
      buildStat('4', true, { timestamp: 200, dealtDamage: 2 })
    ];
    const lateJoiner = buildCharacter('spellweaver');
    lateJoiner.progress.scenarioStats = [buildStat('4', true, { timestamp: 200, dealtDamage: 4 })];
    gameManager.game.figures = [character, lateJoiner];

    const component = createComponent({ scenario });

    expect(component.attempts.length).toBe(2);
    expect(component.characters.length).toBe(2);
    expect(component.overall.dealtDamage).toBe(6);

    component.selectAttempt(0);

    expect(component.characters.map((c) => c.name)).toEqual(['brute']);
    expect(component.overall.dealtDamage).toBe(1);
  });

  it('includes retired and available characters that played the scenario', () => {
    const scenario = Object.assign(new ScenarioData(), { index: '1', edition: 'gh' });
    const retired = buildCharacter('spellweaver');
    retired.progress.scenarioStats = [buildStat('1', true, { dealtDamage: 10 })];
    const available = buildCharacter('tinkerer');
    available.progress.scenarioStats = [buildStat('2', true, { dealtDamage: 20 })];
    gameManager.game.party.retirements = [retired.toModel()];
    gameManager.game.party.availableCharacters = [available.toModel()];

    try {
      const component = createComponent({ scenario });
      // legacy records without timestamp are matched by order: the retired record is attempt #1
      component.selectAttempt(0);

      expect(component.characters.map((c) => c.name)).toEqual(['brute', 'spellweaver']);
      expect(component.overall.dealtDamage).toBe(13);

      // the party overview keeps them hidden by default
      component.scenario = undefined;
      component.update();
      expect(component.characters.map((c) => c.name)).toEqual(['brute']);
    } finally {
      gameManager.game.party.retirements = [];
      gameManager.game.party.availableCharacters = [];
    }
  });

  it('sums loot of every type, including money and random items', () => {
    const component = createComponent({});

    const loot = component.characters[0].scenarioStats.loot;
    expect(loot[LootType.lumber]).toBe(3);
    expect(loot[LootType.money]).toBe(3);
    expect(loot[LootType.random_item]).toBe(1);
    expect(component.otherLoot).toEqual([LootType.money, LootType.random_item]);
  });

  it('tolerates records without loot', () => {
    character.progress.scenarioStats = [Object.assign(buildStat('3', true), { loot: undefined })];

    const component = createComponent({});

    expect(component.characters[0].scenarioStats.loot).toEqual({});
  });
});
