import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ChallengeDeck } from 'src/app/game/model/data/Challenges';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { LootDeck } from 'src/app/game/model/data/Loot';
import { ScenarioData } from 'src/app/game/model/data/ScenarioData';
import { GameState } from 'src/app/game/model/Game';
import { Scenario } from 'src/app/game/model/Scenario';
import { FooterComponent } from 'src/app/ui/footer/footer';

// FooterComponent drives the main "next"/"draw" state-machine button plus the attack-modifier/
// loot/challenge deck toggles. Following the AppComponent.spec.ts pattern: create via TestBed but
// never call fixture.detectChanges() (so the template and its many child components never need to
// resolve, and ngOnInit's setInterval/setTimeout/resize-listener side effects never run); call
// methods directly instead. This spec covers the boolean gate methods (missingInitiative/active/
// battleGoals/eventDraw/activeHint/failed/disabled and friends) and the simple deck-active toggles.
// next()/nextState()/finishScenario()/resetScenario() drive StateManager+RoundManager end-to-end
// flows and are out of scope here.

function buildCharacter(name: string = 'brute'): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

describe('FooterComponent', () => {
  let component: FooterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FooterComponent] }).compileComponents();
    const fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;

    vi.spyOn(gameManager.stateManager, 'before').mockImplementation(() => {});
    vi.spyOn(gameManager.stateManager, 'after').mockImplementation(async () => {});

    gameManager.game.figures = [];
    gameManager.game.round = 0;
    gameManager.game.roundResets = [];
    gameManager.game.roundResetsHidden = [];
    gameManager.game.state = GameState.draw;
    gameManager.game.scenario = undefined;
    gameManager.game.eventDraw = undefined;
    gameManager.game.lootDeck = new LootDeck();
    gameManager.game.challengeDeck = new ChallengeDeck();
    gameManager.roundManager.firstRound = false;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.battleGoals = false;
    settingsManager.settings.battleGoalsReminder = true;
    settingsManager.settings.eventsDraw = true;
    settingsManager.settings.eventsDrawReminder = false;
    settingsManager.settings.turnConfirmation = true;
    settingsManager.settings.applyConditions = true;
    settingsManager.settings.expireConditions = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the template without throwing when the game is empty', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('empty', () => {
    it('is true when there are no figures', () => {
      expect(component.empty()).toBe(true);
    });

    it('is false once a figure is present', () => {
      gameManager.game.figures = [buildCharacter()];
      expect(component.empty()).toBe(false);
    });
  });

  describe('round / totalRounds', () => {
    it('round() is 0 before the scenario starts', () => {
      expect(component.round()).toEqual(0);
    });

    it('round() adds a +1 offset once rounds have occurred and we are back at draw', () => {
      gameManager.game.round = 2;
      gameManager.game.state = GameState.draw;
      expect(component.round()).toEqual(3);
    });

    it('round() has no offset mid-round (state=next)', () => {
      gameManager.game.round = 2;
      gameManager.game.state = GameState.next;
      expect(component.round()).toEqual(2);
    });

    it('totalRounds() is 0 with no resets recorded', () => {
      expect(component.totalRounds()).toEqual(0);
    });

    it('totalRounds() sums roundResets plus the current round', () => {
      gameManager.game.round = 1;
      gameManager.game.state = GameState.next;
      gameManager.game.roundResets = [3, 2];
      expect(component.totalRounds()).toEqual(3 + 2 + 1);
    });
  });

  describe('missingInitiative', () => {
    it('is true when a living, non-absent character has initiative <= 0', () => {
      const character = buildCharacter();
      character.initiative = 0;
      gameManager.game.figures = [character];
      expect(component.missingInitiative()).toBe(true);
    });

    it('is false once initiative is set', () => {
      const character = buildCharacter();
      character.initiative = 5;
      gameManager.game.figures = [character];
      expect(component.missingInitiative()).toBe(false);
    });

    it('is false when initiativeRequired is disabled', () => {
      settingsManager.settings.initiativeRequired = false;
      const character = buildCharacter();
      character.initiative = 0;
      gameManager.game.figures = [character];
      expect(component.missingInitiative()).toBe(false);
    });
  });

  describe('active', () => {
    it('is true when a non-absent figure is active and not off', () => {
      const character = buildCharacter();
      character.active = true;
      character.off = false;
      gameManager.game.figures = [character];
      expect(component.active()).toBe(true);
    });

    it('is false when the active character is absent', () => {
      const character = buildCharacter();
      character.active = true;
      character.off = false;
      character.absent = true;
      gameManager.game.figures = [character];
      expect(component.active()).toBe(false);
    });
  });

  describe('battleGoals', () => {
    it('is true when battle goals are enabled, reminders on, first round, and a character lacks one', () => {
      settingsManager.settings.battleGoals = true;
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      gameManager.roundManager.firstRound = true;
      const character = buildCharacter();
      character.initiative = 5;
      character.battleGoal = false;
      gameManager.game.figures = [character];
      expect(component.battleGoals()).toBe(true);
    });

    it('is false once every character has a battle goal', () => {
      settingsManager.settings.battleGoals = true;
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      gameManager.roundManager.firstRound = true;
      const character = buildCharacter();
      character.initiative = 5;
      character.battleGoal = true;
      gameManager.game.figures = [character];
      expect(component.battleGoals()).toBe(false);
    });

    it('is false when the battleGoals setting is off', () => {
      settingsManager.settings.battleGoals = false;
      gameManager.roundManager.firstRound = true;
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      expect(component.battleGoals()).toBe(false);
    });
  });

  describe('eventDraw', () => {
    it('is true once eventsDraw is disabled, reminder on, first round, and a scenario event is pending', () => {
      settingsManager.settings.eventsDraw = false;
      settingsManager.settings.eventsDrawReminder = true;
      gameManager.roundManager.firstRound = true;
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      gameManager.game.eventDraw = 'city';
      expect(component.eventDraw()).toBe(true);
    });

    it('is false when there is no pending event draw', () => {
      settingsManager.settings.eventsDraw = false;
      settingsManager.settings.eventsDrawReminder = true;
      gameManager.roundManager.firstRound = true;
      gameManager.game.scenario = new Scenario(Object.assign(new ScenarioData(), { edition: 'gh', index: '1' }));
      gameManager.game.eventDraw = undefined;
      expect(component.eventDraw()).toBe(false);
    });
  });

  describe('activeHint', () => {
    it('is true while a figure is active, turn confirmation is on, and condition settings are enabled', () => {
      const character = buildCharacter();
      character.active = true;
      character.off = false;
      gameManager.game.figures = [character];
      expect(component.activeHint()).toBe(true);
    });

    it('is false when turnConfirmation is off', () => {
      settingsManager.settings.turnConfirmation = false;
      const character = buildCharacter();
      character.active = true;
      character.off = false;
      gameManager.game.figures = [character];
      expect(component.activeHint()).toBe(false);
    });
  });

  describe('failed', () => {
    it('is true once every character is exhausted/dead/absent and none is active', () => {
      const character = buildCharacter();
      character.exhausted = true;
      character.active = false;
      gameManager.game.figures = [character];
      expect(component.failed()).toBe(true);
    });

    it('is false while a character is still able to act', () => {
      const character = buildCharacter();
      character.exhausted = false;
      character.health = 5;
      character.absent = false;
      gameManager.game.figures = [character];
      expect(component.failed()).toBe(false);
    });

    it('is false with no characters at all', () => {
      expect(component.failed()).toBe(false);
    });
  });

  describe('disabled / drawDisabled / nextDisabled', () => {
    it('draw state is disabled while empty', () => {
      gameManager.game.state = GameState.draw;
      expect(component.disabled()).toBe(true);
      expect(component.drawDisabled()).toBe(true);
    });

    it('draw state is enabled once figures are present and initiative is set', () => {
      gameManager.game.state = GameState.draw;
      const character = buildCharacter();
      character.initiative = 5;
      gameManager.game.figures = [character];
      expect(component.disabled()).toBe(false);
    });

    it('next state is disabled via activeHint while a figure is active', () => {
      gameManager.game.state = GameState.next;
      const character = buildCharacter();
      character.active = true;
      character.off = false;
      gameManager.game.figures = [character];
      expect(component.disabled()).toBe(true);
      expect(component.nextDisabled()).toBe(true);
    });

    it('next state is enabled once no figure is active', () => {
      gameManager.game.state = GameState.next;
      expect(component.disabled()).toBe(false);
    });
  });

  describe('toggleLootDeck / toggleChallengeDeck', () => {
    it('toggleLootDeck flips the loot deck active flag', () => {
      gameManager.game.lootDeck.active = false;
      component.toggleLootDeck();
      expect(gameManager.game.lootDeck.active).toBe(true);
      component.toggleLootDeck();
      expect(gameManager.game.lootDeck.active).toBe(false);
    });

    it('toggleChallengeDeck flips the challenge deck active flag', () => {
      gameManager.game.challengeDeck.active = false;
      component.toggleChallengeDeck();
      expect(gameManager.game.challengeDeck.active).toBe(true);
    });
  });
});
