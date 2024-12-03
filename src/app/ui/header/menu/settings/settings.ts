import { Platform } from "@angular/cdk/platform";
import { Component, EventEmitter, Output, QueryList, ViewChildren } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { StorageManager, storageManager } from "src/app/game/businesslogic/StorageManager";
import { GameState } from "src/app/game/model/Game";
import { Condition, ConditionName, ConditionType } from "src/app/game/model/data/Condition";
import { SubMenu } from "../menu";
import { SettingMenuComponent } from "./setting/setting";
import { ghsTextSearch } from "src/app/ui/helper/Static";

@Component({
	standalone: false,
  selector: 'ghs-settings-menu',
  templateUrl: 'settings.html',
  styleUrls: ['../menu.scss', 'settings.scss']
})
export class SettingsMenuComponent {

  @ViewChildren(SettingMenuComponent) settingMenus!: QueryList<SettingMenuComponent>;
  @Output() setMenu: EventEmitter<SubMenu> = new EventEmitter<SubMenu>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  storageManager: StorageManager = storageManager;
  GameState = GameState;
  SubMenu = SubMenu;
  wakeLock: boolean;
  applyConditionsExcludes: Condition[] = [];
  activeApplyConditionsAuto: Condition[] = [];
  activeApplyConditionsExcludes: Condition[] = [];
  WebSocket = WebSocket;
  ConditionType = ConditionType;
  filter: string = "";

  constructor(public platform: Platform) {
    this.wakeLock = 'wakeLock' in navigator;

    Object.keys(ConditionName).forEach((conditionName) => {
      const condition = new Condition(conditionName);
      if (!gameManager.game.edition || gameManager.conditions(gameManager.game.edition).map((condition) => condition.name).indexOf(condition.name) != -1 || condition.types.indexOf(ConditionType.hidden) != -1) {
        if (condition.types.indexOf(ConditionType.turn) != -1 || condition.types.indexOf(ConditionType.afterTurn) != -1) {
          this.applyConditionsExcludes.push(condition);
        }

        if (condition.types.indexOf(ConditionType.autoApply) != -1) {
          this.activeApplyConditionsAuto.push(condition);
        }

        if (condition.types.indexOf(ConditionType.apply) != -1) {
          this.activeApplyConditionsExcludes.push(condition);
        }
      }
    })
  }

