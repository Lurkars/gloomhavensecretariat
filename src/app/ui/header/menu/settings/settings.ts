import { Component, EventEmitter, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager, SettingsManager } from "src/app/game/businesslogic/SettingsManager";
import { GameState } from "src/app/game/model/Game";
import { SubMenu } from "../menu";
import { StorageManager, storageManager } from "src/app/game/businesslogic/StorageManager";
import { Platform } from "@angular/cdk/platform";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";

@Component({
  selector: 'ghs-settings-menu',
  templateUrl: 'settings.html',
  styleUrls: ['../menu.scss', 'settings.scss']
})
export class SettingsMenuComponent {

  @Output() setMenu: EventEmitter<SubMenu> = new EventEmitter<SubMenu>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  storageManager: StorageManager = storageManager;
  GameState = GameState;
  SubMenu = SubMenu;
  wakeLock: boolean;
  applyConditionsExcludes: ConditionName[] = [];
  activeApplyConditionsExcludes: ConditionName[] = [];
  WebSocket = WebSocket;

  constructor(public platform: Platform) {
    this.wakeLock = 'wakeLock' in navigator;

    Object.keys(ConditionName).forEach((conditionName) => {
      const condition = new Condition(conditionName);
      if (condition.types.indexOf(ConditionType.turn) != -1 || condition.types.indexOf(ConditionType.afterTurn) != -1) {
        this.applyConditionsExcludes.push(condition.name);
      } if (condition.types.indexOf(ConditionType.apply) != -1) {
        this.activeApplyConditionsExcludes.push(condition.name);
      }
    })
  }

  doubleClick: any = null;

  toggleApplyConditionsExclude(condition: ConditionName) {
    let index = settingsManager.settings.applyConditionsExcludes.indexOf(condition);
    if (index == -1) {
      settingsManager.settings.applyConditionsExcludes.push(condition);
    } else {
      settingsManager.settings.applyConditionsExcludes.splice(index, 1);
    }
    settingsManager.storeSettings();
  }

  toggleActiveApplyConditionsExclude(condition: ConditionName) {
    let index = settingsManager.settings.activeApplyConditionsExcludes.indexOf(condition);
    if (index == -1) {
      settingsManager.settings.activeApplyConditionsExcludes.push(condition);
    } else {
      settingsManager.settings.activeApplyConditionsExcludes.splice(index, 1);
    }
    settingsManager.storeSettings();
  }

  zoomOut(force: boolean = false): void {
    this.zoom(5, force);
  }

  zoomIn(force: boolean = false): void {
    this.zoom(-5, force);
  }

  zoom(value: number, force: boolean) {
    let factor: number = +window.getComputedStyle(document.body).getPropertyValue('--ghs-factor');
    factor += value;
    this.setZoom(factor, value, force);
  }

  setZoom(zoom: number, value: number, force: boolean) {
    if (settingsManager.settings.zoom != zoom) {
      document.body.style.setProperty('--ghs-factor', zoom + '');
      if (!force) {
        const maxWidth = +window.getComputedStyle(document.body).getPropertyValue('min-width').replace('px', '');
        if (value < 0 && maxWidth >= window.innerWidth) {
          zoom -= value;
          document.body.style.setProperty('--ghs-factor', zoom + '');
        }
      }
      settingsManager.setZoom(zoom);
    }
  }

  resetZoom(): void {
    this.setZoom(100, 0, true);
  }

  updateBarsize(event: any) {
    document.body.style.setProperty('--ghs-barsize', event.target.value + '');
  }

