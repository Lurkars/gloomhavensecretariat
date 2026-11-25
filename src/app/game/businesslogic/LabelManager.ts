import { settingsManager } from 'src/app/game/businesslogic/Managers';
import { EditionData } from 'src/app/game/model/data/EditionData';

export class LabelManager {
  label: any = {};

  loadDataLabel(value: EditionData) {
    if (!this.label.data) {
      this.label.data = {};
    }

    if (value.label && value.label[settingsManager.settings.locale]) {
      this.label.data = this.merge(this.label.data, true, value.label[settingsManager.settings.locale]);
    }

    if (value.labelSpoiler && value.labelSpoiler[settingsManager.settings.locale]) {
      this.label.data = this.merge(this.label.data, true, value.labelSpoiler[settingsManager.settings.locale]);
    }

    if (value.labelEvents && value.labelEvents[settingsManager.settings.locale]) {
      this.label.data = this.merge(this.label.data, true, value.labelEvents[settingsManager.settings.locale]);
    }

    // default label
    if (settingsManager.settings.locale !== settingsManager.defaultLocale && value.label && value.label[settingsManager.defaultLocale]) {
      this.label.data = this.merge(this.label.data, false, value.label[settingsManager.defaultLocale]);
      if (value.labelSpoiler && value.labelSpoiler[settingsManager.defaultLocale]) {
        this.label.data = this.merge(this.label.data, false, value.labelSpoiler[settingsManager.defaultLocale]);
      }
      if (value.labelEvents && value.labelEvents[settingsManager.defaultLocale]) {
        this.label.data = this.merge(this.label.data, false, value.labelEvents[settingsManager.defaultLocale]);
      }
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
    if (!this.label.data.battleGoals) {
      this.label.data.battleGoals = {};
    }
    if (!this.label.data.personalQuest) {
      this.label.data.personalQuest = {};
    }
    if (!this.label.data.items) {
      this.label.data.items = {};
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
    if (
      settingsManager.settings.locale !== settingsManager.defaultLocale &&
      value.label &&
      value.label[settingsManager.defaultLocale] &&
      value.label[settingsManager.defaultLocale].edition
    ) {
      this.label.data.edition = this.merge(this.label.data.edition, false, value.label[settingsManager.defaultLocale].edition);
    }

    if (value.label && value.label[settingsManager.settings.locale] && value.label[settingsManager.settings.locale].edition) {
      this.label.data.edition = this.merge(this.label.data.edition, true, value.label[settingsManager.settings.locale].edition);
    }
  }

  isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  merge(target: any, overwrite: boolean, ...sources: any): any {
    if (!sources.length) {
      return target;
    }

    const result = target;

    if (this.isObject(result)) {
      for (let i = 0; i < sources.length; i += 1) {
        const elm: any = sources[i];

        if (this.isObject(elm)) {
          for (const key in elm) {
            if (elm.hasOwnProperty(key)) {
              if (this.isObject(elm[key])) {
                if (!result[key]) {
                  result[key] = {};
                } else if (!this.isObject(result[key])) {
                  result[key] = { '': result[key] };
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
  }

  getLabel(
    key: string,
    args: string[] = [],
    argLabel: boolean = true,
    empty: boolean = false,
    path: string = '',
    from: any = this.label
  ): string {
    key += '';
    if (!from) {
      return empty ? this.emptyLabel(key, args) : path && key ? this.getLabel(key) : key || '';
    } else if (from[key]) {
      if (typeof from[key] === 'object') {
        if (from[key]['']) {
          return this.insertLabelArguments(from[key][''], args, argLabel);
        }
        return empty ? this.emptyLabel(key, args) : path && key ? this.getLabel(key) : key || '';
      }
      return this.insertLabelArguments(from[key], args, argLabel);
    } else {
      if (path === 'data.monster.') {
        const match = key.match(/(.+)\-(scenario|section)\-(.+)/);
        if (match) {
          key = match[1];
          return this.insertLabelArguments(from[key], args, argLabel) + ' #' + match[3];
        }
      }

      const keys = key.split('.');
      if (from[keys[0]]) {
        key = keys.slice(1, keys.length).join('.');
        return this.getLabel(key, args, argLabel, empty, path + keys[0] + '.', from[keys[0]]);
      }
    }

    return empty ? this.emptyLabel(key, args) : path && key ? this.getLabel(key) : key || '';
  }

  emptyLabel(key: string, args: string[]): string {
    return key + (args && args.length > 0 ? ' &#91;' + args + '&#93;' : '');
  }

  labelExists(key: string, includeObject: boolean = false, from: any = this.label): boolean {
    if (!!from[key]) {
      return includeObject || typeof from[key] === 'string' || (typeof from[key] === 'object' && from[key]['']);
    }
    const keys = key.split('.');
    if (keys.length && !!from[keys[0]]) {
      return this.labelExists(keys.slice(1, keys.length).join('.'), includeObject, from[keys[0]]);
    }
    return false;
  }

  insertLabelArguments(label: string, args: string[], argLabel: boolean) {
    if (args) {
      for (const index in args) {
        while (label.includes(`{${index}}`)) {
          label = label.replace(`{${index}}`, argLabel ? this.getLabel(args[index]) : args[index]);
          if (args[index].includes(`{${index}}`)) {
            console.warn("Loop for '" + label + "'", args[index]);
            break;
          }
        }
      }
    }
    return label;
  }
}
