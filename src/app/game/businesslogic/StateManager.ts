import { Character } from "../model/Character";
import { Game, GameModel } from "../model/Game";
import { Monster } from "../model/Monster";
import { Permissions } from "../model/Permissions";
import { Settings } from "../model/Settings";
import { gameManager } from "./GameManager";
import { settingsManager } from "./SettingsManager";
import { storageManager } from "./StorageManager";

export class StateManager {

  game: Game;
  permissions: Permissions | undefined;
  ws: WebSocket | undefined;

  undoCount: number = 0;
  redoCount: number = 0;
  lastSaveTimestamp: number;

  hasUpdate: boolean = false;
  installPrompt: any = null;

  lastAction: "update" | "undo" | "redo" = "update";
  updateBlocked: boolean = false;
  serverError: boolean = false;
  errorLog: any[] = [];
  permissionBackup: Permissions | undefined;
  connectionTries: number = 0;
  gameOffsetWarning: boolean = true;
  standeeDialogCanceled: boolean = false;

  undoPermission: boolean = false;
  redoPermission: boolean = false;
  characterPermissions: Record<string, boolean> = {};
  monsterPermissions: Record<string, boolean> = {};

  wakeLock: any = null;
  scenarioSummary: boolean = false;

  constructor(game: Game) {
    this.game = game;
    this.lastSaveTimestamp = new Date().getTime();
  }

  async init() {
    try {
      const gameModel = await storageManager.readGameModel();
      gameModel.server = false;
      this.game.fromModel(gameModel);
    } catch {
      storageManager.writeGameModel(this.game.toModel());
    }

    this.updateBlocked = false;

    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      if (settingsManager.settings.serverAutoconnect) {
        this.connect();
      } else {
        gameManager.stateManager.updateBlocked = true;
        gameManager.stateManager.permissions = new Permissions();
        this.updatePermissions();
      }
    }

    this.loadStorage();

    gameManager.uiChange.subscribe({
      next: () => {
        if (!settingsManager.settings.serverUrl || !settingsManager.settings.serverPort || !settingsManager.settings.serverPassword) {
          this.permissions = undefined;
          this.updateBlocked = false;
        }
        this.updatePermissions();
      }
    })