  updateFilter() {
    this.settingMenus.forEach((item) => {
      if (!this.filter) {
        item.elementRef.nativeElement.classList.remove('hidden');
      } else if (ghsTextSearch(item.setting, this.filter) || ghsTextSearch(settingsManager.getLabel('settings.' + item.setting), this.filter) || ghsTextSearch(settingsManager.getLabel('settings.' + item.setting + '.hint'), this.filter)) {
        item.elementRef.nativeElement.classList.remove('hidden');
      } else {
        item.elementRef.nativeElement.classList.add('hidden');
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

  toggleActiveApplyConditionsAuto(condition: ConditionName) {
    let index = settingsManager.settings.activeApplyConditionsAuto.indexOf(condition);
    if (index == -1) {
      settingsManager.settings.activeApplyConditionsAuto.push(condition);
    } else {
      settingsManager.settings.activeApplyConditionsAuto.splice(index, 1);
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

  lurkarsDefaults() {
    settingsManager.settings.abilities = true;
    settingsManager.settings.abilityNumbers = true;
    settingsManager.settings.abilityReveal = true;
    settingsManager.settings.activeApplyConditions = true;
    settingsManager.settings.activeApplyConditionsExcludes = [
      ConditionName.shield,
      ConditionName.poison,
      ConditionName.poison_x
    ];
    settingsManager.settings.activeStandees = false;
    settingsManager.settings.activeSummons = true;
    settingsManager.settings.addAllMonsters = false;
    settingsManager.settings.allyAttackModifierDeck = true;
    settingsManager.settings.alwaysAllyAttackModifierDeck = false;
    settingsManager.settings.alwaysFhAdvantage = true;
    settingsManager.settings.alwaysFhSolo = false;
    settingsManager.settings.alwaysHazardousTerrain = false;
    settingsManager.settings.alwaysLootApplyDialog = false;
    settingsManager.settings.alwaysLootDeck = false;
    settingsManager.settings.amAdvantage = true;
    settingsManager.settings.amAdvantageHouseRule = true;
    settingsManager.settings.animations = true;
    settingsManager.settings.applyBuildingRewards = true;
    settingsManager.settings.applyConditions = true;
    settingsManager.settings.applyConditionsExcludes = [ConditionName.shield];
    settingsManager.settings.applyLongRest = true;
    settingsManager.settings.applyLoot = true;
    settingsManager.settings.applyLootRandomItem = true;
    settingsManager.settings.applyRetirement = true;
    settingsManager.settings.artwork = true;
    settingsManager.settings.automaticAttackModifierFullscreen = false;
    settingsManager.settings.automaticGameClock = true;
    settingsManager.settings.automaticGameClockFocus = false;
    settingsManager.settings.automaticPassTime = true;
    settingsManager.settings.automaticStandees = true;
    settingsManager.settings.automaticStandeesDialog = false;
    settingsManager.settings.automaticTheme = true;
    settingsManager.settings.automaticUnlocking = true;
    settingsManager.settings.backupHint = false;
    settingsManager.settings.battleGoals = true;
    settingsManager.settings.battleGoalsCharacter = false;
    settingsManager.settings.battleGoalsFh = false;
    settingsManager.settings.battleGoalsReminder = true;
    settingsManager.settings.calculate = true;
    settingsManager.settings.calculateStats = true;
    settingsManager.settings.calculateShieldStats = false;
    settingsManager.settings.characterAttackModifierAnimate = true;
    settingsManager.settings.characterAttackModifierDeck = true;
    settingsManager.settings.characterAttackModifierDeckPermanent = true;
    settingsManager.settings.characterAttackModifierDeckPermanentActive = false;
    settingsManager.settings.characterCompact = false;
    settingsManager.settings.characterHandSize = true;
    settingsManager.settings.characterIdentities = true;
    settingsManager.settings.characterIdentityHint = true;
    settingsManager.settings.characterItems = true;
    settingsManager.settings.characterItemsApply = true;
    settingsManager.settings.characterItemsPermanent = false;
    settingsManager.settings.characterSheet = true;
    settingsManager.settings.characterSheetCompact = false;
    settingsManager.settings.characterShieldRetaliate = true;
    settingsManager.settings.characterTraits = true;
    settingsManager.settings.columns = true;
    settingsManager.settings.columnsForce = true;
    settingsManager.settings.combineInteractiveAbilities = false;
    settingsManager.settings.combineSummonAction = true;
    settingsManager.settings.dragFigures = true;
    settingsManager.settings.dragValues = true;
    settingsManager.settings.eliteFirst = true;
    settingsManager.settings.errata = true;
    settingsManager.settings.expireConditions = true;
    settingsManager.settings.fhGhItems = true;
    settingsManager.settings.fhStyle = false;
    settingsManager.settings.hideCharacterHP = false;
    settingsManager.settings.hideCharacterLoot = false;
    settingsManager.settings.hideCharacterXP = false;
    settingsManager.settings.hideStats = false;
    settingsManager.settings.initiativeRequired = true;
    settingsManager.settings.interactiveAbilities = true;
    settingsManager.settings.lootDeck = true;
    settingsManager.settings.portraitMode = true;
    settingsManager.settings.monsters = true;
    settingsManager.settings.monsterAttackModifierDeck = true;
    settingsManager.settings.moveElements = true;
    settingsManager.settings.partySheet = true;
    settingsManager.settings.pinchZoom = true;
    settingsManager.settings.pressDoubleClick = true;
    settingsManager.settings.randomStandees = true;
    settingsManager.settings.removeUnusedMonster = true;
    settingsManager.settings.scenarioRewards = true;
    settingsManager.settings.scenarioRewardsItems = true;
    settingsManager.settings.scenarioRooms = true;
    settingsManager.settings.scenarioRules = true;
    settingsManager.settings.showExpandedAbilityCard = true;
    settingsManager.settings.showFullAbilityCard = false;
    settingsManager.settings.sortFigures = true;
    settingsManager.settings.standees = true;
    settingsManager.settings.standeeStats = true;
    settingsManager.settings.statAnimations = false;
    settingsManager.settings.stats = true;
    settingsManager.settings.summons = true;
    settingsManager.settings.tooltips = true;
    settingsManager.settings.treasures = true;
    settingsManager.settings.treasuresLoot = true;
    settingsManager.settings.treasuresLootItem = true;
    settingsManager.settings.treasuresLootScenario = true;
    settingsManager.settings.turnConfirmation = false;
    settingsManager.settings.unlockEnvelopeBuildings = true;
  }
}