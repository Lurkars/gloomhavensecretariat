import { CharacterSpecialAction, SpecialActionCounter } from "./CharacterStat";
import { Character } from "../Character";
import { Entity } from "../Entity";

export class SpecialActionHelper {
  static getCounterValue(tags: string[], actionName: string): number | null {
    const tag = tags.find(t => t.startsWith(`${actionName}:`));
    if (!tag) {
      return null;
    }

    const parts = tag.split(':');
    if (parts.length < 2) {
      return null;
    }

    const value = parseInt(parts[1], 10);
    return isNaN(value) ? null : value;
  }

  static setCounterValue(tags: string[], actionName: string, value: number): void {
    const existingIndex = tags.findIndex(t => t.startsWith(`${actionName}:`));
    const newTag = `${actionName}:${value}`;

    if (existingIndex !== -1) {
      tags[existingIndex] = newTag;
    } else {
      tags.push(newTag);
    }
  }

  static hasCounter(action: CharacterSpecialAction): boolean {
    return action.counter !== undefined && action.counter !== null;
  }

  static getCounterConfig(action: CharacterSpecialAction): Required<SpecialActionCounter> {
    const counter = action.counter || { initial: 0 };

    return {
      initial: counter.initial,
      min: counter.min !== undefined ? counter.min : 0,
      max: counter.max !== undefined ? counter.max : Number.MAX_SAFE_INTEGER,
      decrementOnRound: counter.decrementOnRound !== undefined ? counter.decrementOnRound : false,
      removeOnZero: counter.removeOnZero !== undefined ? counter.removeOnZero : true
    };
  }

  static createCounterTag(action: CharacterSpecialAction): string {
    if (!this.hasCounter(action)) {
      throw new Error(`Special action '${action.name}' does not have counter configuration`);
    }

    const config = this.getCounterConfig(action);
    return `${action.name}:${config.initial}`;
  }

  static hasActionProtection(entity: Entity, actionName: string): boolean {
    if (!(entity instanceof Character)) {
      return false;
    }

    return entity.tags.some((tag: string) => tag === actionName || tag.startsWith(`${actionName}:`));
  }

  static decrementCounter(tags: string[], action: CharacterSpecialAction): boolean {
    const currentValue = this.getCounterValue(tags, action.name);
    if (currentValue === null) {
      return false;
    }

    const config = this.getCounterConfig(action);
    const newValue = currentValue - 1;

    if (newValue < config.min || (newValue === 0 && config.removeOnZero)) {
      const index = tags.findIndex(t => t.startsWith(`${action.name}:`));
      if (index !== -1) {
        tags.splice(index, 1);
      }
      return false;
    } else {
      this.setCounterValue(tags, action.name, newValue);
      return true;
    }
  }

  static incrementCounter(tags: string[], action: CharacterSpecialAction): boolean {
    const currentValue = this.getCounterValue(tags, action.name);
    if (currentValue === null) {
      return false;
    }

    const config = this.getCounterConfig(action);
    const newValue = currentValue + 1;

    if (newValue > config.max) {
      return false;
    }

    this.setCounterValue(tags, action.name, newValue);
    return true;
  }

  static changeCounter(tags: string[], action: CharacterSpecialAction, delta: number): number | null {
    const currentValue = this.getCounterValue(tags, action.name);
    if (currentValue === null) {
      return null;
    }

    const config = this.getCounterConfig(action);
    let newValue = currentValue + delta;

    newValue = Math.max(config.min, Math.min(config.max, newValue));

    if (newValue === 0 && config.removeOnZero || newValue < config.min) {
      const index = tags.findIndex(t => t.startsWith(`${action.name}:`));
      if (index !== -1) {
        tags.splice(index, 1);
      }
      return null;
    }

    this.setCounterValue(tags, action.name, newValue);
    return newValue;
  }
}
