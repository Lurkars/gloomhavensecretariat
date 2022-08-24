import { EditionData } from "../model/data/EditionData";
import { Settings } from "../model/Settings";
import { Spoilable } from "../model/Spoilable";
import { gameManager } from "./GameManager";

export class SettingsManager {

  defaultLocale: string = 'en';
  defaultEditionDataUrls: string[] = [ "./assets/data/gh.json", "./assets/data/jotl.json", "./assets/data/fc.json", "./assets/data/fh.json", "./assets/data/cs.json" ];

  settings: Settings = new Settings();
  label: any = {};
  locales: string[] = [ "en", "de" ];

  constructor() {
    this.loadSettings();
  }

  reset() {
    localStorage.removeItem("ghs-settings")
    this.loadSettings();
  }

  async loadSettings() {
    const settingsString: string | null = localStorage.getItem("ghs-settings");
    if (settingsString != null) {
      this.settings = Object.assign(new Settings(), JSON.parse(settingsString));
    } else {
      try {
        await fetch('./ghs-settings-default.json')
          .then(response => {
            if (!response.ok) {
              throw Error();
            }
            return response.json();
          }).then((value: Settings) => {
            this.settings = Object.assign(new Settings(), value);
          });
      } catch (error) {
        this.settings = new Settings();
      }
    }

    this.setLocale(this.settings.locale);
    this.sortSpoilers();
  }

  async init() {
    for (let defaultEditionDataUrl of this.defaultEditionDataUrls) {
      if (settingsManager.settings.editionDataUrls.indexOf(defaultEditionDataUrl) == -1 && settingsManager.settings.excludeEditionDataUrls.indexOf(defaultEditionDataUrl) == -1) {
        settingsManager.settings.editionDataUrls.push(defaultEditionDataUrl);
      }
    }

    for (let editionDataUrl of settingsManager.settings.editionDataUrls) {
      await settingsManager.loadEditionData(editionDataUrl);
    }
  }

  storeSettings(): void {
    localStorage.setItem("ghs-settings", JSON.stringify(this.settings));
    if (this.settings.serverSettings) {
      gameManager.stateManager.saveSettings();
    }
    gameManager.uiChange.emit();
  }

  setCalculate(calculate: boolean) {
    this.settings.calculate = calculate;
    this.storeSettings();
  }

  setCalculateStats(calculateStats: boolean) {
    this.settings.calculateStats = calculateStats;
    this.storeSettings();
  }

