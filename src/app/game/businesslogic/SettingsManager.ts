import { EditionData } from "../model/data/EditionData";
import { Settings } from "../model/Settings";
import { Spoilable } from "../model/data/Spoilable";
import { gameManager } from "./GameManager";
import { EntityValueFunction } from "../model/Entity";
import { storageManager } from "./StorageManager";
import { BuildingData } from "../model/data/BuildingData";

export class SettingsManager {

  defaultLocale: string = 'en';
  defaultEditions: string[] = ["gh", "jotl", "fc", "cs", "fh", "solo"];
  defaultEditionDataUrls: string[] = ["./assets/data/gh.json", "./assets/data/fh.json", "./assets/data/jotl.json", "./assets/data/fc.json", "./assets/data/cs.json", "./assets/data/toa.json", "./assets/data/solo.json", "./assets/data/fh-crossover.json", "./assets/data/gh-envx.json", "./assets/data/toa-envv.json", "./assets/data/sox.json", "./assets/data/bas.json"];

  settings: Settings = new Settings();
  label: any = {};
  locales: string[] = ["en", "de", "fr", "ko"];
  developent: boolean = false;


  async init(developent: boolean) {
    await this.loadSettings();
    this.developent = developent;
    for (let defaultEditionDataUrl of this.defaultEditionDataUrls) {
      if (settingsManager.settings.editionDataUrls.indexOf(defaultEditionDataUrl) == -1 && settingsManager.settings.excludeEditionDataUrls.indexOf(defaultEditionDataUrl) == -1) {
        settingsManager.settings.editionDataUrls.push(defaultEditionDataUrl);
      }
    }

    for (let editionDataUrl of settingsManager.settings.editionDataUrls) {
      await settingsManager.loadEditionData(editionDataUrl);
    }
  }

  async loadSettings() {
    let loadDefault = false;
    try {
      let settings = await storageManager.read<Settings>('settings', 'default');
      if (settings) {
        this.setSettings(Object.assign(new Settings(), settings));
      } else {
        loadDefault = true;
      }
    } catch {
      loadDefault = true;
    }

    if (loadDefault) {
      try {
        await fetch('./ghs-settings-default.json')
          .then(response => {
            if (!response.ok) {
              throw Error();
            }
            return response.json();
          }).then((value: Settings) => {
            this.setSettings(Object.assign(new Settings(), value));
          });
      } catch {
        this.setSettings(new Settings());
      }
    }

    this.updateLocale(this.settings.locale);
  }

  setSettings(settings: Settings) {
    if (settings.locale != this.settings.locale) {
      this.updateLocale(settings.locale);
    }
    this.settings = settings;
    if (!this.settings.editions || this.settings.editions.length == 0) {
      this.settings.editions.push(...this.defaultEditions);
    }

    if (!this.settings.editionDataUrls || this.settings.editionDataUrls.length == 0) {
      for (let defaultEditionDataUrl of this.defaultEditionDataUrls) {
        if (this.settings.editionDataUrls.indexOf(defaultEditionDataUrl) == -1 && this.settings.excludeEditionDataUrls.indexOf(defaultEditionDataUrl) == -1) {
          this.settings.editionDataUrls.push(defaultEditionDataUrl);
        }
      }
    }

    if (!settings.theme) {
      if (settings.fhStyle) {
        settings.theme = 'fh';
      } else {
        settings.theme = 'default';
      }
    }

    this.sortSpoilers();
  }

  storeSettings(): void {
    storageManager.write('settings', 'default', this.settings);
    if (this.settings.serverSettings) {
      gameManager.stateManager.saveSettings();
    }
    gameManager.uiChange.emit();
  }

  reset() {
    storageManager.remove('settings');
    this.loadSettings();
  }

  setAbilities(abilities: boolean) {
    this.settings.abilities = abilities;
    this.storeSettings();
  }

  setAbilityNumbers(abilityNumbers: boolean) {
    this.settings.abilityNumbers = abilityNumbers;
    this.storeSettings();
  }

  setAbilityReveal(abilityReveal: boolean) {
    this.settings.abilityReveal = abilityReveal;
    this.storeSettings();
  }

  setActiveApplyConditions(activeApplyConditions: boolean) {
    this.settings.activeApplyConditions = activeApplyConditions;
    this.storeSettings();
  }

