import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionHint, ActionType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { Summon, SummonColor } from 'src/app/game/model/Summon';
import { StandeeComponent } from 'src/app/ui/figures/standee/standee';

// StandeeComponent renders one entity token (monster/summon/objective) — update() is its dense pure
// computation of border/state classes and drag-clamping/removal helpers are simple mutations.
// Following the AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges()
// (so the viewChild.required('standee') ref never needs to resolve — it's only read from
// openEntityMenu(), which we don't call), set the required figure/entity inputs via setInput(), and
// call methods directly.

function buildMonster(overrides: Partial<MonsterStat> = {}): { monster: Monster; entity: MonsterEntity } {
  const stat = Object.assign(new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0), overrides);
  const monster = new Monster(Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh', stats: [stat] }), 1);
  const entity = new MonsterEntity(1, MonsterType.normal, monster);
  monster.entities = [entity];
  return { monster, entity };
}

function buildCharacterWithSummon(): { character: Character; summon: Summon } {
  const data = Object.assign(new CharacterData(), { name: 'summoner', edition: 'gh', stats: [new CharacterStat(1, 10)] });
  const character = new Character(data, 1);
  const summon = new Summon('uuid-1', 'bear', 'card-1', 1, 1, SummonColor.blue);
  character.summons = [summon];
  return { character, summon };
}

function createComponent(figure: any, entity: any): StandeeComponent {
  const fixture = TestBed.createComponent(StandeeComponent);
  fixture.componentRef.setInput('figure', figure);
  fixture.componentRef.setInput('entity', entity);
  return fixture.componentInstance;
}

