import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { storageManager } from "src/app/game/businesslogic/StorageManager";
import { EditionData } from "src/app/game/model/data/EditionData";
import { GameModel } from "src/app/game/model/Game";
import { Settings } from "src/app/game/model/Settings";
import { ghsInputFullScreenCheck } from "src/app/ui/helper/Static";

@Component({
  selector: 'ghs-datamanagement-menu',
  templateUrl: 'datamanagement.html',
  styleUrls: ['../menu.scss', 'datamanagement.scss']
})
export class DatamanagementMenuComponent implements OnInit {

  @ViewChild('inputEditionDataUrl', { static: true }) editionDataUrlElement!: ElementRef;
  @ViewChild('inputSpoiler', { static: true }) spoilerElement!: ElementRef;
  @ViewChild('inputUnlock', { static: true }) unlockElement!: ElementRef;

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
    } catch {
      this.backups = 0;
    }
  }

  async addEditionDataUrl() {
    if (this.editionDataUrlElement.nativeElement.value) {
      this.editionDataUrlElement.nativeElement.classList.remove("error");
      this.editionDataUrlElement.nativeElement.disabled = true;
      const success = await settingsManager.addEditionDataUrl(this.editionDataUrlElement.nativeElement.value);

      if (success) {
        this.editionDataUrlElement.nativeElement.value = "";
        this.editionDataUrlElement.nativeElement.disabled = false;
      } else {
        this.editionDataUrlElement.nativeElement.classList.add("error");
        this.editionDataUrlElement.nativeElement.disabled = false;
      };
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

  addSpoiler(): void {
    if (this.spoilerElement.nativeElement.value) {
      settingsManager.addSpoiler(this.spoilerElement.nativeElement.value);
      this.spoilerElement.nativeElement.value = "";
    }
  }

  removeSpoiler(spoiler: string): void {
    if (spoiler) {
      settingsManager.removeSpoiler(spoiler);
    }
  }

  addUnlock(): void {
    const characterName = this.unlockElement.nativeElement.value;
    if (characterName) {
      if (gameManager.game.unlockedCharacters.indexOf(characterName) == -1 && gameManager.charactersData(undefined).find((characterData) => characterData.spoiler && characterData.name == characterName)) {
        gameManager.stateManager.before("unlockChar", "data.character." + characterName);
        gameManager.game.unlockedCharacters.push(characterName)
        gameManager.stateManager.after();
      }
      this.unlockElement.nativeElement.value = "";
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
    } catch {
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
    } catch {
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
    } catch {
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

  importGameCheck() {
    if (this.confirm != "importGame") {
      setTimeout(() => {
        this.confirm = "importGame";
      }, 100);
    } else {
      ghsInputFullScreenCheck();
    }
  }

  importGame(event: any) {
    event.target.parentElement.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        gameManager.stateManager.before("loadGameFromFile");
        const gameModel: GameModel = Object.assign(new GameModel(), JSON.parse(event.target.result));
        if (gameModel.revision < gameManager.game.revision) {
          storageManager.addBackup(gameManager.game.toModel());
          gameModel.revision = gameManager.game.revision;
          gameModel.revisionOffset = gameManager.game.revisionOffset;
        }
        gameManager.game.fromModel(gameModel);
        gameManager.stateManager.after();
      });

      if (event.target.files.length > 0) {
        reader.readAsText(event.target.files[0]);
        event.target.value = "";
      }
    } catch (e: any) {
      console.warn(e);
      event.target.parentElement.classList.add("error");
    }
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
    } catch {
      console.warn("No settings found");
    }
  }

  importSettingsCheck() {
    if (this.confirm != "importSettings") {
      setTimeout(() => {
        this.confirm = "importSettings";
      }, 100);
    } else {
      ghsInputFullScreenCheck();
    }
  }

  importSettings(event: any) {
    event.target.parentElement.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', async (event: any) => {
        const settings: Settings = Object.assign(new Settings(), JSON.parse(event.target.result));
        settingsManager.settings = settings;
        await storageManager.write('settings', 'default', settingsManager.settings);
      });

      reader.readAsText(event.target.files[0]);
    } catch (e: any) {
      console.warn(e);
      event.target.parentElement.classList.add("error");
    }
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

  importDataDumpCheck() {
    if (this.confirm != "importDataDump") {
      setTimeout(() => {
        this.confirm = "importDataDump";
      }, 100);
    } else {
      ghsInputFullScreenCheck();
    }
  }


  importDataDump(event: any) {
    event.target.parentElement.classList.remove("error");
    try {
      this.working = "importDataDump";
      const reader = new FileReader();
      reader.addEventListener('load', async (event: any) => {
        const datadump: any = JSON.parse(event.target.result);
        gameManager.stateManager.errorLog = datadump.errorLog || [];
        let migration = false;
        const keys = Object.keys(datadump);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          if (key.startsWith('ghs-')) {
            await localStorage.setItem(key, JSON.stringify(datadump[key]));
            migration = true;
          } else if (key === 'game') {
            await storageManager.write('game', 'default', datadump[key]);
          } else if (key === 'settings') {
            await storageManager.write('settings', 'default', Object.assign(new Settings(), datadump[key]));
          } else if (key === 'undo') {
            await storageManager.writeArray('undo', datadump[key]);
          } else if (key === 'redo') {
            await storageManager.writeArray('redo', datadump[key]);
          } else if (key === 'undo-infos') {
            await storageManager.writeArray('undo-infos', datadump[key]);
          } else if (key === 'game-backup') {
            await storageManager.writeArray('game-backup', datadump[key]);
          }
        }

        if (migration) {
          storageManager.migrate();
        }

        this.working = "";
        window.location.reload();
      });

      reader.readAsText(event.target.files[0]);
    } catch (e: any) {
      console.warn(e);
      this.working = "";
      event.target.parentElement.classList.add("error");
    }
  }

  async clearAllData() {
    if (this.confirm != "clearAllData") {
      this.confirm = "clearAllData";
    } else {
      try {
        console.warn("clear storage");
        await storageManager.clear();
        console.info("Reload...");
        window.location.reload();
      } catch {
        console.error("Could clear storage");
      }
    }
  }

}