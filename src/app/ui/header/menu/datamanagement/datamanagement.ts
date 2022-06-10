import { Component, ElementRef, ViewChild } from "@angular/core";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
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

  addEditionDataUrl(): void {
    if (this.editionDataUrlElement.nativeElement.value) {
      this.editionDataUrlElement.nativeElement.classList.remove("error");
      this.editionDataUrlElement.nativeElement.disabled = true;
      settingsManager.addEditionDataUrl(this.editionDataUrlElement.nativeElement.value).then(() => {
        this.editionDataUrlElement.nativeElement.value = "";
        this.editionDataUrlElement.nativeElement.disabled = false;
      }).catch((error: Error) => {
        this.editionDataUrlElement.nativeElement.classList.add("error");
        this.editionDataUrlElement.nativeElement.disabled = false;
      });
    }
  }

  removeEditionDataUrl(editionDataUrl: string): void {
    if (editionDataUrl) {
      settingsManager.removeEditionDataUrl(editionDataUrl);
    }
  }

  isDefaultEditionData(): boolean {
    const defaultEditionDataUrls: string[] = new Settings().editionDataUrls;
    return this.settingsManager.settings.editionDataUrls.length == defaultEditionDataUrls.length && this.settingsManager.settings.editionDataUrls.every((editionDataUrl: string) => defaultEditionDataUrls.indexOf(editionDataUrl) != -1);
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

}