describe('StandeeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StandeeComponent] }).compileComponents();

    gameManager.game.figures = [];
    settingsManager.settings.standeeStats = false;
    settingsManager.settings.activeStandees = true;
    settingsManager.settings.activeSummons = true;
    settingsManager.settings.scenarioRooms = true;
    settingsManager.settings.animations = false;
    settingsManager.settings.damageHP = false;
  });

  it('renders the template without throwing', () => {
    const { monster, entity } = buildMonster();
    const fixture = TestBed.createComponent(StandeeComponent);
    fixture.componentRef.setInput('figure', monster);
    fixture.componentRef.setInput('entity', entity);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('update', () => {
    it('syncs health/maxHp/dead from the entity', () => {
      const { monster, entity } = buildMonster();
      entity.health = 4;
      const component = createComponent(monster, entity);
      component.update();
      expect(component.entityHealth).toEqual(4);
      expect(component.maxHp).toEqual(entity.maxHealth);
      expect(component.dead).toBe(false);
    });

    it('adds immunities not already present as active conditions', () => {
      const { monster, entity } = buildMonster();
      entity.immunities = [ConditionName.poison];
      const component = createComponent(monster, entity);
      component.update();
      expect(component.activeConditions.some((c) => c.name === ConditionName.poison)).toBe(true);
    });

    it('marks the border as dead/off for a dead entity', () => {
      const { monster, entity } = buildMonster();
      entity.dead = true;
      entity.off = true;
      const component = createComponent(monster, entity);
      component.update();
      expect(component.entityBorderClasses['dead']).toBe(true);
    });
  });

  describe('dragHpMove / dragHpEnd / dragHpCancel', () => {
    it('caps healing at maxHealth', () => {
      const { monster, entity } = buildMonster();
      entity.health = entity.maxHealth - 1;
      const component = createComponent(monster, entity);
      component.dragHpMove(5);
      expect(component.health).toEqual(1);
    });

    it('is a no-op for an immortal monster', () => {
      const { monster, entity } = buildMonster();
      monster.immortal = true;
      const component = createComponent(monster, entity);
      component.dragHpMove(-3);
      expect(component.health).toEqual(0);
    });

    it('dragHpEnd applies the pending delta via entityManager and resets it', () => {
      const { monster, entity } = buildMonster();
      entity.health = 5;
      const component = createComponent(monster, entity);
      component.dragHpMove(-2);
      component.dragHpEnd();
      expect(entity.health).toEqual(3);
      expect(component.health).toEqual(0);
    });

    it('dragHpCancel resets the pending delta without applying it', () => {
      const { monster, entity } = buildMonster();
      entity.health = 5;
      const component = createComponent(monster, entity);
      component.dragHpMove(-2);
      component.dragHpCancel();
      expect(component.health).toEqual(0);
      expect(entity.health).toEqual(5);
    });
  });

  describe('normalizedRetaliateRange', () => {
    it('defaults to 1 with no range sub-action', () => {
      const { monster, entity } = buildMonster();
      const component = createComponent(monster, entity);
      const action = new Action(ActionType.retaliate, 1);
      expect(component.normalizedRetaliateRange(action)).toEqual(1);
    });

    it('reads the range sub-action value when >1', () => {
      const { monster, entity } = buildMonster();
      const component = createComponent(monster, entity);
      const action = new Action(ActionType.retaliate, 1, undefined, [new Action(ActionType.range, 3)]);
      expect(component.normalizedRetaliateRange(action)).toEqual(3);
    });
  });

  describe('actionHintLabel', () => {
    it('builds a placeholder label without range for range<=1', () => {
      const { monster, entity } = buildMonster();
      const component = createComponent(monster, entity);
      const hint = new ActionHint(ActionType.shield, 2, 1);
      expect(component.actionHintLabel(hint)).toEqual('%game.action.shield% 2');
    });

    it('appends the range label once range>1', () => {
      const { monster, entity } = buildMonster();
      const component = createComponent(monster, entity);
      const hint = new ActionHint(ActionType.retaliate, 2, 3);
      expect(component.actionHintLabel(hint)).toEqual('%game.action.retaliate% 2 %game.action.range% 3');
    });
  });

  describe('removeExtraAction', () => {
    it('removes from the non-persistent list by default', () => {
      const { monster, entity } = buildMonster();
      const action = new Action(ActionType.heal, 1);
      entity.extraActions = [action];
      const component = createComponent(monster, entity);
      component.removeExtraAction(action);
      expect(entity.extraActions).toEqual([]);
    });

    it('removes from the persistent list when requested', () => {
      const { monster, entity } = buildMonster();
      const action = new Action(ActionType.heal, 1);
      entity.extraActionsPersistent = [action];
      const component = createComponent(monster, entity);
      component.removeExtraAction(action, true);
      expect(entity.extraActionsPersistent).toEqual([]);
    });
  });

  describe('removeCondition', () => {
    it('decrements value for a stackable condition instead of removing it', () => {
      const { monster, entity } = buildMonster();
      const condition = new EntityCondition(ConditionName.bless, 3);
      const component = createComponent(monster, entity);
      component.removeCondition(condition);
      expect(condition.value).toEqual(2);
    });

    it('removes a non-stackable condition from the entity', () => {
      const { monster, entity } = buildMonster();
      const condition = new EntityCondition(ConditionName.poison);
      entity.entityConditions = [condition];
      const component = createComponent(monster, entity);
      component.removeCondition(condition);
      expect(entity.entityConditions).toEqual([]);
    });
  });

  describe('removeMarker', () => {
    it('clears the marker for a monster entity', () => {
      const { monster, entity } = buildMonster();
      entity.marker = 'gh-fire';
      const component = createComponent(monster, entity);
      component.removeMarker();
      expect(entity.marker).toEqual('');
    });
  });

  describe('removeCharacterMarker', () => {
    it('removes the marker from the entity marker list', () => {
      const { monster, entity } = buildMonster();
      entity.markers = ['gh-fire', 'gh-ice'];
      const component = createComponent(monster, entity);
      component.removeCharacterMarker('gh-fire');
      expect(entity.markers).toEqual(['gh-ice']);
    });
  });

  describe('doubleClick', () => {
    it('un-reveals a revealed entity', () => {
      const { monster, entity } = buildMonster();
      entity.revealed = true;
      const component = createComponent(monster, entity);
      component.doubleClick();
      expect(entity.revealed).toBe(false);
    });

    it('toggles active for an unrevealed monster entity when activeStandees is on', () => {
      const { monster, entity } = buildMonster();
      entity.revealed = false;
      entity.active = false;
      gameManager.game.state = GameState.next;
      gameManager.game.figures = [monster];
      const component = createComponent(monster, entity);
      component.doubleClick();
      expect(entity.active).toBe(true);
    });
  });

  describe('toggleActive (summon)', () => {
    it('activates the summon and deactivates any other active summon', () => {
      const { character, summon } = buildCharacterWithSummon();
      const otherSummon = new Summon('uuid-2', 'other', 'card-2', 1, 2, SummonColor.blue);
      otherSummon.active = true;
      character.summons.push(otherSummon);
      gameManager.game.figures = [character];
      const component = createComponent(character, summon);
      component.toggleActive();
      expect(summon.active).toBe(true);
      expect(otherSummon.active).toBe(false);
    });

    it('deactivates an already-active summon directly when the figure itself is not active', () => {
      const { character, summon } = buildCharacterWithSummon();
      summon.active = true;
      character.active = false;
      gameManager.game.figures = [character];
      const component = createComponent(character, summon);
      component.toggleActive();
      expect(summon.active).toBe(false);
    });
  });
});