    gameManager.uiChange.emit();
  }

  async install() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      await gameManager.stateManager.installPrompt.userChoice;
      this.installPrompt = null;
    }
  }

  async loadStorage() {
    try {
      this.undoCount = await storageManager.count('undo');
      this.redoCount = await storageManager.count('redo');
      this.updatePermissions();
    } catch {
      this.updatePermissions();
    }
  }

  buildWsUrl(protocol: string, serverUrl: string, port: number | string) {
    let urls = serverUrl.split("/");
    const url = urls[0];
    let path: string = "";
    if (urls.length > 1) {
      path = "/" + (urls.splice(1, urls.length + 1).join("/"));
    }
    path = protocol + url + ":" + (port + "") + path;
    return path;
  }

  connect() {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      this.disconnect();
      this.connectionTries++;
      const protocol = settingsManager.settings.serverWss ? "wss://" : "ws://";
      this.ws = new WebSocket(this.buildWsUrl(protocol, settingsManager.settings.serverUrl, settingsManager.settings.serverPort));
      this.ws.onmessage = this.onMessage;
      this.ws.onopen = this.onOpen;
      this.ws.onclose = this.onClose;
      this.ws.onerror = this.onError
    }
  }

  disconnect() {
    this.permissions = undefined;
    this.updatePermissions();
    if (this.ws && this.ws.readyState != WebSocket.CLOSED) {
      this.ws.close();
    }
  }

  async onMessage(ev: any) {
    try {
      const message: any = JSON.parse(ev.data);
      gameManager.stateManager.updateBlocked = false;
      switch (message.type) {
        case "game":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameModel: GameModel = message.payload as GameModel;
          if (gameManager.game.revision > gameModel.revision) {
            await gameManager.stateManager.before();
            storageManager.addBackup(gameManager.game.toModel());
            console.warn("An older revision was loaded from server, created a backup of previous state.");
            gameManager.stateManager.saveLocal();
          }
          const undoinfo = message.undoinfo;
          if (undoinfo) {
            if (undoinfo.length > 0 && undoinfo[0] == "serverSync") {
              await gameManager.stateManager.before("serverSync", ...undoinfo.slice(1));
            } else if (gameManager.game.revision - (gameManager.game.revisionOffset || 0) < gameModel.revision - (gameModel.revisionOffset || 0)) {
              await gameManager.stateManager.before("serverSync", ...undoinfo);
            }
          }
          gameManager.game.fromModel(gameModel, true);
          gameManager.stateManager.saveLocal();
          gameManager.uiChange.emit(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = false;
          break;
        case "game-undo":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameUndo: GameModel = message.payload as GameModel;

          const undoGame = await storageManager.readFromList<GameModel>('undo', gameManager.stateManager.undoCount - 1);
          if (undoGame && undoGame.revision - undoGame.revisionOffset == gameManager.game.revision - gameManager.game.revisionOffset - 1) {
            storageManager.deleteFromList('undos', gameManager.stateManager.undoCount - 1);
          } else {
            storageManager.insertList('undo-infos', message.undoinfo && ['serverSync', ...message.undoinfo] || ['serverSync'], gameManager.stateManager.undoCount - gameManager.stateManager.redoCount);
          }

          storageManager.write('redos', undefined, gameManager.game.toModel());
          gameManager.stateManager.redoCount++;
          gameManager.game.fromModel(gameUndo);
          gameManager.stateManager.saveLocal();
          gameManager.uiChange.emit(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = false;
          break;
        case "game-redo":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameRedo: GameModel = message.payload as GameModel;

          const redoGame = gameManager.stateManager.redoCount > 0 ? await storageManager.readFromList<GameModel>('redo', gameManager.stateManager.redoCount - 1) : undefined;
          if (redoGame && redoGame.revision - redoGame.revisionOffset == gameManager.game.revision - gameManager.game.revisionOffset + 1) {
            storageManager.deleteFromList('redo', gameManager.stateManager.redoCount - 1);
          } else {
            storageManager.insertList('undo-infos', message.undoinfo && ['serverSync', ...message.undoinfo] || ['serverSync'], gameManager.stateManager.undoCount - gameManager.stateManager.redoCount);
          }

          storageManager.write('undo', undefined, gameManager.game.toModel());
          gameManager.stateManager.undoCount++;
          gameManager.game.fromModel(gameRedo);
          gameManager.stateManager.saveLocal();
          gameManager.uiChange.emit(true);
          setTimeout(() => {
            window.document.body.classList.remove('working');
            window.document.body.classList.remove('server-sync');
          }, 1);
          gameManager.stateManager.serverError = false;
          break;
        case "game-update":
          window.document.body.classList.add('working');
          window.document.body.classList.add('server-sync');
          let gameUpdate: GameModel = message.payload as GameModel;
          if (gameManager.game.revision == gameUpdate.revision) {
            gameManager.game.playSeconds = gameUpdate.playSeconds;
            gameManager.game.server = gameUpdate.server;
            gameManager.stateManager.saveLocal();
            gameManager.uiChange.emit(true);
            setTimeout(() => {
              window.document.body.classList.remove('working');
              window.document.body.classList.remove('server-sync');
            }, 1);
            gameManager.stateManager.serverError = false;
          }
          break;
        case "requestUpdate":
          await gameManager.stateManager.after(1, 0, 'game-update');
          gameManager.stateManager.serverError = false;
          break;
        case "settings":
          window.document.body.classList.add('server-sync');
          if (settingsManager.settings.serverSettings) {
            let settings: Settings = message.payload as Settings;
            // keep local
            settings.automaticAttackModifierFullscreen = settingsManager.settings.automaticAttackModifierFullscreen;
            settings.autoscroll = settingsManager.settings.autoscroll;
            settings.barsize = settingsManager.settings.barsize;
            settings.browserNavigation = settingsManager.settings.browserNavigation;
            settings.debugRightClick = settingsManager.settings.debugRightClick;
            settings.disableAnimations = settingsManager.settings.disableAnimations;
            settings.disableStatAnimations = settingsManager.settings.disableStatAnimations;
            settings.disableColumns = settingsManager.settings.disableColumns;
            settings.disableWakeLock = settingsManager.settings.disableWakeLock;
            settings.dragValues = settingsManager.settings.dragValues;
            settings.fhStyle = settingsManager.settings.fhStyle;
            settings.fontsize = settingsManager.settings.fontsize;
            settings.fullscreen = settingsManager.settings.fullscreen;
            settings.pressDoubleClick = settingsManager.settings.pressDoubleClick;
            settings.serverAutoconnect = settingsManager.settings.serverAutoconnect;
            settings.serverPassword = settingsManager.settings.serverPassword;
            settings.serverPort = settingsManager.settings.serverPort;
            settings.serverSettings = settingsManager.settings.serverSettings;
            settings.serverUrl = settingsManager.settings.serverUrl;
            settings.serverWss = settingsManager.settings.serverWss;
            settings.theme = settingsManager.settings.theme;
            settings.zoom = settingsManager.settings.zoom;

            settingsManager.setSettings(Object.assign(new Settings(), settings));
            storageManager.write('settings', 'default', settingsManager.settings);
            setTimeout(() => {
              window.document.body.classList.remove('server-sync');
            }, 1);
          }
          gameManager.stateManager.serverError = false;
          break;
        case "permissions":
          gameManager.stateManager.permissions = message.payload as Permissions || undefined;
          gameManager.stateManager.permissionBackup = gameManager.stateManager.permissions && JSON.parse(JSON.stringify(gameManager.stateManager.permissions)) || undefined;
          gameManager.stateManager.updatePermissions();
          gameManager.stateManager.serverError = false;
          break;
        case "error":
          console.warn("[GHS] Error: " + message.message);
          if (message.message == "Permission(s) missing" || message.message == "invalid revision") {
            if (gameManager.stateManager.lastAction == "redo" || gameManager.stateManager.lastAction == "update") {
              gameManager.stateManager.undo(false);
            } else if (gameManager.stateManager.lastAction == "undo") {
              gameManager.stateManager.redo(false);
            }
          }
          if (message.message && message.message.startsWith("Invalid password")) {
            console.warn("Disconnect...");
            ev.target?.close();
          }
          gameManager.stateManager.serverError = false;
          window.document.body.classList.remove('working');
          window.document.body.classList.remove('server-sync');
          break;
      }
    } catch (e) {
      gameManager.stateManager.errorLog.push(ev.data);
      gameManager.stateManager.serverError = true;
      console.error("[GHS] " + ev.data, e);
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }
  }

  onOpen(ev: Event) {
    const ws = ev.target as WebSocket;
    if (ws && ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      gameManager.stateManager.connectionTries = 0;
      gameManager.stateManager.updateBlocked = false;
      gameManager.stateManager.permissions = gameManager.stateManager.permissionBackup;
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "request-game",
        "payload": gameManager.game.toModel(),
      }
      ws.send(JSON.stringify(message));

      if (settingsManager.settings.serverSettings) {
        let message = {
          "password": settingsManager.settings.serverPassword,
          "type": "request-settings"
        }
        ws.send(JSON.stringify(message));
      }

      gameManager.stateManager.updatePermissions();
    }
  }

  onClose(ev: Event) {
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
  }

  onError(ev: Event) {
    gameManager.game.server = false;
    gameManager.stateManager.updateBlocked = true;
    gameManager.stateManager.permissions = new Permissions();
    gameManager.stateManager.updatePermissions();
  }

  forceUpdateState() {
    gameManager.stateManager.updateBlocked = false;
    gameManager.stateManager.permissions = gameManager.stateManager.permissionBackup;
    gameManager.stateManager.updatePermissions();
  }

  requestSettings() {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword && settingsManager.settings.serverSettings) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "request-settings"
      }
      this.ws.send(JSON.stringify(message));
    }
  }

  wsState(): number {
    if (settingsManager.settings.serverUrl && settingsManager.settings.serverPort && settingsManager.settings.serverPassword) {
      return this.ws && this.ws.readyState || -1;
    } else {
      return -99;
    }
  }

  reset() {
    storageManager.addBackup(gameManager.game.toModel());
    const revision = this.game.revision;
    this.game = new Game();
    this.game.revision = revision;
    storageManager.clear('game');
    storageManager.clear('undo');
    storageManager.clear('redo');
    storageManager.clear('undo-infos');
  }

  saveLocal() {
    storageManager.writeGameModel(this.game.toModel());
    this.lastSaveTimestamp = new Date().getTime();
  }

  saveSettings() {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword && settingsManager.settings.serverSettings) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "settings",
        "payload": settingsManager.settings
      }
      this.ws.send(JSON.stringify(message));
    }
  }

  updatePermissions() {
    this.undoPermission = this.hasUndo() && (!this.permissions || !this.updateBlocked);
    this.redoPermission = this.hasRedo() && (!this.permissions || !this.updateBlocked);
    this.characterPermissions = {};

    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Character) {
        this.characterPermissions[figure.name + '|' + figure.edition] = !this.permissions || this.permissions && (this.permissions.characters || this.permissions.character.some((value) => value.name == figure.name && value.edition == figure.edition));
      }
    })

    this.monsterPermissions = {};
    gameManager.game.figures.forEach((figure) => {
      if (figure instanceof Monster) {
        this.monsterPermissions[figure.name + '|' + figure.edition] = !this.permissions || this.permissions && (this.permissions.monsters || this.permissions.monster.some((value) => value.name == figure.name && value.edition == figure.edition));
      }
    })
  }

  async before(...info: string[]) {
    window.document.body.classList.add('working');
    await this.addToUndo(info || []);
  }

  async after(timeout: number = 1, revisionChange: number = 1, type: string = "game") {
    this.game.revision += revisionChange;
    this.saveLocal();
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      window.document.body.classList.add('server-sync');
      let undoInfo = await storageManager.readFromList('undo-infos', this.undoCount - 1);


      if (type == 'game-undo') {
        undoInfo = await storageManager.readFromList('undo-infos', this.undoCount);
      }

      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": type,
        "payload": this.game.toModel(),
        "undoinfo": undoInfo
      }
      this.ws.send(JSON.stringify(message));
    }

    if (settingsManager.settings.autoBackup > 0 && (this.game.revision + this.game.revisionOffset) % settingsManager.settings.autoBackup == 0) {
      try {
        let datadump: any = await storageManager.datadump();
        const filename = "ghs-autobackup-" + new Date().toISOString() + ".json";

        if (settingsManager.settings.autoBackupUrl && settingsManager.settings.autoBackupUrl.url) {
          try {
            let xhr = new XMLHttpRequest();
            xhr.open(settingsManager.settings.autoBackupUrl.method, settingsManager.settings.autoBackupUrl.url.replaceAll('{FILENAME}', filename), true, settingsManager.settings.autoBackupUrl.username, settingsManager.settings.autoBackupUrl.password);

            let data: string | FormData = JSON.stringify(datadump);
            if (settingsManager.settings.autoBackupUrl.fileUpload) {
              data = new FormData();
              data.append(filename, new File([JSON.stringify(datadump)], filename, { type: "application/json" }));
            }

            xhr.send(data);
          } catch (error) {
            console.warn("Could not post autobackup to '", settingsManager.settings.autoBackupUrl, error);
          }
        } else {
          let downloadButton = document.createElement('a');
          downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datadump)));
          downloadButton.setAttribute('download', filename);
          document.body.appendChild(downloadButton);
          downloadButton.click();
          document.body.removeChild(downloadButton);
        }
      } catch {
        console.warn("Could not create autobackup");
      }
    }

    gameManager.uiChange.emit();

    if (timeout && !settingsManager.settings.disableAnimations) {
      setTimeout(() => {
        window.document.body.classList.remove('working');
        window.document.body.classList.remove('server-sync');
      }, timeout);
    } else {
      window.document.body.classList.remove('working');
      window.document.body.classList.remove('server-sync');
    }

    this.lastAction = "update";
  }

  async addToUndo(info: string[]) {
    const last = this.undoCount > 0 ? await storageManager.readFromList<GameModel>('undo', this.undoCount - 1) : undefined;
    if (!last || this.game.toModel().revision != last.revision) {
      await storageManager.write('undo', undefined, this.game.toModel());
      this.undoCount++;
      const maxUndos = storageManager.db ? settingsManager.settings.maxUndo : Math.min(settingsManager.settings.maxUndo, 50);
      while (this.undoCount > maxUndos) {
        await storageManager.deleteFromList('undo', 0);
        this.undoCount--;
      }

      if (this.redoCount > 5) {
        await storageManager.addBackup(await storageManager.readFromList('redo', 0));
      }

      const redoCount = this.redoCount;
      for (let i = 0; i < redoCount; i++) {
        try {
          this.redoCount--;
          await storageManager.deleteFromList('undo-infos', this.undoCount + this.redoCount - 1);
        } catch { }
      }

      await storageManager.clear('redo');
      this.redoCount = 0;

      await storageManager.write('undo-infos', undefined, info);
    }
  }

  hasUndo(): boolean {
    return this.undoCount > 0;
  }

  async undo(sync: boolean = true) {
    if (this.undoCount > 0) {
      window.document.body.classList.add('working');

      await storageManager.write('redo', undefined, this.game.toModel());
      this.redoCount++;
      const revision = gameManager.game.revision;
      const revisionOffset = gameManager.game.revisionOffset;
      const gameModel: GameModel = await storageManager.readFromList('undo', this.undoCount - 1);
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.game.revisionOffset = revisionOffset + 2;
      await storageManager.deleteFromList('undo', this.undoCount - 1);
      this.undoCount--;
      if (sync) {
        await this.after(1, 1, 'game-undo');
      } else {
        gameManager.uiChange.emit();
      }
      this.lastAction = "undo";
    }
  }

  hasRedo(): boolean {
    return this.redoCount > 0;
  }

  async redo(sync: boolean = true) {
    if (this.redoCount > 0) {
      window.document.body.classList.add('working');
      await storageManager.write('undo', undefined, this.game.toModel());
      this.undoCount++;
      const revision = gameManager.game.revision;
      const revisionOffset = gameManager.game.revisionOffset;
      const gameModel: GameModel = await storageManager.readFromList('redo', this.redoCount - 1)
      this.game.fromModel(gameModel);
      this.game.revision = revision;
      this.game.revisionOffset = revisionOffset;
      await storageManager.deleteFromList('redo', this.redoCount - 1);
      this.redoCount--;
      if (sync) {
        await this.after(1, 1, 'game-redo');
      } else {
        gameManager.uiChange.emit();
      }
      this.lastAction = "undo";
    }
  }

  async clearUndos() {
    for (let i = this.undoCount; i > 0; i--) {
      try {
        await storageManager.deleteFromList('undo-infos', i - 1);
      } catch { }
    }
    storageManager.clear('undo');
    this.undoCount = 0;
  }

  async clearRedos() {
    for (let i = this.undoCount + this.redoCount; i > this.undoCount; i--) {
      try {
        await storageManager.deleteFromList('undo-infos', i - 1);
      } catch { }
    }
    storageManager.clear('redo');
    this.redoCount = 0;
  }

  savePermissions(password: string, permissions: Permissions | undefined) {
    if (this.ws && this.ws.readyState == WebSocket.OPEN && settingsManager.settings.serverPassword) {
      let message = {
        "password": settingsManager.settings.serverPassword,
        "type": "permissions",
        "payload": {
          "permissions": permissions,
          "password": password
        }
      }
      this.ws.send(JSON.stringify(message));
    }
  }
}