import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { ActionType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

// EntitiesMenuDialogComponent's constructor instantiates 12 helper classes and then calls update(),
// which fans out to each helper's own update(). Every helper's update()/close() guards its body on
// component state (figure/entity/entities) that defaults to undefined/[]/0, so both a DIALOG_DATA={}
// ("no figure") construction and a single Monster+MonsterEntity construction are safe to exercise
// without dialogs ever opening — confirmed by tracing every helper file in
// src/app/ui/figures/entities-menu/helpers/*.ts before writing this spec. Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges(). This spec
// covers construction safety for both cases, the component's own near-pure methods
// (toggleEntity/toggleAll/figureForEntity/before), and update()/close() not throwing; the individual
// helpers' business logic (attack modifiers, campaign rewards, conditions, etc.) is out of scope —
// each is a substantial file in its own right.

function buildMonster(): { monster: Monster; entity: MonsterEntity } {
  const stat = new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0);
  const monster = new Monster(Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh', stats: [stat] }), 1);
  const entity = new MonsterEntity(1, MonsterType.normal, monster);
  monster.entities = [entity];
  return { monster, entity };
}

function buildCharacter(): Character {
  const data = Object.assign(new CharacterData(), { name: 'brute', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function createComponent(data: Record<string, any> = {}): EntitiesMenuDialogComponent {
  TestBed.configureTestingModule({
    imports: [EntitiesMenuDialogComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: data },
      { provide: DialogRef, useValue: { closed: { subscribe: () => {} }, close: () => {} } },
      { provide: Dialog, useValue: {} }
    ]
  });
  const fixture = TestBed.createComponent(EntitiesMenuDialogComponent);
  return fixture.componentInstance;
}

describe('EntitiesMenuDialogComponent', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
  });

  it('renders the template without throwing (no figure/entity)', () => {
    TestBed.configureTestingModule({
      imports: [EntitiesMenuDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: {} },
        { provide: DialogRef, useValue: { closed: { subscribe: () => {} }, close: () => {} } },
        { provide: Dialog, useValue: {} }
      ]
    });
    const fixture = TestBed.createComponent(EntitiesMenuDialogComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('construction', () => {
    it('constructs without a figure/entity by deriving figures from gameManager.game.figures', () => {
      const character = buildCharacter();
      gameManager.game.figures = [character];
      const component = createComponent({});
      expect(component).toBeTruthy();
      expect(component.figure).toBeUndefined();
      expect(component.entity).toBeUndefined();
      expect(component.figures).toContain(character);
    });

    it('constructs with a single monster figure + entity', () => {
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];
      const component = createComponent({ figure: monster, entity });
      expect(component.figure).toBe(monster);
      expect(component.entity).toBe(entity);
      expect(component.allEntities).toEqual([entity]);
    });

    it('is safe to call close() with no figure/entity (all helper close() calls are guarded no-ops)', () => {
      const component = createComponent({});
      expect(() => component.close()).not.toThrow();
    });

    it('is safe to call update() again after constructing with a monster+entity', () => {
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];
      const component = createComponent({ figure: monster, entity });
      expect(() => component.update()).not.toThrow();
    });
  });

  describe('toggleEntity', () => {
    it('adds an entity not yet selected', () => {
      const { entity } = buildMonster();
      const component = createComponent({});
      component.toggleEntity(entity);
      expect(component.entities).toEqual([entity]);
    });

    it('removes an entity already selected', () => {
      const { entity } = buildMonster();
      const component = createComponent({});
      component.entities = [entity];
      component.toggleEntity(entity);
      expect(component.entities).toEqual([]);
    });
  });

  describe('toggleAll', () => {
    it('selects every entity in allEntities', () => {
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];
      const component = createComponent({ figure: monster, entity });
      component.allEntities = [entity];
      component.toggleAll(true);
      expect(component.entities).toEqual([entity]);
    });

    it('clears the selection', () => {
      const { entity } = buildMonster();
      const component = createComponent({});
      component.entities = [entity];
      component.toggleAll(false);
      expect(component.entities).toEqual([]);
    });
  });

  describe('figureForEntity', () => {
    it('returns the fixed figure when one is set', () => {
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];
      const component = createComponent({ figure: monster, entity });
      expect(component.figureForEntity(entity)).toBe(monster);
    });

    it('resolves the owning monster from this.figures for a MonsterEntity', () => {
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];
      const component = createComponent({});
      expect(component.figureForEntity(entity)).toBe(monster);
    });

    it('returns a fallback Monster when no owning figure is found', () => {
      const { entity } = buildMonster();
      const component = createComponent({});
      const result = component.figureForEntity(entity);
      expect(result).toBeInstanceOf(Monster);
    });

    it('resolves a Character directly for a Character entity', () => {
      const character = buildCharacter();
      const component = createComponent({});
      expect(component.figureForEntity(character)).toBe(character);
    });
  });

  describe('taunt', () => {
    let standeeShieldRetaliate: boolean;

    beforeEach(() => {
      standeeShieldRetaliate = settingsManager.settings.standeeShieldRetaliate;
      settingsManager.settings.standeeShieldRetaliate = true;
    });

    afterEach(() => {
      settingsManager.settings.standeeShieldRetaliate = standeeShieldRetaliate;
      vi.restoreAllMocks();
    });

    function hasTaunt(entity: MonsterEntity, persistent: boolean = false): boolean {
      return (persistent ? entity.extraActionsPersistent : entity.extraActions).some((action) => action.type === ActionType.taunt);
    }

    it('is not offered without rpg rules', () => {
      vi.spyOn(gameManager, 'rpgRules').mockReturnValue(false);
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];
      expect(createComponent({ figure: monster, entity }).taunt).toBe(false);
    });

    it('adds and removes round taunt without touching persistent taunt', () => {
      vi.spyOn(gameManager, 'rpgRules').mockReturnValue(true);
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];

      let component = createComponent({ figure: monster, entity });
      expect(component.taunt).toBe(true);
      expect(component.entityTaunt).toBe(false);
      component.shieldRetaliateHelper.toggleTaunt(false);
      component.close();
      expect(hasTaunt(entity)).toBe(true);
      expect(hasTaunt(entity, true)).toBe(false);

      TestBed.resetTestingModule();
      component = createComponent({ figure: monster, entity });
      expect(component.entityTaunt).toBe(true);
      component.shieldRetaliateHelper.toggleTaunt(false);
      component.close();
      expect(hasTaunt(entity)).toBe(false);
    });

    it('adds persistent taunt', () => {
      vi.spyOn(gameManager, 'rpgRules').mockReturnValue(true);
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];

      const component = createComponent({ figure: monster, entity });
      component.shieldRetaliateHelper.toggleTaunt(true);
      component.close();
      expect(hasTaunt(entity, true)).toBe(true);
      expect(hasTaunt(entity)).toBe(false);
    });

    it('leaves taunt unchanged when not toggled', () => {
      vi.spyOn(gameManager, 'rpgRules').mockReturnValue(true);
      const { monster, entity } = buildMonster();
      gameManager.game.figures = [monster];
      const undoInfos = gameManager.stateManager.undoInfos.length;

      createComponent({ figure: monster, entity }).close();
      expect(hasTaunt(entity)).toBe(false);
      expect(gameManager.stateManager.undoInfos.length).toBe(undoInfos);
    });
  });

  describe('before', () => {
    it('records an undo entry without throwing', () => {
      const component = createComponent({});
      const before = gameManager.stateManager.undoInfos.length;
      component.before('testAction');
      expect(gameManager.stateManager.undoInfos.length).toEqual(before + 1);
      gameManager.stateManager.after();
    });
  });
});
