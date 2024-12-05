import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { storageManager } from "src/app/game/businesslogic/StorageManager";
import { EditionData } from "src/app/game/model/data/EditionData";
import { GameModel } from "src/app/game/model/Game";
import { Settings } from "src/app/game/model/Settings";
import { ghsInputFullScreenCheck } from "src/app/ui/helper/Static";

@Component({
  standalone: false,
  selector: 'ghs-datamanagement-menu',
  templateUrl: 'datamanagement.html',
  styleUrls: ['../menu.scss', 'datamanagement.scss']
})
export class DatamanagementMenuComponent implements OnInit {

  @Input() editionsOnly: boolean = false;

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  backups: number = 0;
  ghsInputFullScreenCheck = ghsInputFullScreenCheck;
  confirm: string = "";
  working: string = ""

  async ngOnInit() {
    try {
      const backups = await storageManager.readAll<GameModel>('game-backup');
      if (backups && backups.length > 0) {
        this.backups = backups.length;
      }
    } catch (e) {
      this.backups = 0;
    }
  }

  async addEditionDataUrl(target: any) {
    if (target.value) {
      target.classList.remove("error");
      target.disabled = true;
      const success = await settingsManager.addEditionDataUrl(target.value);

      if (success) {
        target.value = "";
        target.disabled = false;
        this.settingsManager.addEdition(success.edition);
      } else {
        setTimeout(() => {
          target.classList.add("error");
          target.disabled = false;
        }, 1)
      }
    }
  }

  removeEditionDataUrl(editionDataUrl: string): void {
    if (editionDataUrl) {
      settingsManager.removeEditionDataUrl(editionDataUrl);
    }
  }

  async toggleEdition(editionData: EditionData) {
    if (this.settingsManager.settings.editions.indexOf(editionData.edition) != -1) {
      this.settingsManager.removeEdition(editionData.edition);
    } else {
      this.settingsManager.addEdition(editionData.edition);
      await this.settingsManager.loadEditionData(editionData.url, true);
      gameManager.uiChange.emit();
    }
  }

  drop(event: CdkDragDrop<number>) {
    moveItemInArray(settingsManager.settings.editionDataUrls, event.previousIndex, event.currentIndex);
    moveItemInArray(gameManager.editionData, event.previousIndex, event.currentIndex);
    settingsManager.storeSettings();
  }

  hasDefaultEditionData(): boolean {
    return this.settingsManager.defaultEditionDataUrls.every((editionDataUrl) => settingsManager.settings.editionDataUrls.indexOf(editionDataUrl) != -1);
  }

  addSpoiler(target: any): void {
    if (target.value) {
      settingsManager.addSpoiler(target.value);
      target.value = "";
    }
  }

  removeSpoiler(spoiler: string): void {
    if (spoiler) {
      settingsManager.removeSpoiler(spoiler);
    }
  }

  addUnlock(target: any): void {
    if (target.value) {
      const characterName = target.value;
      target.classList.remove("error");
      target.disabled = true;
      if (gameManager.game.unlockedCharacters.indexOf(characterName) == -1 && gameManager.charactersData(undefined).find((characterData) => characterData.spoiler && characterData.name == characterName)) {
        gameManager.stateManager.before("unlockChar", "data.character." + characterName);
        gameManager.game.unlockedCharacters.push(characterName)
        gameManager.stateManager.after();
        target.value = "";
        target.disabled = false;
      } else {
        setTimeout(() => {
          target.classList.add("error");
          target.disabled = false;
        }, 1)
      }
    }
  }

  removeUnlock(characterName: string): void {
    if (characterName && gameManager.game.unlockedCharacters.indexOf(characterName) != -1) {
      gameManager.stateManager.before("unlockChar", "data.character." + characterName);
      gameManager.game.unlockedCharacters.splice(gameManager.game.unlockedCharacters.indexOf(characterName), 1);
      gameManager.stateManager.after();
    }
  }

  removeAllUnlocks() {
    gameManager.stateManager.before("removeAllUnlocks");
    gameManager.game.unlockedCharacters = [];
    gameManager.stateManager.after();
  }

  cancelConfirm() {
    this.confirm = "";
  }

