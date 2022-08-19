import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Spoilable } from "src/app/game/model/Spoilable";

export function ghsUnit(): number {
  return +window.getComputedStyle(document.body).getPropertyValue('--ghs-width').replace(/[^\d\+]/g, '') / +window.getComputedStyle(document.body).getPropertyValue('--ghs-factor');
}

export function ghsHasSpoilers(items: Spoilable[]): boolean {
  return items.some((spoilable) => spoilable.spoiler && settingsManager.settings.spoilers.indexOf(spoilable.name) == -1);
}

export function ghsIsSpoiled(spoilable: Spoilable): boolean {
  return !spoilable.spoiler || settingsManager.settings.spoilers.indexOf('[ALL]') != -1 || settingsManager.settings.spoilers.indexOf(spoilable.name) != -1;
}

export function ghsNotSpoiled(items: Spoilable[]): Spoilable[] {
  return items.filter((spoilable) => !ghsIsSpoiled(spoilable));
}