  setActiveStandees(activeStandees: boolean) {
    this.settings.activeStandees = activeStandees;
    this.storeSettings();
  }

  setActiveSummons(activeSummons: boolean) {
    this.settings.activeSummons = activeSummons;
    this.storeSettings();
  }

  setAllyAttackModifierDeck(allyAttackModifierDeck: boolean) {
    this.settings.allyAttackModifierDeck = allyAttackModifierDeck;
    this.storeSettings();
  }

  setAlwaysAllyAttackModifierDeck(alwaysAllyAttackModifierDeck: boolean) {
    this.settings.alwaysAllyAttackModifierDeck = alwaysAllyAttackModifierDeck;
    this.storeSettings();
  }

  setAlwaysFhSolo(alwaysFhSolo: boolean) {
    this.settings.alwaysFhSolo = alwaysFhSolo;
    this.storeSettings();
  }

  setAlwaysHazardousTerrain(alwaysHazardousTerrain: boolean) {
    this.settings.alwaysHazardousTerrain = alwaysHazardousTerrain;
    this.storeSettings();
  }

  setAlwaysLootApplyDialog(alwaysLootApplyDialog: boolean) {
    this.settings.alwaysLootApplyDialog = alwaysLootApplyDialog;
    this.storeSettings();
  }

  setAlwaysLootDeck(alwaysLootDeck: boolean) {
    this.settings.alwaysLootDeck = alwaysLootDeck;
    this.storeSettings();
  }

  setApplyConditions(applyConditions: boolean) {
    this.settings.applyConditions = applyConditions;
    this.storeSettings();
  }

  setApplyLoot(applyLoot: boolean) {
    this.settings.applyLoot = applyLoot;
    this.storeSettings();
  }

  setAutomaticAttackModifierFullscreen(automaticAttackModifierFullscreen: boolean) {
    this.settings.automaticAttackModifierFullscreen = automaticAttackModifierFullscreen;
    this.storeSettings();
  }

  setAutomaticStandees(automaticStandees: boolean) {
    this.settings.automaticStandees = automaticStandees;
    this.storeSettings();
  }

  setAutomaticStandeesDialog(automaticStandeesDialog: boolean) {
    this.settings.automaticStandeesDialog = automaticStandeesDialog;
    this.storeSettings();
  }

  setAutoscroll(autoscroll: boolean) {
    this.settings.autoscroll = autoscroll;
    this.storeSettings();
  }

  setBarsize(barsize: number) {
    this.settings.barsize = barsize;
    this.storeSettings();
  }

  setBrowserNavigation(browserNavigation: boolean) {
    this.settings.browserNavigation = browserNavigation;
    this.storeSettings();
  }

  setCalculateStats(calculateStats: boolean) {
    this.settings.calculateStats = calculateStats;
    this.storeSettings();
  }

  setCalculate(calculate: boolean) {
    this.settings.calculate = calculate;
    this.storeSettings();
  }

  setCharacterAttackModifierDeck(characterAttackModifierDeck: boolean) {
    this.settings.characterAttackModifierDeck = characterAttackModifierDeck;
    this.storeSettings();
  }

  setCharacterHandSize(characterHandSize: boolean) {
    this.settings.characterHandSize = characterHandSize;
    this.storeSettings();
  }

  setCharacterIdentities(characterIdentities: boolean) {
    this.settings.characterIdentities = characterIdentities;
    this.storeSettings();
  }

  setCharacterIdentityHint(characterIdentityHint: boolean) {
    this.settings.characterIdentityHint = characterIdentityHint;
    this.storeSettings();
  }

  setCharacterSheet(characterSheet: boolean) {
    this.settings.characterSheet = characterSheet;
    this.storeSettings();
  }

  setCombineSummonAction(combineSummonAction: boolean) {
    this.settings.combineSummonAction = combineSummonAction;
    this.storeSettings();
  }

  setDebugRightClick(debugRightClick: boolean) {
    this.settings.debugRightClick = debugRightClick;
    this.storeSettings();
  }

  setDisableAnimations(disableAnimations: boolean) {
    this.settings.disableAnimations = disableAnimations;
    this.storeSettings();
  }

