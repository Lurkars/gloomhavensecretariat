import { Platform } from '@angular/cdk/platform';
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { StorageManager, storageManager } from 'src/app/game/businesslogic/StorageManager';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';
import { GameState } from 'src/app/game/model/Game';
import { SubMenu } from 'src/app/ui/header/menu/menu';
import { SettingMenuComponent, SettingMenuTitleComponent } from 'src/app/ui/header/menu/settings/setting/setting';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { ghsTextSearch } from 'src/app/ui/helper/Static';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';
import { GhsTooltipDirective } from 'src/app/ui/helper/tooltip/tooltip';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

export type SettingsTab =
  | 'gameplay'
  | 'character'
  | 'monsters'
  | 'automation'
  | 'gamerules'
  | 'display'
  | 'interface'
  | 'locale'
  | 'preferences';

@Component({
  imports: [
    NgClass,
    FormsModule,
    GhsLabelDirective,
    PointerInputDirective,
    TabClickDirective,
    TrackUUIDPipe,
    GhsTooltipDirective,
    SettingMenuComponent,
    SettingMenuTitleComponent
  ],
  selector: 'ghs-settings-menu',
  templateUrl: 'settings.html',
  styleUrls: ['../menu.scss', 'settings.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  branded = environment.branded;
  filter: string = '';
  activeTab: SettingsTab = 'gameplay';

  tabs: SettingsTab[] = ['gameplay', 'automation', 'character', 'monsters', 'gamerules', 'display', 'interface', 'locale', 'preferences'];

  setTab(tab: SettingsTab) {
    this.activeTab = tab;
    this.filter = '';
    this.updateFilter();
  }

  constructor(public platform: Platform) {
    this.wakeLock = 'wakeLock' in navigator;

    Object.keys(ConditionName).forEach((conditionName) => {
      const condition = new Condition(conditionName);
      if (
        !gameManager.game.edition ||
        gameManager
          .conditions(gameManager.game.edition)
          .map((condition) => condition.name)
          .includes(condition.name) ||
        condition.types.includes(ConditionType.hidden)
      ) {
        if (
          condition.types.includes(ConditionType.turn) ||
          condition.types.includes(ConditionType.afterTurn) ||
          (condition.types.includes(ConditionType.autoApply) && !condition.types.includes(ConditionType.apply))
        ) {
          this.applyConditionsExcludes.push(condition);
        }

        if (condition.types.includes(ConditionType.autoApply)) {
          this.activeApplyConditionsAuto.push(condition);
        }

        if (condition.types.includes(ConditionType.apply)) {
          this.activeApplyConditionsExcludes.push(condition);
        }
      }
    });
  }

  updateFilter() {
    this.settingMenus.forEach((item) => {
      const host: HTMLElement = item.elementRef.nativeElement;
      if (!this.filter) {
        host.classList.remove('filter-hidden');
        host.querySelectorAll('.line').forEach((el) => el.classList.remove('filter-hidden'));
      } else {
        const labelMatch =
          ghsTextSearch(item.setting, this.filter) ||
          ghsTextSearch(settingsManager.getLabel('settings.' + item.setting), this.filter) ||
          ghsTextSearch(settingsManager.getLabel('settings.' + item.setting + '.hint'), this.filter);

        if (item.values.length > 0) {
          // Radio-type: filter individual value rows
          const childLines = host.querySelectorAll('.line');
          let anyVisible = false;
          childLines.forEach((el, index) => {
            const value = item.values[index];
            const valueMatch =
              labelMatch ||
              (value !== undefined &&
                (ghsTextSearch(value, this.filter) ||
                  ghsTextSearch(settingsManager.getLabel('settings.' + item.setting + '.' + value), this.filter)));
            el.classList.toggle('filter-hidden', !valueMatch);
            if (valueMatch) {
              anyVisible = true;
            }
          });
          host.classList.toggle('filter-hidden', !anyVisible);
        } else {
          host.classList.toggle('filter-hidden', !labelMatch);
        }
      }
    });
  }

  doubleClick: any = null;

  toggleApplyConditionsExclude(condition: ConditionName) {
    const index = settingsManager.settings.applyConditionsExcludes.indexOf(condition);
    if (index == -1) {
      settingsManager.settings.applyConditionsExcludes.push(condition);
    } else {
      settingsManager.settings.applyConditionsExcludes.splice(index, 1);
    }
    settingsManager.storeSettings();
  }

  toggleActiveApplyConditionsAuto(condition: ConditionName) {
    const index = settingsManager.settings.activeApplyConditionsAuto.indexOf(condition);
    if (index == -1) {
      settingsManager.settings.activeApplyConditionsAuto.push(condition);
    } else {
      settingsManager.settings.activeApplyConditionsAuto.splice(index, 1);
    }
    settingsManager.storeSettings();
  }

  toggleActiveApplyConditionsExclude(condition: ConditionName) {
    const index = settingsManager.settings.activeApplyConditionsExcludes.indexOf(condition);
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
    settingsManager.settings.dragValuesHp = true;
    settingsManager.settings.dragValuesInitiative = true;
    settingsManager.settings.dragValuesLoot = true;
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
    settingsManager.settings.dragValuesHp = true;
    settingsManager.settings.dragValuesInitiative = true;
    settingsManager.settings.dragValuesLoot = true;
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
    settingsManager.settings.activeApplyConditionsExcludes = [ConditionName.shield, ConditionName.poison, ConditionName.poison_x];
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
    settingsManager.settings.dragValuesHp = true;
    settingsManager.settings.dragValuesInitiative = true;
    settingsManager.settings.dragValuesLoot = true;
    settingsManager.settings.drawRandomItem = true;
    settingsManager.settings.drawRandomScenario = true;
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
    settingsManager.settings.turnConfirmation = false;
    settingsManager.settings.unlockEnvelopeBuildings = true;
  }
}
