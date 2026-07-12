import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterNumberPickerDialog } from 'src/app/ui/figures/monster/dialogs/numberpicker-dialog';

// MonsterNumberPickerDialog's constructor resolves the target entity/type from DIALOG_DATA and
// calls update() once (safe — it only reads `entities`/`type`, no DOM/dialog side effects).
// Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges() (ngOnInit never runs; we set `range` manually where needed), and call
// methods directly. This spec covers hasNumber/hasEntity, the "change" mode of pickNumber (a simple
// number swap, no dialog-closing), and toggleMonsterType; the "add standee" branch of pickNumber
// (which can trigger ghsDialogClosingHelper) and the keyboard shortcut handler are out of scope.

function buildMonster(entityCount: number = 1): Monster {
  const normalStat = new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0);
  const eliteStat = new MonsterStat(MonsterType.elite, 1, 12, 2, 5, 0);
  const monster = new Monster(
    Object.assign(new MonsterData(), { name: 'bandit-guard', edition: 'gh', stats: [normalStat, eliteStat], count: 6 }),
    1
  );
  monster.entities = Array.from({ length: entityCount }, (_, i) => new MonsterEntity(i + 1, MonsterType.normal, monster));
  return monster;
}

function createComponent(data: Record<string, any>): MonsterNumberPickerDialog {
  TestBed.configureTestingModule({
    imports: [MonsterNumberPickerDialog],
    providers: [
      { provide: DIALOG_DATA, useValue: { range: [], entity: undefined, entities: undefined, automatic: false, change: false, ...data } },
      { provide: DialogRef, useValue: { close: () => {} } }
    ]
  });
  const fixture = TestBed.createComponent(MonsterNumberPickerDialog);
  return fixture.componentInstance;
}

describe('MonsterNumberPickerDialog', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    settingsManager.settings.animations = false;
    settingsManager.settings.hideStats = false;
  });

  describe('constructor', () => {
    it('resolves the entity/type from the entities list when no entity is given directly', () => {
      const monster = buildMonster(1);
      monster.entities[0].number = -1;
      monster.entities[0].type = MonsterType.elite;
      const component = createComponent({ monster, type: MonsterType.normal, entities: monster.entities });
      expect(component.entity).toBe(monster.entities[0]);
      expect(component.type).toEqual(MonsterType.elite);
    });

    it('computes max from the monster standee count', () => {
      const monster = buildMonster(1);
      const component = createComponent({ monster, type: MonsterType.normal });
      expect(component.max).toBeGreaterThan(0);
    });
  });

  describe('hasNumber / hasEntity', () => {
    it('hasNumber reflects whether the standee number is already in use', () => {
      const monster = buildMonster(1);
      monster.entities[0].number = 3;
      const component = createComponent({ monster, type: MonsterType.normal });
      expect(component.hasNumber(3)).toBe(true);
      expect(component.hasNumber(4)).toBe(false);
    });

    it('hasEntity reflects whether a living entity of the current type exists', () => {
      const monster = buildMonster(1);
      const component = createComponent({ monster, type: MonsterType.normal });
      expect(component.hasEntity()).toBe(true);
    });
  });

  describe('pickNumber (change mode)', () => {
    it('reassigns the entity number', () => {
      const monster = buildMonster(1);
      monster.entities[0].number = 2;
      const component = createComponent({ monster, type: MonsterType.normal, entity: monster.entities[0], change: true });
      component.pickNumber(5);
      expect(monster.entities[0].number).toEqual(5);
    });

    it('swaps with the entity already at the target number', () => {
      const monster = buildMonster(2);
      monster.entities[0].number = 1;
      monster.entities[1].number = 2;
      const component = createComponent({ monster, type: MonsterType.normal, entity: monster.entities[0], change: true });
      component.pickNumber(2);
      expect(monster.entities[0].number).toEqual(2);
      expect(monster.entities[1].number).toBeLessThan(0);
    });

    it('is a no-op for an out-of-range number', () => {
      const monster = buildMonster(1);
      monster.entities[0].number = 1;
      const component = createComponent({ monster, type: MonsterType.normal, entity: monster.entities[0], change: true });
      component.pickNumber(999);
      expect(monster.entities[0].number).toEqual(1);
    });
  });

  describe('toggleMonsterType', () => {
    it('flips a normal entity to elite', () => {
      const monster = buildMonster(1);
      monster.entities[0].type = MonsterType.normal;
      const component = createComponent({ monster, type: MonsterType.normal, entity: monster.entities[0] });
      component.toggleMonsterType();
      expect(monster.entities[0].type).toEqual(MonsterType.elite);
    });
  });
});
