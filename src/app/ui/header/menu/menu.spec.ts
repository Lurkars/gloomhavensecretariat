import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { EditionData } from 'src/app/game/model/data/EditionData';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
import { MainMenuComponent } from 'src/app/ui/header/menu/menu';
import { SubMenu } from 'src/app/ui/header/menu/sub-menu';

// MainMenuComponent's constructor directly touches `dialogRef.overlayRef.hostElement.style`, so the
// DialogRef stub must provide a real-enough overlayRef shape; it also injects SwUpdate, which isn't
// provided without ServiceWorkerModule, so a stub is supplied here too. Following the
// AppComponent.spec.ts pattern: create via TestBed, never call fixture.detectChanges() (ngOnInit
// never runs — we call update() directly where needed). This spec covers setActive, hasSections,
// the characters()/objectives()/monsters() sort-and-filter listings, the remove*/removeAll* figure
// mutation methods, hasUnusedMonster, close(), and update()'s empty/non-serverSync undo formatting.
// menu.ts's SubMenu enum now lives in its own sub-menu.ts file (see PR that fixed the menu.ts <->
// settings.ts circular import), which is what makes TestBed construction of this component safe
// under the full suite's module load order.

function buildCharacter(name: string): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function buildMonster(name: string): Monster {
  const stat = new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0);
  const monster = new Monster(Object.assign(new MonsterData(), { name, edition: 'gh', stats: [stat] }), 1);
  monster.entities = [];
  return monster;
}

function createComponent(): MainMenuComponent {
  TestBed.configureTestingModule({
    imports: [MainMenuComponent],
    providers: [
      { provide: DIALOG_DATA, useValue: { subMenu: SubMenu.main, standalone: false } },
      {
        provide: DialogRef,
        useValue: {
          close: () => {},
          overlayRef: { hostElement: { style: {} }, backdropElement: undefined }
        }
      },
      { provide: Dialog, useValue: {} },
      { provide: SwUpdate, useValue: { isEnabled: false, activateUpdate: () => Promise.resolve() } }
    ]
  });
  const fixture = TestBed.createComponent(MainMenuComponent);
  return fixture.componentInstance;
}

