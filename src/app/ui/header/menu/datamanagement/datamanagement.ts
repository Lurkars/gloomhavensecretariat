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

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  backups: number = 0;
  ghsInputFullScreenCheck = ghsInputFullScreenCheck;
  confirm: string = "";

  async ngOnInit() {
    const backups = await storageManager.readAll<GameModel>('game-backup');
    if (backups && backups.length > 0) {
      this.backups = backups.length;
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

  cancelConfirm() {
    this.confirm = "";
  }

  async exportGame() {
    const gameModel = await storageManager.readGameModel();
    if (gameModel) {
      const downloadButton = document.createElement('a');
      downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gameModel)));
      downloadButton.setAttribute('download', 'ghs-game' + (gameModel.party.name ? '_' + gameModel.party.name : '') + '.json');
      document.body.appendChild(downloadButton);
      downloadButton.click();
      document.body.removeChild(downloadButton);
    }
  }

  async exportLatestBackup() {
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
  }

  async exportAllBackups() {
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
  }

  deleteBackups() {
    if (this.confirm != "deleteBackups") {
      this.confirm = "deleteBackups";
    } else {
      storageManager.clear('game-backup');
      this.backups = 0;
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
    const settings = await storageManager.read<Settings>('settings', 'default');
    if (settings) {
      const downloadButton = document.createElement('a');
      downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings)));
      downloadButton.setAttribute('download', "ghs-settings.json");
      document.body.appendChild(downloadButton);
      downloadButton.click();
      document.body.removeChild(downloadButton);
    }
  }

  importSettings(event: any) {
    event.target.parentElement.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        const settings: Settings = Object.assign(new Settings(), JSON.parse(event.target.result));
        settingsManager.settings = settings;
        storageManager.write('settings', 'default', settingsManager.settings);
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
    let datadump: any = await storageManager.datadump();
    let downloadButton = document.createElement('a');
    downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datadump)));
    downloadButton.setAttribute('download', "ghs-data-dump.json");
    document.body.appendChild(downloadButton);
    downloadButton.click();
    document.body.removeChild(downloadButton);
  }

  importDataDump(event: any) {
    event.target.parentElement.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        const datadump: any = JSON.parse(event.target.result);
        gameManager.stateManager.errorLog = datadump.errorLog || [];
        let migration = false;
        Object.keys(datadump).forEach((key) => {
          if (key.startsWith('ghs-')) {
            localStorage.setItem(key, JSON.stringify(datadump[key]));
            migration = true;
          } else if (key === 'game') {
            storageManager.write('game', 'default', datadump[key]);
          } else if (key === 'settings') {
            storageManager.write('settings', 'default', datadump[key]);
          } else if (key === 'undo') {
            storageManager.writeArray('undo', datadump[key]);
          } else if (key === 'redo') {
            storageManager.writeArray('redo', datadump[key]);
          } else if (key === 'undo-infos') {
            storageManager.writeArray('undo-infos', datadump[key]);
          } else if (key === 'game-backup') {
            storageManager.writeArray('game-backup', datadump[key]);
          }
        })

        if (migration) {
          storageManager.migrate();
        }

        window.location.reload();
      });

      reader.readAsText(event.target.files[0]);
    } catch (e: any) {
      console.warn(e);
      event.target.parentElement.classList.add("error");
    }
  }

  clearAllData(): void {
    if (this.confirm != "clearAllData") {
      this.confirm = "clearAllData";
    } else {
      localStorage.clear();
      storageManager.clear();
      window.location.reload();
    }
  }

}