import { CharacterData } from "../model/data/CharacterData";
import { DeckData } from "../model/data/DeckData";
import { EditionData } from "../model/data/EditionData";
import { MonsterData } from "../model/data/MonsterData";
import { ScenarioData } from "../model/data/ScenarioData";
import { Settings } from "../model/Settings";
import { Spoilable } from "../model/Spoilable";
import { gameManager } from "./GameManager";

export class SettingsManager {

  settings: Settings;
  label: any = {};
  locales: string[] = [ "en", "de" ];

  constructor() {
    this.settings = this.loadSettings();
  }

  reset() {
    localStorage.removeItem("ghs-settings")
    this.settings = new Settings();
  }

  loadSettings(): Settings {
    const settingsString: string | null = localStorage.getItem("ghs-settings");
    if (settingsString != null) {
      this.settings = Object.assign(new Settings(), JSON.parse(settingsString));
    } else {
      this.settings = new Settings();
    }

    this.setLocale(this.settings.locale);
    this.sortSpoilers();
    return this.settings;
  }

  async init() {
    for (let editionDataUrl of settingsManager.settings.editionDataUrls) {
      await settingsManager.loadEditionData(editionDataUrl);
    }
  }

  storeSettings(): void {
    localStorage.setItem("ghs-settings", JSON.stringify(this.settings));
  }

  setCalculate(calculate: boolean) {
    this.settings.calculate = calculate;
    this.storeSettings();
  }

  setFullscreen(fullscreen: boolean) {
    this.settings.fullscreen = fullscreen;
    this.storeSettings();
  }

  setZoom(zoom: number) {
    this.settings.zoom = zoom;
    this.storeSettings();
  }

  setColumns(columns: number) {
    this.settings.columns = columns;
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
    gameManager.editions = [];
    gameManager.charactersData = [];
    gameManager.monstersData = [];
    gameManager.decksData = [];
    gameManager.scenarioData = [];
  }

  async loadEditionData(url: string) {
    try {
      await fetch(url)
        .then(response => {
          if (!response.ok) {
            throw Error("Invalid data url: " + url + " [" + response.statusText + "]");
          }
          return response.json();
        }).then((value: EditionData) => {
          if (gameManager.editions.indexOf(value.edition) != -1) {
            throw Error("Edition already exists: " + value.edition);
          }

          gameManager.editions.push(value.edition);
          gameManager.charactersData = gameManager.charactersData.concat(value.characters);
          gameManager.monstersData = gameManager.monstersData.concat(value.monsters);
          gameManager.decksData = gameManager.decksData.concat(value.decks);
          gameManager.scenarioData = gameManager.scenarioData.concat(value.scenarios);

          this.loadDataLabel(value);
        });
    } catch (error) {
      throw Error("Invalid data url: " + url + " [" + error + "]");
    }
  }

  async loadEditionLabelData(url: string) {
    try {
      await fetch(url)
        .then(response => {
          if (!response.ok) {
            throw Error("Invalid data url: " + url + " [" + response.statusText + "]");
          }
          return response.json();
        }).then((value: EditionData) => {
          this.loadDataLabel(value);
        });
    } catch (error) {
      throw Error("Invalid data url: " + url + " [" + error + "]");
    }
  }

  loadDataLabel(value: EditionData) {
    if (!this.label.data) {
      this.label.data = {};
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
    if (!this.label.data.scenario) {
      this.label.data.scenario = {};
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

  async unloadEditionData(url: string) {
    await fetch(url)
      .then(response => {
        return response.json();
      }).then((value: EditionData) => {
        if (gameManager.editions.indexOf(value.edition) == -1) {
          throw Error("Edition not found: " + value.edition);
        }

        gameManager.editions.splice(gameManager.editions.indexOf(value.edition), 1);
        gameManager.charactersData = gameManager.charactersData.filter((characterData: CharacterData) => value.characters.indexOf(characterData) == -1);
        gameManager.monstersData = gameManager.monstersData.filter((monstersData: MonsterData) => value.monsters.indexOf(monstersData) == -1);
        gameManager.decksData = gameManager.decksData.filter((decksData: DeckData) => value.decks.indexOf(decksData) == -1);
        gameManager.scenarioData = gameManager.scenarioData.filter((scenarioData: ScenarioData) => value.scenarios.indexOf(scenarioData) == -1);
      })
      .catch((error: Error) => {
        throw Error("Invalid data url: " + url + " [" + error + "]");
      })
  }

  async addEditionDataUrl(editionDataUrl: string) {
    if (this.settings.editionDataUrls.indexOf(editionDataUrl) == -1) {
      await this.loadEditionData(editionDataUrl);
      this.settings.editionDataUrls.push(editionDataUrl);
      this.storeSettings();
    }
  }

  async removeEditionDataUrl(editionDataUrl: string) {
    if (this.settings.editionDataUrls.indexOf(editionDataUrl) != -1) {
      await this.unloadEditionData(editionDataUrl);
      this.settings.editionDataUrls.splice(this.settings.editionDataUrls.indexOf(editionDataUrl), 1);
      this.storeSettings();
    }
  }

  async restoreDefaultEditionDataUrls() {
    this.settings.editionDataUrls = new Settings().editionDataUrls;
    this.cleanEditionData();
    for (let editionDataUrl of this.settings.editionDataUrls) {
      await this.loadEditionData(editionDataUrl);
    }

    this.storeSettings();
  }

  async setLocale(locale: string) {
    await fetch('./assets/locales/' + locale + '.json')
      .then(response => {
        this.settings.locale = locale;
        this.storeSettings();
        return response.json();
      }).then(data => {
        this.label = Object.assign(this.label, data);
      })
      .catch((error: Error) => {
        throw Error("Invalid locale: " + locale);
      });

    for (let editionDataUrl of this.settings.editionDataUrls) {
      await this.loadEditionLabelData(editionDataUrl);
    }
  }

  getLabel(key: string, args: string[] = [], from: any = this.label, path: string = "", empty: boolean = false): string {
    key += '';
    if (!from) {
      return empty ? this.emptyLabel(key, args, path) : (key || "");
    } else if (from[ key ]) {
      if (typeof from[ key ] === 'object') {
        if (from[ key ][ "." ]) {
          return this.insertLabelArguments(from[ key ][ "." ], args);
        }
        return empty ? this.emptyLabel(key, args, path) : (key || "");
      }
      return this.insertLabelArguments(from[ key ], args);
    } else {
      let keys = key.split(".");
      if (from[ keys[ 0 ] ]) {
        key = keys.slice(1, keys.length).join(".");
        return this.getLabel(key, args, from[ keys[ 0 ] ], path + keys[ 0 ] + ".", empty)
      }
    }

    return empty ? this.emptyLabel(key, args, path) : (key || "");
  }

  emptyLabel(key: string, args: string[], path: string): string {
    return (path ? path + (path.endsWith(".") ? "" : ".") : "") + key + (args && args.length > 0 ? (" [" + args + "]") : "");
  }

  insertLabelArguments(label: string, args: string[]) {
    if (args) {
      for (let index in args) {
        label = label.replace(`{${index}}`, this.getLabel(args[ index ]));
      }
    }
    return label;
  }

}

export const settingsManager: SettingsManager = new SettingsManager();