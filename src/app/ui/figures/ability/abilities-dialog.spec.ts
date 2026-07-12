import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Ability } from 'src/app/game/model/data/Ability';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { AbiltiesDialogComponent } from 'src/app/ui/figures/ability/abilities-dialog';

// AbiltiesDialogComponent's DIALOG_DATA is the Monster directly (not wrapped in an object), and it
// injects no Dialog service at all — no dialog-opening methods exist on this component, making it a
// clean, low-setup target. Following the AppComponent.spec.ts pattern: create via TestBed, never
// call fixture.detectChanges() (ngOnInit never runs; we call update() directly instead). This spec
// covers toggleEdit, update()'s upcoming/discarded/deleted bucketing, abilityIndex, abilityLabel,
// defaultSort, and toggleKeepRevealed/onRevealedChange; shuffle/draw/toggleDrawExtra/dropUpcoming/
// dropDiscarded/restoreDefault/remove/restore (all deep MonsterManager deck-mutation flows) are out
// of scope.

function buildMonster(abilities: Ability[]): Monster {
  const stat = new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0);
  const monster = new Monster(Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh', stats: [stat] }), 1);
  gameManager.editionData = [new EditionData('gh', [], [], [new DeckData('gh', 'bandit-guard', false, abilities)], [], [], [])];
  return monster;
}

function createComponent(monster: Monster): AbiltiesDialogComponent {
  TestBed.configureTestingModule({
    imports: [AbiltiesDialogComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: monster },
      { provide: DialogRef, useValue: { closed: { subscribe: () => {} } } }
    ]
  });
  const fixture = TestBed.createComponent(AbiltiesDialogComponent);
  return fixture.componentInstance;
}

describe('AbiltiesDialogComponent', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    settingsManager.settings.editions = ['gh'];
    // Guard against settingsManager.label leaking in from another spec file that ran earlier in
    // this worker (e.g. StateManager.spec.ts/datamanagement.spec.ts populate it for Party.migrate())
    // — abilityLabel()'s assertions depend on a clean/empty label object.
    settingsManager.label = {};
  });

  describe('toggleEdit', () => {
    it('flips the edit flag', () => {
      const monster = buildMonster([]);
      const component = createComponent(monster);
      component.edit = false;
      component.toggleEdit();
      expect(component.edit).toBe(true);
    });
  });

  describe('update', () => {
    it('buckets abilities into upcoming/discarded by the current ability index', () => {
      const deckAbilities = [new Ability(1, 'a'), new Ability(2, 'b'), new Ability(3, 'c')];
      const monster = buildMonster(deckAbilities);
      monster.abilities = [0, 1, 2];
      monster.ability = 1;
      const component = createComponent(monster);
      component.update();
      expect(component.discardedCards.map((a) => a.name)).toEqual(['b', 'a']);
      expect(component.upcomingCards.map((a) => a.name)).toEqual(['c']);
    });

    it('lists deck abilities not currently in the monster deck as deletedCards', () => {
      const deckAbilities = [new Ability(1, 'a'), new Ability(2, 'b')];
      const monster = buildMonster(deckAbilities);
      monster.abilities = [0];
      monster.ability = 0;
      const component = createComponent(monster);
      component.update();
      expect(component.deletedCards.map((a) => a.name)).toEqual(['b']);
    });

    it('restores keepRevealed/ability.revealed from monster.revealedAbilities on init', () => {
      const deckAbilities = [new Ability(1, 'a'), new Ability(2, 'b')];
      const monster = buildMonster(deckAbilities);
      monster.abilities = [0, 1];
      monster.ability = 1;
      monster.revealedAbilities = [true, false];
      const component = createComponent(monster);
      component.update(true);
      expect(component.keepRevealed).toEqual([true, false]);
      expect(component.abilities[0].revealed).toBe(true);
    });
  });

  describe('abilityIndex', () => {
    it('finds the deck index of a given ability', () => {
      const deckAbilities = [new Ability(1, 'a'), new Ability(2, 'b')];
      const monster = buildMonster(deckAbilities);
      const component = createComponent(monster);
      expect(component.abilityIndex(deckAbilities[1])).toEqual(1);
    });
  });

  describe('abilityLabel', () => {
    it('uses the named-ability label when the ability has a name', () => {
      const monster = buildMonster([]);
      const component = createComponent(monster);
      const ability = new Ability(1, 'fireball');
      expect(component.abilityLabel(ability)).toEqual('data.ability.fireball');
    });
  });

  describe('defaultSort', () => {
    it('sorts the monster ability index array ascending', () => {
      const monster = buildMonster([new Ability(1, 'a'), new Ability(2, 'b'), new Ability(3, 'c')]);
      monster.abilities = [2, 0, 1];
      const component = createComponent(monster);
      component.defaultSort();
      expect(monster.abilities).toEqual([0, 1, 2]);
    });
  });

  describe('toggleKeepRevealed / onRevealedChange', () => {
    it('toggleKeepRevealed flips the flag and reveals the ability when turned on', () => {
      const deckAbilities = [new Ability(1, 'a')];
      const monster = buildMonster(deckAbilities);
      monster.abilities = [0];
      const component = createComponent(monster);
      component.update();
      component.keepRevealed = [false];
      component.toggleKeepRevealed(0);
      expect(component.keepRevealed[0]).toBe(true);
      expect(component.abilities[0].revealed).toBe(true);
      expect(monster.revealedAbilities).toEqual([true]);
    });

    it('onRevealedChange un-reveals via toggleKeepRevealed when hiding a kept-revealed card', () => {
      const deckAbilities = [new Ability(1, 'a')];
      const monster = buildMonster(deckAbilities);
      monster.abilities = [0];
      const component = createComponent(monster);
      component.update();
      component.keepRevealed = [true];
      component.onRevealedChange(0, false);
      expect(component.keepRevealed[0]).toBe(false);
    });
  });
});
