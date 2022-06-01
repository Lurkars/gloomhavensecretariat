import { Settings } from "../model/Settings";

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
      this.settings = JSON.parse(settingsString);
    } else {
      this.settings = new Settings;
    }

    this.setLocale(this.settings.locale);

    return this.settings;
  }

  storeSettings(): void {
    localStorage.setItem("ghs-settings", JSON.stringify(this.settings));
  }

  setCalculate(calculate: boolean) {
    this.settings.calculate = calculate;
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

  setLocale(locale: string) {
    fetch('./assets/locales/' + locale + '.json')
      .then(response => {
        this.settings.locale = locale;
        this.storeSettings();
        return response.json();
      }).then(data => {
        this.label = data;
      })
      .catch((error: Error) => {
        throw Error("Invalid locale: " + locale);
      })
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