  setDisableColumns(disableColumns: boolean) {
    this.settings.disableColumns = disableColumns;
    this.storeSettings();
  }

  setDisableDragFigures(disableDragFigures: boolean) {
    this.settings.disableDragFigures = disableDragFigures;
    this.storeSettings();
  }

  setDisabledTurnConfirmation(disabledTurnConfirmation: boolean) {
    this.settings.disabledTurnConfirmation = disabledTurnConfirmation;
    this.storeSettings();
  }

  setDisableSortFigures(disableSortFigures: boolean) {
    this.settings.disableSortFigures = disableSortFigures;
    if (!disableSortFigures) {
      gameManager.sortFigures();
    }
    this.storeSettings();
  }

  setDisableStandees(disableStandees: boolean) {
    this.settings.disableStandees = disableStandees;
    this.storeSettings();
  }

  setDisableStatAnimations(disableStatAnimations: boolean) {
    this.settings.disableStatAnimations = disableStatAnimations;
    this.storeSettings();
  }

  async setDisableWakeLock(disableWakeLock: boolean) {
    this.settings.disableWakeLock = disableWakeLock;
    if (disableWakeLock && gameManager.stateManager.wakeLock) {
      gameManager.stateManager.wakeLock.release().then(() => {
        gameManager.stateManager.wakeLock = null;
      });
    } else if (!disableWakeLock && !gameManager.stateManager.wakeLock && "wakeLock" in navigator) {
      gameManager.stateManager.wakeLock = await navigator.wakeLock.request("screen");
    }
    this.storeSettings();
  }

  setDragValues(dragValues: boolean) {
    this.settings.dragValues = dragValues;
    this.storeSettings();
  }

  setEliteFirst(eliteFirst: boolean) {
    this.settings.eliteFirst = eliteFirst;
    this.storeSettings();
  }

  setExpireConditions(expireConditions: boolean) {
    this.settings.expireConditions = expireConditions;
    this.storeSettings();
  }

  setFhStyle(fhStyle: boolean) {
    this.settings.fhStyle = fhStyle;
    if (this.settings.fhStyle && this.settings.theme == 'default') {
      this.settings.theme = 'fh';
    } else if (!this.settings.fhStyle && this.settings.theme == 'fh') {
      this.settings.theme = 'default';
    }
    this.storeSettings();
  }

  setFontsize(fontsize: number) {
    this.settings.fontsize = fontsize;
    this.storeSettings();
  }

  setFullscreen(fullscreen: boolean) {
    this.settings.fullscreen = fullscreen;
    this.storeSettings();
  }

  setHideAbsent(hideAbsent: boolean) {
    this.settings.hideAbsent = hideAbsent;
    this.storeSettings();
  }

  setHideStats(hideStats: boolean) {
    this.settings.hideStats = hideStats;
    this.storeSettings();
  }

  setHints(hints: boolean) {
    this.settings.hints = hints;
    this.storeSettings();
  }

  setInitiativeRequired(initiativeRequired: boolean) {
    this.settings.initiativeRequired = initiativeRequired;
    this.storeSettings();
  }

  setInteractiveAbilities(interactiveAbilities: boolean) {
    this.settings.interactiveAbilities = interactiveAbilities;
    this.storeSettings();
  }

  async setLocale(locale: string) {
    this.settings.locale = locale;
    await this.updateLocale(locale);
    this.storeSettings();
  }

  setLootDeck(lootDeck: boolean) {
    this.settings.lootDeck = lootDeck;
    this.storeSettings();
  }

  setMaxUndo(maxUndo: number) {
    this.settings.maxUndo = maxUndo;
    this.storeSettings();
  }

  setMonsters(monsters: boolean) {
    this.settings.monsters = monsters;
    this.storeSettings();
  }

  setMoveElements(moveElements: boolean) {
    this.settings.moveElements = moveElements;
    this.storeSettings();
  }

  setPartySheet(partySheet: boolean) {
    this.settings.partySheet = partySheet;
    this.storeSettings();
  }

  setPressDoubleClick(pressDoubleClick: boolean) {
    this.settings.pressDoubleClick = pressDoubleClick;
    this.storeSettings();
  }

  setRandomStandees(randomStandees: boolean) {
    this.settings.randomStandees = randomStandees;
    this.storeSettings();
  }