  setAbilityNumbers(abilityNumbers: boolean) {
    this.settings.abilityNumbers = abilityNumbers;
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

  setApplyConditions(applyConditions: boolean) {
    this.settings.applyConditions = applyConditions;
    this.storeSettings();
  }

  setMoveElements(moveElements: boolean) {
    this.settings.moveElements = moveElements;
    this.storeSettings();
  }

  setHideStats(hideStats: boolean) {
    this.settings.hideStats = hideStats;
    this.storeSettings();
  }

  setRandomStandees(randomStandees: boolean) {
    this.settings.randomStandees = randomStandees;
    this.storeSettings();
  }

  setActiveStandees(activeStandees: boolean) {
    this.settings.activeStandees = activeStandees;
    this.storeSettings();
  }

  setInitiativeRequired(initiativeRequired: boolean) {
    this.settings.initiativeRequired = initiativeRequired;
    this.storeSettings();
  }

  setLevelCalculation(levelCalculation: boolean) {
    this.settings.levelCalculation = levelCalculation;
    this.storeSettings();
  }

  setLevelAdjustment(levelAdjustment: number) {
    this.settings.levelAdjustment = levelAdjustment;
    this.storeSettings();
  }

  setBonusAdjustment(bonusAdjustment: number) {
    this.settings.bonusAdjustment = bonusAdjustment;
    this.storeSettings();
  }

  setGe5Player(ge5Player: boolean) {
    this.settings.ge5Player = ge5Player;
    this.storeSettings();
  }

  setDisableStandees(disableStandees: boolean) {
    this.settings.disableStandees = disableStandees;
    this.storeSettings();
  }

  setDragInitiative(dragInitiative: boolean) {
    this.settings.dragInitiative = dragInitiative;
    this.storeSettings();
  }

  setDragHealth(dragHealth: boolean) {
    this.settings.dragHealth = dragHealth;
    this.storeSettings();
  }

  setFullscreen(fullscreen: boolean) {
    this.settings.fullscreen = fullscreen;
    this.storeSettings();
  }

  setDisableColumns(disableColumns: boolean) {
    this.settings.disableColumns = disableColumns;
    this.storeSettings();
  }

  setAutoscroll(autoscroll: boolean) {
    this.settings.autoscroll = autoscroll;
    this.storeSettings();
  }

  setHints(hints: boolean) {
    this.settings.hints = hints;
    this.storeSettings();
  }

  setBrowserNavigation(browserNavigation: boolean) {
    this.settings.browserNavigation = browserNavigation;
    this.storeSettings();
  }

  setZoom(zoom: number) {
    this.settings.zoom = zoom;
    this.storeSettings();
  }

  setBarSize(barSize: number) {
    this.settings.barSize = barSize;
    this.storeSettings();
  }

  setServerAutoconnect(autoconnect: boolean) {
    this.settings.serverAutoconnect = autoconnect;
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

  setServer(url: string, port: number, password: string): void {
    this.settings.serverUrl = url;
    this.settings.serverPort = port;
    this.settings.serverPassword = password;
    this.storeSettings();
  }

  setMaxUndo(maxUndo: number) {
    this.settings.maxUndo = maxUndo;
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

  async loadEditionData(url: string) {
    try {
      await fetch(url)
        .then(response => {
          if (!response.ok) {
            console.error("Invalid data url: " + url + " [" + response.statusText + "]");
            return;
          }
          return response.json();
        }).then((value: EditionData) => {
          if (gameManager.editions().indexOf(value.edition) != -1) {
            console.error("Edition already exists: " + value.edition);
            return;
          }

          value.url = url;
          gameManager.editionData.push(value);
          this.loadDataLabel(value);
        });
    } catch (error) {
      console.error("Invalid data url: " + url + " [" + error + "]");
    }
  }

  loadDataLabel(value: EditionData) {
    if (!this.label.data) {
      this.label.data = {};
    }

    // default label
    if (this.settings.locale != this.defaultLocale && value.label && value.label[ this.defaultLocale ]) {
      this.label.data = this.merge(this.label.data, value.label[ this.defaultLocale ]);
    }

    if (value.label && value.label[ this.settings.locale ]) {
      this.label.data = this.merge(this.label.data, value.label[ this.settings.locale ]);
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

  isObject(item: any): boolean {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  merge(target: any, ...sources: any): any {
    if (!sources.length) {
      return target;
    }

    const result = target;

    if (this.isObject(result)) {
      const len: number = sources.length;

      for (let i = 0; i < len; i += 1) {
        const elm: any = sources[ i ];

        if (this.isObject(elm)) {
          for (const key in elm) {
            if (elm.hasOwnProperty(key)) {
              if (this.isObject(elm[ key ])) {
                if (!result[ key ] || !this.isObject(result[ key ])) {
                  result[ key ] = {};
                }
                this.merge(result[ key ], elm[ key ]);
              } else {
                if (Array.isArray(result[ key ]) && Array.isArray(elm[ key ])) {
                  result[ key ] = Array.from(new Set(result[ key ].concat(elm[ key ])));
                } else {
                  result[ key ] = elm[ key ];
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

  async addEditionDataUrl(editionDataUrl: string) {
    if (this.settings.editionDataUrls.indexOf(editionDataUrl) == -1) {
      await this.loadEditionData(editionDataUrl);
      this.settings.editionDataUrls.push(editionDataUrl);
      if (this.settings.excludeEditionDataUrls.indexOf(editionDataUrl) != -1) {
        this.settings.excludeEditionDataUrls.splice(this.settings.excludeEditionDataUrls.indexOf(editionDataUrl), 1);
      }
      this.storeSettings();
    }
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

    this.storeSettings();
  }

  async setLocale(locale: string) {
    // default label
    if (locale != this.defaultLocale) {
      await fetch('./assets/locales/' + this.defaultLocale + '.json')
        .then(response => {
          return response.json();
        }).then(data => {
          this.label = this.merge(this.label, data);
        })
        .catch((error: Error) => {
          console.error("Invalid locale: " + locale, error);
          return;
        });
    }

    await fetch('./assets/locales/' + locale + '.json')
      .then(response => {
        this.settings.locale = locale;
        return response.json();
      }).then(data => {
        this.label = this.merge(this.label, data);
        this.storeSettings();
      })
      .catch((error: Error) => {
        console.error("Invalid locale: " + locale, error);
        return;
      });

    for (let editionData of gameManager.editionData) {
      this.loadDataLabel(editionData);
    }
  }

  getLabel(key: string, args: string[] = [], from: any = this.label, path: string = "", empty: boolean = false): string {
    key += '';
    if (!from) {
      return empty ? this.emptyLabel(key, args, path) : (path && key ? this.getLabel(key) : key || "");
    } else if (from[ key ]) {
      if (typeof from[ key ] === 'object') {
        if (from[ key ][ "." ]) {
          return this.insertLabelArguments(from[ key ][ "." ], args);
        }
        return empty ? this.emptyLabel(key, args, path) : (path && key ? this.getLabel(key) : key || "");
      }
      return this.insertLabelArguments(from[ key ], args);
    } else {
      let keys = key.split(".");
      if (from[ keys[ 0 ] ]) {
        key = keys.slice(1, keys.length).join(".");
        return this.getLabel(key, args, from[ keys[ 0 ] ], path + keys[ 0 ] + ".", empty)
      }
    }

    return empty ? this.emptyLabel(key, args, path) : (path && key ? this.getLabel(key) : key || "");
  }

  emptyLabel(key: string, args: string[], path: string): string {
    return (path ? path + (path.endsWith(".") ? "" : ".") : "") + key + (args && args.length > 0 ? (" [" + args + "]") : "");
  }

  insertLabelArguments(label: string, args: string[]) {
    if (args) {
      for (let index in args) {
        while (label.indexOf(`{${index}}`) != -1) {
          label = label.replace(`{${index}}`, this.getLabel(args[ index ]));
        }
      }
    }
    return label;
  }
}

export const settingsManager: SettingsManager = new SettingsManager();