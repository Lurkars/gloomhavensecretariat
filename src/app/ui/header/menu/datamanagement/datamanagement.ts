import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { Component, ElementRef, ViewChild } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameModel } from "src/app/game/model/Game";
import { Settings } from "src/app/game/model/Settings";


@Component({
  selector: 'ghs-datamanagement-menu',
  templateUrl: 'datamanagement.html',
  styleUrls: [ 'datamanagement.scss', '../menu.scss' ]
})
export class DatamanagementMenuComponent {

  @ViewChild('inputEditionDataUrl', { static: true }) editionDataUrlElement!: ElementRef;
  @ViewChild('inputSpoiler', { static: true }) spoilerElement!: ElementRef;

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;

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

  drop(event: CdkDragDrop<number>) {
    moveItemInArray(settingsManager.settings.editionDataUrls, event.previousIndex, event.currentIndex);
    moveItemInArray(gameManager.editionData, event.previousIndex, event.currentIndex);
    settingsManager.storeSettings();
  }

  isDefaultEditionData(): boolean {
    return this.settingsManager.settings.editionDataUrls.length == settingsManager.defaultEditionDataUrls.length && this.settingsManager.settings.editionDataUrls.every((editionDataUrl) => settingsManager.defaultEditionDataUrls.indexOf(editionDataUrl) != -1);
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

  exportGame() {
    const gameJson = localStorage.getItem("ghs-game");
    if (gameJson) {
      const downloadButton = document.createElement('a');
      downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(gameJson));
      downloadButton.setAttribute('download', "ghs-game.json");
      document.body.appendChild(downloadButton);
      downloadButton.click();
      document.body.removeChild(downloadButton);
    }
  }

  importGame(event: any) {
    event.target.parentElement.classList.remove("error");
    try {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        gameManager.stateManager.before("loadGameFromFile");
        const gameModel: GameModel = Object.assign(new GameModel(), JSON.parse(event.target.result));
        gameManager.game.fromModel(gameModel);
        gameManager.stateManager.after();
      });

      reader.readAsText(event.target.files[ 0 ]);
    } catch (e: any) {
      console.warn(e);
      event.target.parentElement.classList.add("error");
    }
  }

  resetGame(): void {
    gameManager.stateManager.reset();
    gameManager.stateManager.after();
    window.location.reload();
  }

  exportSettings() {
    const gameJson = localStorage.getItem("ghs-settings");
    if (gameJson) {
      const downloadButton = document.createElement('a');
      downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(gameJson));
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
      });

      reader.readAsText(event.target.files[ 0 ]);
    } catch (e: any) {
      console.warn(e);
      event.target.parentElement.classList.add("error");
    }
  }

  resetSettings(): void {
    settingsManager.reset();
    window.location.reload();
  }

}