  async exportGame() {
    try {
      const gameModel = await storageManager.readGameModel();
      if (gameModel) {
        const downloadButton = document.createElement('a');
        downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gameModel)));
        downloadButton.setAttribute('download', 'ghs-game' + (gameModel.party.name ? '_' + gameModel.party.name : '') + '.json');
        document.body.appendChild(downloadButton);
        downloadButton.click();
        document.body.removeChild(downloadButton);
      }
    } catch (e) {
      console.warn("No game found");
    }
  }

  async exportLatestBackup() {
    try {
      const backups = await storageManager.readAll<GameModel>('game-backup');
      if (backups && backups.length > 0) {
        const backup = backups[backups.length - 1];
        const downloadButton = document.createElement('a');
        downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup)));
        downloadButton.setAttribute('download', 'ghs-game' + (backup.party.name ? '_' + backup.party.name : '') + '-rev' + backup.revision + '.json');
        document.body.appendChild(downloadButton);
        downloadButton.click();
        document.body.removeChild(downloadButton);
      }
    } catch (e) {
      console.warn("No backup found");
    }
  }

  async exportAllBackups() {
    try {
      const backups = await storageManager.readAll<GameModel>('game-backup');
      if (backups && backups.length > 0) {
        backups.forEach((backup) => {
          const downloadButton = document.createElement('a');
          downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup)));
          downloadButton.setAttribute('download', 'ghs-game' + (backup.party.name ? '_' + backup.party.name : '') + '-rev' + backup.revision + '.json');
          document.body.appendChild(downloadButton);
          downloadButton.click();
          document.body.removeChild(downloadButton);
        })
      }
    } catch (e) {
      console.warn("No backups found");
    }
  }

  deleteBackups() {
    if (this.confirm != "deleteBackups") {
      this.confirm = "deleteBackups";
    } else {
      storageManager.clear('game-backup');
      this.backups = 0;
    }
  }

  importFileCheck(event: any) {
    event.target.classList.remove("warning");
    event.target.parentElement.classList.remove("warning");
    if (this.confirm != "importFile") {
      setTimeout(() => {
        this.confirm = "importFile";
      }, 100);
    } else {
      ghsInputFullScreenCheck();
    }
  }

  importFile(inputEvent: any) {
    this.working = "importFile";
    inputEvent.target.parentElement.classList.remove("warning");
    const reader = new FileReader();
    try {
      reader.addEventListener('load', async (event: any) => {
        const data = JSON.parse(event.target.result);
        if (data.revision && typeof data.revision === 'number') {
          this.importGame(Object.assign(new GameModel(), data));
        } else if (data.zoom && typeof data.zoom === 'number') {
          this.importSettings(Object.assign(new Settings(), data));
        } else if (data.game && data.settings || typeof data === 'object' && data['ghs-game'] && data['ghs-settings']) {
          this.importDataDump(data);
        } else {
          inputEvent.target.parentElement.classList.add("warning");
        }
        this.working = "";
      })

      if (inputEvent.target.files.length > 0) {
        reader.readAsText(inputEvent.target.files[0]);
        inputEvent.target.value = "";
      }
    } catch (e: any) {
      console.warn(e);
      inputEvent.target.parentElement.classList.add("warning");
      this.working = "";
    }
  }

  importGame(gameModel: GameModel) {
    gameManager.stateManager.before("loadGameFromFile");
    if (gameModel.revision < gameManager.game.revision) {
      storageManager.addBackup(gameManager.game.toModel());
      gameModel.revision = gameManager.game.revision;
      gameModel.revisionOffset = gameManager.game.revisionOffset;
    }
    gameManager.game.fromModel(gameModel);
    gameManager.stateManager.after();
  }

  resetGame(): void {
    if (this.confirm != "resetGame") {
      this.confirm = "resetGame";
    } else {
      gameManager.stateManager.reset();
      gameManager.stateManager.after();
      window.location.reload();
    }
  }

  async exportSettings() {
    try {
      const settings = await storageManager.read<Settings>('settings', 'default');
      if (settings) {
        const downloadButton = document.createElement('a');
        downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings)));
        downloadButton.setAttribute('download', "ghs-settings.json");
        document.body.appendChild(downloadButton);
        downloadButton.click();
        document.body.removeChild(downloadButton);
      }
    } catch (e) {
      console.warn("No settings found");
    }
  }

  async importSettings(settings: Settings) {
    settingsManager.settings = settings;
    await storageManager.write('settings', 'default', settingsManager.settings);
  }

  resetSettings(): void {
    if (this.confirm != "resetSettings") {
      this.confirm = "resetSettings";
    } else {
      settingsManager.reset();
      window.location.reload();
    }
  }

  async exportDataDump() {
    await gameManager.stateManager.autoBackup("ghs-data-dump-" + new Date().toISOString() + ".json", true);
  }

  async importDataDump(data: any) {
    gameManager.stateManager.errorLog = data.errorLog || [];
    const keys = Object.keys(data);
    let success = false;
    for (let i = 0; i < keys.length; i++) {
      const origKey = keys[i];
      const key = origKey.startsWith('ghs-') ? origKey.replace('ghs-', '') : origKey;
      if (key === 'game') {
        await storageManager.write('game', 'default', data[origKey]);
        success = true;
      } else if (key === 'settings') {
        await storageManager.write('settings', 'default', Object.assign(new Settings(), data[origKey]));
      } else if (key === 'undo') {
        await storageManager.writeArray('undo', data[origKey]);
      } else if (key === 'redo') {
        await storageManager.writeArray('redo', data[origKey]);
      } else if (key === 'undo-infos') {
        await storageManager.writeArray('undo-infos', data[origKey]);
      } else if (key === 'game-backup') {
        await storageManager.writeArray('game-backup', data[origKey]);
      }
    }
    if (success) {
      window.location.reload();
    }
  }

  async clearAllData() {
    if (this.confirm != "clearAllData") {
      this.confirm = "clearAllData";
    } else {
      try {
        console.warn("clear storage");
        await storageManager.clear();
        gameManager.stateManager.storageBlocked = true;
        console.info("Reload...");
        window.location.reload();
      } catch (e) {
        console.error("Could clear storage");
      }
    }
  }

}