  setBarsize(event: any): void {
    settingsManager.setBarsize(event.target.value);
    document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barsize + '');
  }

  resetBarsize(event: any) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      settingsManager.setBarsize(1);
      document.body.style.setProperty('--ghs-barsize', settingsManager.settings.barsize + '');
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.doubleClick = null;
        }
      }, 200)
    }
  }

  updateFontsize(event: any) {
    document.body.style.setProperty('--ghs-fontsize', event.target.value + '');
  }

  setFontsize(event: any): void {
    settingsManager.setFontsize(event.target.value);
    document.body.style.setProperty('--ghs-fontsize', settingsManager.settings.fontsize + '');
  }

  resetFontsize(event: any) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      settingsManager.setFontsize(1);
      document.body.style.setProperty('--ghs-fontsize', settingsManager.settings.fontsize + '');
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.doubleClick = null;
        }
      }, 200)
    }
  }

  updateGlobalFontsize(event: any) {
    document.body.style.setProperty('--ghs-global-fontsize', event.target.value + '');
  }

  setGlobalFontsize(event: any): void {
    settingsManager.setGlobalFontsize(event.target.value);
    document.body.style.setProperty('--ghs-global-fontsize', settingsManager.settings.globalFontsize + '');
  }

  resetGlobalFontsize(event: any) {
    if (this.doubleClick) {
      clearTimeout(this.doubleClick);
      this.doubleClick = null;
      settingsManager.setGlobalFontsize(1);
      document.body.style.setProperty('--ghs-global-fontsize', settingsManager.settings.globalFontsize + '');
    } else {
      this.doubleClick = setTimeout(() => {
        if (this.doubleClick) {
          this.doubleClick = null;
        }
      }, 200)
    }
  }

  setTheme(event: any) {
    settingsManager.setTheme(event.target.value);
  }

  fullscreen(): void {
    settingsManager.setFullscreen(!settingsManager.settings.fullscreen);
    if (settingsManager.settings.fullscreen) {
      document.body.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  togglePortraitMode() {
    settingsManager.setPortraitMode(!settingsManager.settings.portraitMode);

    if (settingsManager.settings.portraitMode) {
      document.body.classList.add('portrait-mode');
    } else {
      document.body.classList.remove('portrait-mode');
    }
  }

  helperDefaults(): void {
    settingsManager.settings.abilityNumbers = false;
    settingsManager.settings.activeApplyConditions = false;
    settingsManager.settings.activeStandees = false;
    settingsManager.settings.activeSummons = false;
    settingsManager.settings.applyConditions = false;
    settingsManager.settings.applyLongRest = false;
    settingsManager.settings.allyAttackModifierDeck = false;
    settingsManager.settings.automaticUnlocking = false;
    settingsManager.settings.automaticStandees = false;
    settingsManager.settings.autoscroll = false;
    settingsManager.settings.battleGoals = false;
    settingsManager.settings.calculate = true;
    settingsManager.settings.calculateStats = false;
    settingsManager.settings.characterAttackModifierDeck = false;
    settingsManager.settings.characterIdentities = false;
    settingsManager.settings.characterItems = false;
    settingsManager.settings.characterHandSize = false;
    settingsManager.settings.characterSheet = false;
    settingsManager.settings.disabledTurnConfirmation = true;
    settingsManager.settings.disableStandees = false;
    settingsManager.settings.dragValues = true;
    settingsManager.settings.eliteFirst = true;
    settingsManager.settings.expireConditions = false;
    settingsManager.settings.fhStyle = false;
    settingsManager.settings.hideAbsent = false;
    settingsManager.settings.hideStats = true;
    settingsManager.settings.hints = true;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.lootDeck = false;
    settingsManager.settings.moveElements = true;
    settingsManager.settings.partySheet = false;
    settingsManager.settings.randomStandees = false;
    settingsManager.settings.scenarioRewards = false;
    settingsManager.settings.scenarioRooms = false;
    settingsManager.settings.standees = true;
    settingsManager.settings.standeeStats = false;
    settingsManager.settings.treasures = false;
    settingsManager.settings.treasuresLoot = false;
    settingsManager.settings.turnConfirmation = false;
    settingsManager.settings.theme = 'default';
    settingsManager.storeSettings();
  }
}