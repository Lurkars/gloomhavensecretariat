import { TestBed } from '@angular/core/testing';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStat } from 'src/app/game/model/data/MonsterStat';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { Permissions } from 'src/app/game/model/Permissions';
import { ServerInfo } from 'src/app/game/model/ServerInfo';
import { ServerMenuComponent } from 'src/app/ui/header/menu/server/server';

// ServerMenuComponent's ngOnInit()/checkServerVersion() do real network fetches (server.json,
// GitHub releases) and connect()/reconnect() open a real WebSocket when server settings are
// populated — all out of scope here (never called). Following the AppComponent.spec.ts pattern:
// create via TestBed, never call fixture.detectChanges()/ngOnInit(). This spec covers the pure
// settings-mutating methods (createUUID/setServerUrl/setServerPort/setServerCode/selectServer/
// updateServer), the permissions toggles, and characters()/monsters() figure listing —
// savePermissions() is exercised only in its safe no-op form (no open WebSocket).

function buildCharacter(name: string): Character {
  const data = Object.assign(new CharacterData(), { name, edition: 'gh', stats: [new CharacterStat(1, 10)] });
  return new Character(data, 1);
}

function buildMonster(name: string): Monster {
  const stat = new MonsterStat(MonsterType.normal, 1, 10, 2, 3, 0);
  return new Monster(Object.assign(new MonsterData(), { name, edition: 'gh', stats: [stat] }), 1);
}

function createComponent(): ServerMenuComponent {
  const fixture = TestBed.createComponent(ServerMenuComponent);
  return fixture.componentInstance;
}

describe('ServerMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ServerMenuComponent] }).compileComponents();

    gameManager.game.figures = [];
    settingsManager.settings.serverUrl = '';
    settingsManager.settings.serverPort = 0;
    settingsManager.settings.serverCode = '';
    settingsManager.settings.serverWss = false;
  });

  describe('createUUID', () => {
    it('generates a non-empty server code', () => {
      const component = createComponent();
      component.createUUID();
      expect(settingsManager.settings.serverCode).toBeTruthy();
    });
  });

  describe('setServerUrl / setServerPort / setServerCode', () => {
    it('updates the corresponding setting and resets tryConnect', () => {
      const component = createComponent();
      component.tryConnect = true;
      component.setServerUrl({ target: { value: 'example.com' } });
      expect(settingsManager.settings.serverUrl).toEqual('example.com');
      expect(component.tryConnect).toBe(false);

      component.tryConnect = true;
      component.setServerPort({ target: { value: '1234' } });
      expect(settingsManager.settings.serverPort).toEqual('1234');
      expect(component.tryConnect).toBe(false);

      component.tryConnect = true;
      component.setServerCode({ target: { value: 'abc' } });
      expect(settingsManager.settings.serverCode).toEqual('abc');
      expect(component.tryConnect).toBe(false);
    });
  });

  describe('selectServer / updateServer', () => {
    it('selectServer applies the chosen public server settings', () => {
      const component = createComponent();
      component.publicServer = [new ServerInfo('example.com', 80, true)];
      component.selectServer({ target: { value: '0' } });
      expect(component.selectedServerIndex).toEqual(0);
      expect(settingsManager.settings.serverUrl).toEqual('example.com');
      expect(settingsManager.settings.serverPort).toEqual(80);
      expect(settingsManager.settings.serverWss).toBe(true);
    });

    it('updateServer detects a matching public server from current settings', () => {
      const component = createComponent();
      component.publicServer = [new ServerInfo('a.com', 80, false), new ServerInfo('b.com', 443, true)];
      settingsManager.settings.serverUrl = 'b.com';
      settingsManager.settings.serverPort = 443;
      settingsManager.settings.serverWss = true;
      component.updateServer();
      expect(component.selectedServerIndex).toEqual(1);
    });

    it('updateServer resets to -1 when no public server matches', () => {
      const component = createComponent();
      component.publicServer = [new ServerInfo('a.com', 80, false)];
      settingsManager.settings.serverUrl = 'other.com';
      component.updateServer();
      expect(component.selectedServerIndex).toEqual(-1);
    });
  });

  describe('permissionsAll / permissionsCustom', () => {
    it('permissionsAll clears permissions (full access) when checked', () => {
      const component = createComponent();
      component.permissions = new Permissions();
      component.permissionsAll({ target: { checked: true } });
      expect(component.permissions).toBeUndefined();
    });

    it('permissionsAll restores default permissions when unchecked', () => {
      const component = createComponent();
      component.permissions = undefined;
      component.permissionsAll({ target: { checked: false } });
      expect(component.permissions).toBeInstanceOf(Permissions);
    });

    it('permissionsCustom sets a fresh Permissions object when checked', () => {
      const component = createComponent();
      component.permissions = undefined;
      component.permissionsCustom({ target: { checked: true } });
      expect(component.permissions).toBeInstanceOf(Permissions);
    });
  });

  describe('characters / monsters', () => {
    it('lists only Character figures', () => {
      const character = buildCharacter('brute');
      const monster = buildMonster('bandit-guard');
      gameManager.game.figures = [character, monster];
      const component = createComponent();
      expect(component.characters()).toEqual([character]);
    });

    it('lists only Monster figures', () => {
      const character = buildCharacter('brute');
      const monster = buildMonster('bandit-guard');
      gameManager.game.figures = [character, monster];
      const component = createComponent();
      expect(component.monsters()).toEqual([monster]);
    });
  });

  describe('hasCharacter / toggleCharacter', () => {
    it('toggles a character into and back out of permissions', () => {
      const character = buildCharacter('brute');
      const component = createComponent();
      component.permissions = new Permissions();
      expect(component.hasCharacter(character)).toBe(false);
      component.toggleCharacter(character);
      expect(component.hasCharacter(character)).toBe(true);
    });

    it('is a no-op without a permissions object (full access mode)', () => {
      const character = buildCharacter('brute');
      const component = createComponent();
      component.permissions = undefined;
      expect(() => component.toggleCharacter(character)).not.toThrow();
      expect(component.hasCharacter(character)).toBe(false);
    });
  });

  describe('hasMonster / toggleMonster', () => {
    it('toggles a monster into permissions', () => {
      const monster = buildMonster('bandit-guard');
      const component = createComponent();
      component.permissions = new Permissions();
      expect(component.hasMonster(monster)).toBe(false);
      component.toggleMonster(monster);
      expect(component.hasMonster(monster)).toBe(true);
    });
  });

  describe('setPermissionsCode / savePermissions', () => {
    it('setPermissionsCode records the entered code', () => {
      const component = createComponent();
      component.setPermissionsCode({ target: { value: 'xyz' } });
      expect(component.code).toEqual('xyz');
    });

    it('savePermissions resets code/permissions without an open connection', () => {
      const component = createComponent();
      component.code = 'xyz';
      component.permissions = new Permissions();
      component.permissions.character.push({ name: 'brute', edition: 'gh' } as any);
      component.savePermissions();
      expect(component.code).toEqual('');
      expect(component.permissions).toEqual(new Permissions());
    });
  });
});
