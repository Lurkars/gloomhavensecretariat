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
  applyConditionsExcludes: Condition[] = [];
  activeApplyConditionsExcludes: Condition[] = [];
  WebSocket = WebSocket;
  ConditionType = ConditionType;

  constructor(public platform: Platform) {
    this.wakeLock = 'wakeLock' in navigator;

    Object.keys(ConditionName).forEach((conditionName) => {
      const condition = new Condition(conditionName);
      if (!gameManager.game.edition || gameManager.conditions(gameManager.game.edition).map((condition) => condition.name).indexOf(condition.name) != -1 || condition.types.indexOf(ConditionType.hidden) != -1) {
        if (condition.types.indexOf(ConditionType.turn) != -1 || condition.types.indexOf(ConditionType.afterTurn) != -1) {
          this.applyConditionsExcludes.push(condition);
        } if (condition.types.indexOf(ConditionType.apply) != -1) {
          this.activeApplyConditionsExcludes.push(condition);
        }
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

  setTheme(event: any) {
    settingsManager.set('theme', event.target.value);
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
    settingsManager.settings.interactiveAbilities = true;
    settingsManager.settings.lootDeck = false;
    settingsManager.settings.moveElements = true;
    settingsManager.settings.partySheet = false;
    settingsManager.settings.randomStandees = false;
    settingsManager.settings.scenarioRewards = false;
    settingsManager.settings.scenarioRooms = false;
    settingsManager.settings.scenarioRules = false;
    settingsManager.settings.standees = true;
    settingsManager.settings.standeeStats = false;
    settingsManager.settings.treasures = false;
    settingsManager.settings.treasuresLoot = false;
    settingsManager.settings.turnConfirmation = false;
    settingsManager.settings.theme = 'default';
    settingsManager.storeSettings();
  }

  xhaDefaults(): void {
    settingsManager.settings.abilityNumbers = true;
    settingsManager.settings.activeApplyConditions = false;
    settingsManager.settings.activeStandees = false;
    settingsManager.settings.activeSummons = false;
    settingsManager.settings.applyConditions = false;
    settingsManager.settings.applyLongRest = false;
    settingsManager.settings.allyAttackModifierDeck = true;
    settingsManager.settings.automaticUnlocking = false;
    settingsManager.settings.automaticStandees = true;
    settingsManager.settings.automaticStandeesDialog = true;
    settingsManager.settings.autoscroll = true;
    settingsManager.settings.battleGoals = false;
    settingsManager.settings.calculate = true;
    settingsManager.settings.calculateStats = true;
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
    settingsManager.settings.fhStyle = true;
    settingsManager.settings.hideAbsent = false;
    settingsManager.settings.hideCharacterLoot = true;
    settingsManager.settings.hideStats = true;
    settingsManager.settings.hints = true;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.interactiveAbilities = false;
    settingsManager.settings.lootDeck = false;
    settingsManager.settings.moveElements = true;
    settingsManager.settings.partySheet = false;
    settingsManager.settings.randomStandees = false;
    settingsManager.settings.scenarioRewards = false;
    settingsManager.settings.scenarioRooms = true;
    settingsManager.settings.scenarioRules = true;
    settingsManager.settings.showFullAbilityCard = true;
    settingsManager.settings.standees = true;
    settingsManager.settings.standeeStats = false;
    settingsManager.settings.statAnimations = true;
    settingsManager.settings.treasures = false;
    settingsManager.settings.treasuresLoot = false;
    settingsManager.settings.turnConfirmation = false;
    settingsManager.settings.theme = 'fh';
    settingsManager.storeSettings();
  }
}