describe('MainMenuComponent', () => {
  beforeEach(() => {
    gameManager.game.figures = [];
    gameManager.game.edition = 'gh';
    gameManager.editionData = [];
    settingsManager.settings.editions = ['gh'];
    gameManager.stateManager.undos = [];
    gameManager.stateManager.redos = [];
    gameManager.stateManager.undoInfos = [];
  });

  it('constructs and applies the requested subMenu/standalone from DIALOG_DATA', () => {
    const component = createComponent();
    expect(component.active).toEqual(SubMenu.main);
    expect(component.standalone).toBe(false);
  });

  it('renders the template without throwing', () => {
    TestBed.configureTestingModule({
      imports: [MainMenuComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: { subMenu: SubMenu.main, standalone: false } },
        {
          provide: DialogRef,
          useValue: {
            close: () => {},
            overlayRef: { hostElement: { style: {} }, backdropElement: undefined }
          }
        },
        { provide: Dialog, useValue: {} },
        { provide: SwUpdate, useValue: { isEnabled: false, activateUpdate: () => Promise.resolve() } }
      ]
    });
    const fixture = TestBed.createComponent(MainMenuComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  describe('setActive', () => {
    it('switches the active submenu', () => {
      const component = createComponent();
      component.setActive(SubMenu.settings);
      expect(component.active).toEqual(SubMenu.settings);
    });
  });

  describe('hasSections', () => {
    it('is true when the current edition declares sections', () => {
      gameManager.editionData = [Object.assign(new EditionData('gh', [], [], [], [], [Object.assign({}, { index: 's1' }) as any], []))];
      const component = createComponent();
      expect(component.hasSections()).toBe(true);
    });

    it('is false without any sections', () => {
      const component = createComponent();
      expect(component.hasSections()).toBe(false);
    });
  });

  describe('characters / objectives / monsters', () => {
    it('lists and sorts characters by display name', () => {
      const b = buildCharacter('scoundrel');
      const a = buildCharacter('brute');
      gameManager.game.figures = [b, a];
      const component = createComponent();
      expect(component.characters()).toEqual([a, b]);
    });

    it('lists and sorts monsters by label', () => {
      const b = buildMonster('scoundrel');
      const a = buildMonster('brute');
      gameManager.game.figures = [b, a];
      const component = createComponent();
      expect(component.monsters()).toEqual([a, b]);
    });

    it('lists objectives', () => {
      const objective = new ObjectiveContainer('uuid-1');
      gameManager.game.figures = [objective];
      const component = createComponent();
      expect(component.objectives()).toEqual([objective]);
    });
  });

  describe('remove* / removeAll*', () => {
    it('removeCharacter removes the character and closes when none remain', () => {
      const character = buildCharacter('brute');
      gameManager.game.figures = [character];
      const component = createComponent();
      component.removeCharacter(character);
      expect(gameManager.game.figures).not.toContain(character);
    });

    it('removeAllCharacters clears every character but leaves other figures', () => {
      const character = buildCharacter('brute');
      const objective = new ObjectiveContainer('uuid-1');
      gameManager.game.figures = [character, objective];
      const component = createComponent();
      component.removeAllCharacters();
      expect(gameManager.game.figures).toEqual([objective]);
    });

    it('addObjectiveContainer adds a new objective figure', () => {
      const component = createComponent();
      component.addObjectiveContainer();
      expect(component.objectives().length).toEqual(1);
    });

    it('removeObjective removes the given objective', () => {
      const objective = new ObjectiveContainer('uuid-1');
      gameManager.game.figures = [objective];
      const component = createComponent();
      component.removeObjective(objective);
      expect(gameManager.game.figures).not.toContain(objective);
    });

    it('removeAllObjectives clears every objective but leaves other figures', () => {
      const character = buildCharacter('brute');
      const objective = new ObjectiveContainer('uuid-1');
      gameManager.game.figures = [character, objective];
      const component = createComponent();
      component.removeAllObjectives();
      expect(gameManager.game.figures).toEqual([character]);
    });

    it('removeMonster removes the given monster', () => {
      const monster = buildMonster('brute');
      gameManager.game.figures = [monster];
      const component = createComponent();
      component.removeMonster(monster);
      expect(gameManager.game.figures).not.toContain(monster);
    });

    it('removeAllMonsters clears every monster but leaves other figures', () => {
      const character = buildCharacter('brute');
      const monster = buildMonster('bandit-guard');
      gameManager.game.figures = [character, monster];
      const component = createComponent();
      component.removeAllMonsters();
      expect(gameManager.game.figures).toEqual([character]);
    });
  });

  describe('hasUnusedMonster', () => {
    it('is false with no monsters present', () => {
      const component = createComponent();
      expect(component.hasUnusedMonster()).toBe(false);
    });
  });

  describe('close', () => {
    it('does not throw with animations disabled', () => {
      settingsManager.settings.animations = false;
      const component = createComponent();
      expect(() => component.close()).not.toThrow();
    });
  });

  describe('update', () => {
    it('is empty with no undo history', () => {
      const component = createComponent();
      component.update();
      expect(component.undoInfo).toEqual([]);
      expect(component.redoInfo).toEqual([]);
    });

    it('resolves the latest non-serverSync undo entry', () => {
      gameManager.stateManager.undos = [{ revision: 1, revisionOffset: 0 } as any];
      gameManager.stateManager.undoInfos = [['setInitiative', 'brute', '5']];
      gameManager.game.revision = 1;
      const component = createComponent();
      component.update();
      expect(component.undoInfo).toEqual(['setInitiative', 'brute', '5']);
    });
  });
});