  setScenarioNumberInput(scenarioNumberInput: boolean) {
    this.settings.scenarioNumberInput = scenarioNumberInput;
    this.storeSettings();
  }

  setScenarioRooms(scenarioRooms: boolean) {
    this.settings.scenarioRooms = scenarioRooms;
    this.storeSettings();
  }

  setScenarioRules(scenarioRules: boolean) {
    this.settings.scenarioRules = scenarioRules;
    this.storeSettings();
  }

  setServerAutoconnect(autoconnect: boolean) {
    this.settings.serverAutoconnect = autoconnect;
    this.storeSettings();
  }


  setServer(url: string, port: number, password: string): void {
    this.settings.serverUrl = url;
    this.settings.serverPort = port;
    this.settings.serverPassword = password;
    this.storeSettings();
  }

  setServerSettings(settings: boolean) {
    this.settings.serverSettings = settings;
    if (settings) {
      gameManager.stateManager.requestSettings();
    } else {
      this.storeSettings();
    }
  }

  setServerWss(wss: boolean) {
    this.settings.serverWss = wss;
    this.storeSettings();
  }

  setShowFullAbilityCard(showFullAbilityCard: boolean) {
    this.settings.showFullAbilityCard = showFullAbilityCard;
    this.storeSettings();
  }

  setTheme(theme: string) {
    this.settings.theme = theme;
    this.storeSettings();
  }

  setTooltips(tooltips: boolean) {
    this.settings.tooltips = tooltips;
    this.storeSettings();
  }

  setTreasuresLoot(treasuresLoot: boolean) {
    this.settings.treasuresLoot = treasuresLoot;
    this.storeSettings();
  }

  setTreasures(treasures: boolean) {
    this.settings.treasures = treasures;
    this.storeSettings();
  }

  setZoom(zoom: number) {
    this.settings.zoom = zoom;
    this.storeSettings();
  }

  addSpoiler(spoiler: string) {
    if (this.settings.spoilers.indexOf(spoiler) == -1) {
      this.settings.spoilers.push(spoiler);
      this.sortSpoilers();
      this.storeSettings();
    }
  }

  addSpoilers(spoilables: Spoilable[]) {
    for (let spoilable of spoilables) {
      if (this.settings.spoilers.indexOf(spoilable.name) == -1) {
        this.settings.spoilers.push(spoilable.name);
      }
    }
    this.storeSettings();
  }

  removeSpoiler(spoiler: string) {
    if (this.settings.spoilers.indexOf(spoiler) != -1) {
      this.settings.spoilers.splice(this.settings.spoilers.indexOf(spoiler), 1);
      this.storeSettings();
    }
  }

  removeAllSpoilers() {
    this.settings.spoilers = [];
    this.storeSettings();
  }

  addEdition(edition: string) {
    if (this.settings.editions.indexOf(edition) == -1) {
      this.settings.editions.push(edition);
      this.storeSettings();
    }
  }

  removeEdition(edition: string) {
    this.settings.editions.splice(this.settings.editions.indexOf(edition), 1);
    this.storeSettings();
  }

