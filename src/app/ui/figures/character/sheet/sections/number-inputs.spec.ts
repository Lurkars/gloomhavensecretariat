import { DialogRef } from '@angular/cdk/dialog';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { LootType } from 'src/app/game/model/data/Loot';
import { CharacterSheetCountersComponent } from 'src/app/ui/figures/character/sheet/sections/counters';
import { CharacterSheetGoldComponent } from 'src/app/ui/figures/character/sheet/sections/gold';
import { CharacterSheetResourcesComponent } from 'src/app/ui/figures/character/sheet/sections/resources';
import { CharacterSheetXpComponent } from 'src/app/ui/figures/character/sheet/sections/xp';
import { PartySheetFhResourcesComponent } from 'src/app/ui/figures/party/sheet/sections/fh-resources';
import { PartySheetInspirationComponent } from 'src/app/ui/figures/party/sheet/sections/inspiration';

// Number inputs only limit the spinner with min="0", typed negative values must be clamped by the handlers.
// Components are created via TestBed without rendering the template.

function buildCharacter(): Character {
  return new Character(Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] }), 1);
}

function createCharacterSection<T>(type: Type<T>, character: Character): T {
  const fixture = TestBed.createComponent(type);
  fixture.componentRef.setInput('character', character);
  return fixture.componentInstance;
}

function createPartySection<T>(type: Type<T>): T {
  return TestBed.createComponent(type).componentInstance;
}

function input(value: string): any {
  return { target: { value } };
}

describe('sheet number inputs', () => {
  let character: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: DialogRef, useValue: { closed: { subscribe: () => {} }, close: () => {} } }]
    }).compileComponents();
    vi.spyOn(storageManager, 'writeGameModel').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'writeArray').mockResolvedValue(undefined);
    vi.spyOn(storageManager, 'append').mockResolvedValue(undefined as any);
    vi.spyOn(gameManager, 'triggerUiChange').mockImplementation(() => undefined);
    vi.spyOn(gameManager.stateManager, 'autoBackup').mockResolvedValue(undefined);
    settingsManager.settings.fhShareResources = false;
    character = buildCharacter();
    gameManager.game.figures = [character];
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    gameManager.game.figures = [];
    document.body.className = '';
  });

  it('clamps extra perks and retirements to zero', () => {
    character.progress.extraPerks = 2;
    character.progress.retirements = 3;
    const counters = createCharacterSection(CharacterSheetCountersComponent, character);
    const event = input('-4');

    counters.setExtraPerks(event);
    counters.setRetirements(input('-1'));

    expect(character.progress.extraPerks).toBe(0);
    expect(character.progress.retirements).toBe(0);
    expect(event.target.value).toBe(0);
  });

  it('clamps gold and experience to zero', () => {
    vi.useFakeTimers();
    character.progress.gold = 20;
    character.progress.experience = 20;
    const gold = createCharacterSection(CharacterSheetGoldComponent, character);
    const xp = createCharacterSection(CharacterSheetXpComponent, character);
    const xpEvent = input('-5');

    gold.setGold(input('-5'));
    xp.setXP(xpEvent);
    vi.advanceTimersByTime(600);

    expect(character.progress.gold).toBe(0);
    expect(character.progress.experience).toBe(0);
    expect(xpEvent.target.value).toBe(0);
  });

  it('ignores input which is no number', () => {
    character.progress.extraPerks = 2;
    createCharacterSection(CharacterSheetCountersComponent, character).setExtraPerks(input('abc'));
    expect(character.progress.extraPerks).toBe(2);
  });

  it('clamps character and party resources and inspiration to zero', () => {
    character.progress.loot[LootType.lumber] = 2;
    gameManager.game.party.loot[LootType.hide] = 2;
    gameManager.game.party.inspiration = 3;

    createCharacterSection(CharacterSheetResourcesComponent, character).setResource(LootType.lumber, input('-2'));
    createPartySection(PartySheetFhResourcesComponent).setResource(LootType.hide, input('-2'));
    createPartySection(PartySheetInspirationComponent).setInspiration(input('-2'));

    expect(character.progress.loot[LootType.lumber]).toBe(0);
    expect(gameManager.game.party.loot[LootType.hide]).toBe(0);
    expect(gameManager.game.party.inspiration).toBe(0);
  });
});
