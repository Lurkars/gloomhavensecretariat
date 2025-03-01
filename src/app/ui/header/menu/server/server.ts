import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { Identifier } from "src/app/game/model/data/Identifier";
import { Monster } from "src/app/game/model/Monster";
import { Permissions } from "src/app/game/model/Permissions";
import { ServerInfo } from "src/app/game/model/ServerInfo";
import { v4 as uuidv4 } from 'uuid';


@Component({
  standalone: false,
  selector: 'ghs-server-menu',
  templateUrl: 'server.html',
  styleUrls: ['../menu.scss', 'server.scss']
})
export class ServerMenuComponent implements OnInit, OnDestroy {

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  tryConnect: boolean = false;

  WebSocket = WebSocket;

  permissions: Permissions | undefined = new Permissions();
  publicServer: ServerInfo[] = [];
  selectedServerIndex: number = -1;

  code: string = '';

  createPermissions: boolean = false;

  serverUpdateVersion: { latest: boolean, version: string, url: string } | undefined;

  async ngOnInit() {

    try {
      await fetch('./assets/server.json')
        .then(response => {
          if (!response.ok) {
            throw Error();
          }
          return response.json();
        }).then((value: ServerInfo[]) => {
          this.publicServer = value;
        });
    } catch (error) {
      this.publicServer = [];
    }

    this.updateServer();
    this.checkServerVersion();

    this.uiChangeSubscription = gameManager.uiChange.subscribe({ next: () => { this.checkServerVersion() } });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  connect(url: string, port: string, code: string): void {
    if (url && !isNaN(+port) && code) {
      settingsManager.setServer(url, +port, code);
      gameManager.stateManager.connect();
      this.tryConnect = true;
    }
  }

  getPermissions() {
    if (gameManager.stateManager.permissions) {
      this.permissions = gameManager.stateManager.permissions;
    }
    return this.permissions;
  }

  createUUID() {
    settingsManager.settings.serverCode = uuidv4();
  }

  disconnect() {
    gameManager.stateManager.disconnect();
    this.permissions = gameManager.stateManager.permissions;
  }

  reconnect() {
    this.disconnect();
    gameManager.stateManager.connect();
    this.tryConnect = true;
  }

  selectServer(event: any) {
    this.selectedServerIndex = -1;
    if (!isNaN(+event.target.value)) {
      gameManager.stateManager.serverVersion = "";
      this.selectedServerIndex = +event.target.value;
      if (this.selectedServerIndex > -1 && this.selectedServerIndex < this.publicServer.length) {
        const server = this.publicServer[this.selectedServerIndex];
        settingsManager.settings.serverUrl = server.url;
        settingsManager.settings.serverPort = server.port;
        settingsManager.settings.serverWss = server.secure;
      }
    }
  }

  updateServer() {
    this.selectedServerIndex = -1;
    this.publicServer.forEach((server, index) => {
      if (settingsManager.settings.serverUrl == server.url && settingsManager.settings.serverPort == server.port && settingsManager.settings.serverWss == server.secure) {
        this.selectedServerIndex = index;
        return;
      }
    })
  }

  async checkServerVersion() {
    this.serverUpdateVersion = undefined
    if (gameManager.stateManager.serverVersion) {
      await fetch('https://api.github.com/repos/lurkars/ghs-server/releases/latest')
        .then(response => {
          if (!response.ok) {
            throw Error();
          }
          return response.json();
        }).then((value: any) => {
          this.serverUpdateVersion = { latest: value.tag_name == gameManager.stateManager.serverVersion || value.tag_name == 'v' + gameManager.stateManager.serverVersion, version: value.tag_name, url: value.html_url };
        });
    }
  }

  setServerUrl(event: any) {
    this.tryConnect = false;
    settingsManager.settings.serverUrl = event.target.value;
    settingsManager.storeSettings();
    this.updateServer();
  }

  setServerPort(event: any) {
    this.tryConnect = false;
    settingsManager.settings.serverPort = event.target.value;
    settingsManager.storeSettings();
    this.updateServer();
  }

  setServerCode(event: any) {
    this.tryConnect = false;
    settingsManager.settings.serverCode = event.target.value;
    settingsManager.storeSettings();
    this.updateServer();
  }

  permissionsAll(event: any) {
    if (event.target.checked) {
      this.permissions = undefined;
    } else {
      this.permissions = new Permissions();
    }
  }

  permissionsCustom(event: any) {
    if (event.target.checked) {
      this.permissions = new Permissions();
    } else {
      this.permissions = undefined;
    }
  }

  characters(): Character[] {
    return gameManager.game.figures.filter((figure) => figure instanceof Character).map((figure) => figure as Character);
  }

  hasCharacter(character: Character): boolean {
    return this.permissions != undefined && this.permissions.character.some((value) => value.name == character.name && value.edition == character.edition);
  }

  toggleCharacter(character: Character) {
    if (this.permissions) {
      const value: Identifier | undefined = this.permissions.character.find((value) => value.name == character.name && value.edition == character.edition);
      if (value) {
        this.permissions.character.splice(this.permissions.character.indexOf(value, 1));
      } else {
        this.permissions.character.push(new Identifier(character.name, character.edition));
      }
    }
  }

  monsters(): Monster[] {
    return gameManager.game.figures.filter((figure) => figure instanceof Monster).map((figure) => figure as Monster);
  }

  hasMonster(monster: Monster): boolean {
    return this.permissions != undefined && this.permissions.monster.some((value) => value.name == monster.name && value.edition == monster.edition);
  }

  toggleMonster(monster: Monster) {
    if (this.permissions) {
      const value: Identifier | undefined = this.permissions.monster.find((value) => value.name == monster.name && value.edition == monster.edition);
      if (value) {
        this.permissions.monster.splice(this.permissions.monster.indexOf(value, 1));
      } else {
        this.permissions.monster.push(new Identifier(monster.name, monster.edition));
      }
    }
  }

  setPermissionsCode(event: any) {
    this.code = event.target.value;
  }

  savePermissions() {
    gameManager.stateManager.savePermissions(this.code, this.permissions);
    this.code = '';
    this.permissions = new Permissions();
  }
}