  sortSpoilers() {
    this.settings.spoilers.sort((a: string, b: string) => {
      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }

      if (a.toLowerCase() < b.toLowerCase()) {
        return -1;
      }
      return 0;
    })
  }

  cleanEditionData() {
    gameManager.editionData = [];
  }

  async loadEditionData(url: string, force: boolean = false): Promise<boolean> {
    try {
      const success = await fetch(url)
        .then(response => {
          if (!response.ok) {
            console.warn("Invalid data url: " + url + " [" + response.statusText + "]");
            return;
          }
          return response.json();
        }).then((value: EditionData) => {
          if (gameManager.editions(true).indexOf(value.edition) != -1 && !force) {
            console.warn("Edition already exists: " + value.edition);
            return false;
          }

          if (force) {
            gameManager.editionData = gameManager.editionData.filter((editionData) => editionData.url != url);
          }

          value.characters = value.characters || [];
          value.monsters = value.monsters || [];
          value.decks = value.decks || [];
          value.scenarios = value.scenarios || [];
          value.sections = value.sections || [];
          value.items = value.items || [];
          value.conditions = value.conditions || [];
          value.label = value.label || {};
          value.labelSpoiler = value.labelSpoiler || {};
          value.url = url;
          value.logoUrl = value.logoUrl || "";
          value.additional = value.additional || false;
          value.extensions = value.extensions || [];
          value.newAmStyle = value.newAmStyle || false;
          value.treasures = value.treasures || [];
          value.treasureOffset = value.treasureOffset || 0;

          if (value.campaign && value.campaign.buildings) {
            value.campaign.buildings = value.campaign.buildings.map((buildingData) => Object.assign(new BuildingData, buildingData));
          }

          gameManager.editionData.push(value);
          gameManager.editionData.sort((a, b) => {
            return this.settings.editionDataUrls.indexOf(a.url) - this.settings.editionDataUrls.indexOf(b.url);
          });

          if (settingsManager.settings.editions.indexOf(value.edition) != -1) {
            this.loadDataLabel(value);
          } else {
            this.loadEditionLabel(value);
          }
          return true;
        });
      return success;
    } catch (error) {
      console.warn("Invalid data url: " + url + " [" + error + "]");
      return false;
    }
  }

  validateEditionData() {
    // check for duplicates
    gameManager.charactersData().forEach((characterData, index, self) => {
      if (self.find((other) => !characterData.replace && !other.replace && self.indexOf(other) != self.indexOf(characterData) && characterData.name == other.name && characterData.edition == other.edition)) {
        console.warn("Duplicate Character: " + characterData.name + " (Edition: " + characterData.edition + ")");
      }
    })

    gameManager.decksData().forEach((deckData, index, self) => {
      if (self.find((other) => self.indexOf(other) != self.indexOf(deckData) && deckData.name == other.name && deckData.edition == other.edition)) {
        console.warn("Duplicate Deck: " + deckData.name + " (Edition: " + deckData.edition + ")");
      }
    })

    gameManager.scenarioData().forEach((scenarioData, index, self) => {
      if (self.find((other) => self.indexOf(other) != self.indexOf(scenarioData) && scenarioData.index == other.index && scenarioData.edition == other.edition && scenarioData.group == other.group)) {
        console.warn("Duplicate Scenario: " + scenarioData.index + " (Edition: " + scenarioData.edition + ")");
      }

      if (scenarioData.monsters) {
        scenarioData.monsters.forEach((name) => {
          if (!gameManager.monstersData().find((monsterData) => (monsterData.edition == scenarioData.edition || gameManager.editionExtensions(scenarioData.edition).indexOf(monsterData.edition) != -1) && monsterData.name == name.split(':')[0])) {
            console.warn("Invalid monster: " + name + " | scenario", scenarioData.edition, scenarioData.group || '', scenarioData.index);
          }
        })
      }

      if (scenarioData.rooms) {
        scenarioData.rooms.forEach((roomData) => {
          if (roomData.monster) {
            roomData.monster.forEach((monsterStandeeData) => {
              if (!gameManager.monstersData().find((monsterData) => (monsterData.edition == scenarioData.edition || gameManager.editionExtensions(scenarioData.edition).indexOf(monsterData.edition) != -1) && monsterData.name == monsterStandeeData.name.split(':')[0])) {
                console.warn("Invalid monster: " + monsterStandeeData.name + " | scenario", scenarioData.edition, scenarioData.group || '', scenarioData.index);
              }

              if (!scenarioData.monsters || !scenarioData.monsters.find((name) => name == monsterStandeeData.name || name.split(':')[0] == monsterStandeeData.name)) {
                console.debug("Missing monster '" + monsterStandeeData.name + "' from room '" + roomData.roomNumber + "' in monsters", scenarioData.edition, scenarioData.group || '', scenarioData.index);
              }
            })
          }
        })
      }
    })

    gameManager.sectionData().forEach((sectionData, index, self) => {
      if (self.find((other) => self.indexOf(other) != self.indexOf(sectionData) && sectionData.index == other.index && sectionData.edition == other.edition && sectionData.group == other.group)) {
        console.warn("Duplicate Section: " + sectionData.index + " (Edition: " + sectionData.edition + ")");
      }

      if (sectionData.monsters) {
        sectionData.monsters.forEach((name) => {

          if (!gameManager.monstersData().find((monsterData) => (monsterData.edition == sectionData.edition || gameManager.editionExtensions(sectionData.edition).indexOf(monsterData.edition) != -1) && monsterData.name == name.split(':')[0])) {
            console.warn("Invalid monster: " + name + " | section", sectionData.edition, sectionData.group || '', sectionData.index);
          }
        })
      }

      if (sectionData.rooms) {
        sectionData.rooms.forEach((roomData) => {
          if (roomData.monster) {
            roomData.monster.forEach((monsterStandeeData) => {

              if (!gameManager.monstersData().find((monsterData) => (monsterData.edition == sectionData.edition || gameManager.editionExtensions(sectionData.edition).indexOf(monsterData.edition) != -1) && monsterData.name == monsterStandeeData.name.split(':')[0])) {
                console.warn("Invalid monster: " + monsterStandeeData.name + " | section", sectionData.edition, sectionData.group || '', sectionData.index);
              }

              if ((!sectionData.monsters || !sectionData.monsters.find((name) => name == monsterStandeeData.name || name.split(':')[0] == monsterStandeeData.name))) {
                console.debug("Missing monster '" + monsterStandeeData.name + "' from room '" + roomData.roomNumber + "' in monsters | section", sectionData.edition, sectionData.group || '', sectionData.index);
              }
            })
          }
        })

      }
    })

    gameManager.itemData().forEach((itemData, index, self) => {
      if (self.find((other) => self.indexOf(other) != self.indexOf(itemData) && itemData.id == other.id && itemData.edition == other.edition)) {
        console.warn("Duplicate Item: " + itemData.id + " (Edition: " + itemData.edition + ")");
      }
    })

    gameManager.monstersData().forEach((monsterData, index, self) => {
      if (self.find((other) => !monsterData.replace && !other.replace && self.indexOf(other) != self.indexOf(monsterData) && monsterData.name == other.name && monsterData.edition == other.edition)) {
        console.warn("Duplicate Monster: " + monsterData.name + " (Edition: " + monsterData.edition + ")");
      }

      // boss hints
      if (monsterData.boss && EntityValueFunction(monsterData.count) > 1) {
        console.warn("Boss count check: " + monsterData.name + " (Edition: " + monsterData.edition + ")");
      }
      let found: boolean = false;

      gameManager.scenarioData().forEach((scenarioData) => {
        if (scenarioData.monsters && scenarioData.monsters.some((name) => name.split(':')[0] == monsterData.name)) {
          found = true;
        }

        if (!found && scenarioData.rooms) {
          scenarioData.rooms.forEach((roomData) => {
            if (roomData.monster && roomData.monster.some((standee) => standee.name.split(':')[0] == monsterData.name)) {
              found = true;
            }
          })
        }
      })

      if (!found) {
        gameManager.sectionData().forEach((sectionData) => {
          if (sectionData.monsters && sectionData.monsters.find((name) => name.split(':')[0] == monsterData.name)) {
            found = true;
          }

          if (!found && sectionData.rooms) {
            sectionData.rooms.forEach((roomData) => {
              if (roomData.monster && roomData.monster.some((standee) => standee.name.split(':')[0] == monsterData.name)) {
                found = true;
              }
            })
          }
        })
      }

      if (!found) {
        console.warn("Could not find usage of '" + monsterData.name + "'", monsterData.edition);
      }

    })
  }

  loadDataLabel(value: EditionData) {
    if (!this.label.data) {
      this.label.data = {};
    }

    // default label
    if (this.settings.locale != this.defaultLocale && value.label && value.label[this.defaultLocale]) {
      this.label.data = this.merge(this.label.data, false, value.label[this.defaultLocale]);
      if (value.labelSpoiler && value.labelSpoiler[this.defaultLocale]) {
        this.label.data = this.merge(this.label.data, false, value.labelSpoiler[this.defaultLocale]);
      }
    }

    if (value.label && value.label[this.settings.locale]) {
      this.label.data = this.merge(this.label.data, true, value.label[this.settings.locale]);
    }

    if (value.labelSpoiler && value.labelSpoiler[this.settings.locale]) {
      this.label.data = this.merge(this.label.data, true, value.labelSpoiler[this.settings.locale]);
    }

    if (!this.label.data.edition) {
      this.label.data.edition = {};
    }
    if (!this.label.data.character) {
      this.label.data.character = {};
    }
    if (!this.label.data.monster) {
      this.label.data.monster = {};
    }
    if (!this.label.data.deck) {
      this.label.data.deck = {};
    }
    if (!this.label.data.ability) {
      this.label.data.ability = {};
    }
    if (!this.label.data.scenario) {
      this.label.data.scenario = {};
    }
    if (!this.label.data.partyAchievements) {
      this.label.data.partyAchievements = {};
    }
    if (!this.label.data.globalAchievements) {
      this.label.data.globalAchievements = {};
    }
    if (!this.label.data.campaignSticker) {
      this.label.data.campaignSticker = {};
    }
    if (!this.label.data.scenario.group) {
      this.label.data.scenario.group = {};
    }
    if (!this.label.data.section) {
      this.label.data.section = {};
    }
    if (!this.label.data.objective) {
      this.label.data.objective = {};
    }
    if (!this.label.data.summon) {
      this.label.data.summon = {};
    }
  }


  loadEditionLabel(value: EditionData) {
    if (!this.label.data) {
      this.label.data = {};
    }

    if (!this.label.data.edition) {
      this.label.data.edition = {};
    }

    // default label
    if (this.settings.locale != this.defaultLocale && value.label && value.label[this.defaultLocale] && value.label[this.defaultLocale].edition) {
      this.label.data.edition = this.merge(this.label.data.edition, false, value.label[this.defaultLocale].edition);
    }

    if (value.label && value.label[this.settings.locale] && value.label[this.settings.locale].edition) {
      this.label.data.edition = this.merge(this.label.data.edition, true, value.label[this.settings.locale].edition);
    }
  }

  isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  merge(target: any, overwrite: boolean, ...sources: any): any {
    if (!sources.length) {
      return target;
    }

    const result = target;

    if (this.isObject(result)) {
      const len: number = sources.length;

      for (let i = 0; i < len; i += 1) {
        const elm: any = sources[i];

        if (this.isObject(elm)) {
          for (const key in elm) {
            if (elm.hasOwnProperty(key)) {
              if (this.isObject(elm[key])) {
                if (!result[key] || !this.isObject(result[key])) {
                  result[key] = {};
                }
                this.merge(result[key], overwrite, elm[key]);
              } else {
                if (Array.isArray(result[key]) && Array.isArray(elm[key])) {
                  result[key] = Array.from(new Set(result[key].concat(elm[key])));
                } else if (overwrite || !result[key]) {
                  result[key] = elm[key];
                }
              }
            }
          }
        }
      }
    }

    return result;
  };

  getEditionByUrl(url: string) {
    if (!gameManager.editionData.some((editionData) => editionData.url == url)) {
      console.error("No edition data found for url '" + url + "'");
      return;
    }

    return gameManager.editionData.find((editionData) => editionData.url == url)?.edition;
  }

  async addEditionDataUrl(editionDataUrl: string): Promise<boolean> {
    if (this.settings.editionDataUrls.indexOf(editionDataUrl) == -1) {
      const success = await this.loadEditionData(editionDataUrl);
      if (success) {
        this.settings.editionDataUrls.push(editionDataUrl);
        gameManager.editionData.sort((a, b) => {
          return this.settings.editionDataUrls.indexOf(a.url) - this.settings.editionDataUrls.indexOf(b.url);
        });
        if (this.settings.excludeEditionDataUrls.indexOf(editionDataUrl) != -1) {
          this.settings.excludeEditionDataUrls.splice(this.settings.excludeEditionDataUrls.indexOf(editionDataUrl), 1);
        }
        this.storeSettings();
        return true;
      }
    }

    return false;
  }

  async removeEditionDataUrl(editionDataUrl: string) {
    if (this.settings.editionDataUrls.indexOf(editionDataUrl) != -1) {
      gameManager.editionData = gameManager.editionData.filter((editionData) => editionData.url != editionDataUrl);
      this.settings.editionDataUrls.splice(this.settings.editionDataUrls.indexOf(editionDataUrl), 1);
      if (this.defaultEditionDataUrls.indexOf(editionDataUrl) != -1) {
        this.settings.excludeEditionDataUrls.push(editionDataUrl);
      }
      this.storeSettings();
    }
  }

  async restoreDefaultEditionDataUrls() {
    for (let editionDataUrl of this.defaultEditionDataUrls) {
      if (this.settings.editionDataUrls.indexOf(editionDataUrl) == -1) {
        this.settings.editionDataUrls.push(editionDataUrl);
        await this.loadEditionData(editionDataUrl);
      }
    }

    this.settings.editionDataUrls.sort((a, b) => {
      if (this.defaultEditionDataUrls.indexOf(a) != -1 && this.defaultEditionDataUrls.indexOf(b) != -1) {
        return this.defaultEditionDataUrls.indexOf(a) - this.defaultEditionDataUrls.indexOf(b);
      } else if (this.defaultEditionDataUrls.indexOf(a) != -1 && this.defaultEditionDataUrls.indexOf(b) == -1) {
        return -1;
      } else if (this.defaultEditionDataUrls.indexOf(a) == -1 && this.defaultEditionDataUrls.indexOf(b) != -1) {
        return 1;
      } else {
        return this.settings.editionDataUrls.indexOf(a) - this.settings.editionDataUrls.indexOf(b);
      }
    });

    gameManager.editionData.sort((a, b) => {
      return this.settings.editionDataUrls.indexOf(a.url) - this.settings.editionDataUrls.indexOf(b.url);
    });

    this.storeSettings();
  }

  async updateLocale(locale: string) {
    // default label
    if (locale != this.defaultLocale) {
      await fetch('./assets/locales/' + this.defaultLocale + '.json')
        .then(response => {
          return response.json();
        }).then(data => {
          this.label = this.merge(this.label, false, data);
        })
        .catch((error: Error) => {
          console.error("Invalid locale: " + locale, error);
          return;
        });
    }

    await fetch('./assets/locales/' + locale + '.json')
      .then(response => {
        return response.json();
      }).then(data => {
        this.label = this.merge(this.label, true, data);
      })
      .catch((error: Error) => {
        console.error("Invalid locale: " + locale, error);
        return;
      });

    this.label.data = {};
    for (let editionData of gameManager.editionData) {
      this.loadDataLabel(editionData);
    }
    gameManager.uiChange.emit();
  }

  getLabel(key: string, args: string[] = [], argLabel: boolean = true, empty: boolean = false, path: string = "", from: any = this.label): string {
    key += '';
    if (!from) {
      return empty ? this.emptyLabel(key, args, path) : (path && key ? this.getLabel(key) : key || "");
    } else if (from[key]) {
      if (typeof from[key] === 'object') {
        if (from[key]["."]) {
          return this.insertLabelArguments(from[key]["."], args, argLabel);
        }
        return empty ? this.emptyLabel(key, args, path) : (path && key ? this.getLabel(key) : key || "");
      }
      return this.insertLabelArguments(from[key], args, argLabel);
    } else {
      if (path == "data.monster.") {
        const match = key.match(/(.+)\-(scenario|section)\-(.+)/)
        if (match) {
          key = match[1];
          return this.insertLabelArguments(from[key], args, argLabel) + ' #' + match[3];
        }
      }

      let keys = key.split(".");
      if (from[keys[0]]) {
        key = keys.slice(1, keys.length).join(".");
        return this.getLabel(key, args, argLabel, empty, path + keys[0] + ".", from[keys[0]])
      }
    }

    return empty ? this.emptyLabel(key, args, path) : (path && key ? this.getLabel(key) : key || "");
  }

  emptyLabel(key: string, args: string[], path: string): string {
    return key + (args && args.length > 0 ? (" [" + args + "]") : "");
  }

  insertLabelArguments(label: string, args: string[], argLabel: boolean) {
    if (args) {
      for (let index in args) {
        while (label.indexOf(`{${index}}`) != -1) {
          label = label.replace(`{${index}}`, argLabel ? this.getLabel(args[index]) : args[index]);
          if (args[index].indexOf(`{${index}}`) != -1) {
            console.warn("Loop for '" + label + "'", args[index]);
            break;
          }
        }
      }
    }
    return label;
  }
}

export const settingsManager: SettingsManager = new SettingsManager();