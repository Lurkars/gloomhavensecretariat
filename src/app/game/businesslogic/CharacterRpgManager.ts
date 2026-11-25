import { Character } from 'src/app/game/model/Character';
import {
  RPG_ACTIVE_TALENT_ROWS,
  RPG_ANCESTRY_SKILL_ROWS,
  RPG_CLASS_SKILL_ROWS,
  RPG_FACTION_BENEFITS,
  RPG_FACTIONS,
  RPG_ITEM_ROWS,
  RPG_TALENT_ROWS,
  RpgAttribute,
  RpgFaction,
  RpgItem,
  RpgPower,
  RpgProgress
} from 'src/app/game/model/CharacterProgress';
import { Game } from 'src/app/game/model/Game';

export type RpgValue = string | number | boolean | undefined;

const RPG_TEXT_FIELDS = ['pronouns', 'playerName', 'ancestry', 'backgrounds', 'personalGoal'];
const RPG_POWER_LISTS = ['talents', 'ancestrySkills', 'classSkills'];
const RPG_FACTION_TIERS = [-1, 1, 2, 3, 4, 5];
// talents were stored as 2 active + 2 passive rows before
const LEGACY_ACTIVE_TALENT_ROWS = 2;

function rpgRows<T>(values: T[] | undefined, count: number, create: () => T): T[] {
  const list = values || [];
  return Array.from({ length: Math.max(count, list.length) }, (v, index) => Object.assign(create() as object, list[index] || {}) as T);
}

function migrateRpgTalents(talents: RpgPower[] | undefined): RpgPower[] | undefined {
  if (talents && talents.length > LEGACY_ACTIVE_TALENT_ROWS && talents.length < RPG_TALENT_ROWS) {
    talents.splice(
      LEGACY_ACTIVE_TALENT_ROWS,
      0,
      ...Array.from({ length: RPG_ACTIVE_TALENT_ROWS - LEGACY_ACTIVE_TALENT_ROWS }, () => new RpgPower())
    );
  }
  return talents;
}

function rpgIndex(value: string, length: number): boolean {
  return /^\d+$/.test(value) && +value < length;
}

function rpgFieldValid(defaults: object, field: string, value: RpgValue): boolean {
  return Object.prototype.hasOwnProperty.call(defaults, field) && typeof (defaults as Record<string, unknown>)[field] === typeof value;
}

function rpgValueValid(rpg: RpgProgress, path: string, value: RpgValue): boolean {
  const keys = typeof path === 'string' ? path.split('.') : [];
  const [key, index, field, subIndex] = keys;
  if (keys.length === 1) {
    return RPG_TEXT_FIELDS.includes(key) && typeof value === 'string';
  } else if (key === 'attributes') {
    return keys.length === 2 && Object.values(RpgAttribute).includes(index as RpgAttribute) && Number.isInteger(value);
  } else if (key === 'items') {
    return keys.length === 3 && rpgIndex(index, rpg.items.length) && rpgFieldValid(new RpgItem(), field, value);
  } else if (key === 'factions' && rpgIndex(index, rpg.factions.length)) {
    if (field === 'benefits') {
      return keys.length === 4 && rpgIndex(subIndex, RPG_FACTION_BENEFITS) && typeof value === 'string';
    } else if (field === 'tier') {
      return keys.length === 3 && RPG_FACTION_TIERS.includes(value as number);
    }
    return keys.length === 3 && field === 'name' && typeof value === 'string';
  } else if (RPG_POWER_LISTS.includes(key) && keys.length === 3) {
    const powers = rpg[key as 'talents' | 'ancestrySkills' | 'classSkills'];
    if (!rpgIndex(index, powers.length)) {
      return false;
    }
    return field === 'state' ? [undefined, '', 'expended', 'lost'].includes(value as string) : rpgFieldValid(new RpgPower(), field, value);
  }
  return false;
}

export class CharacterRpgManager {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  isRpgCharacter(character: Character): boolean {
    return character.editionRules === 'rpg';
  }

  rpgProgress(source: RpgProgress | undefined): RpgProgress {
    const rpg: RpgProgress = Object.assign(new RpgProgress(), JSON.parse(JSON.stringify(source || {})));
    rpg.attributes = rpg.attributes || {};
    rpg.items = rpgRows(rpg.items, RPG_ITEM_ROWS, () => new RpgItem());
    rpg.factions = rpgRows(rpg.factions, RPG_FACTIONS, () => new RpgFaction());
    rpg.talents = rpgRows(migrateRpgTalents(rpg.talents), RPG_TALENT_ROWS, () => new RpgPower());
    rpg.ancestrySkills = rpgRows(rpg.ancestrySkills, RPG_ANCESTRY_SKILL_ROWS, () => new RpgPower());
    rpg.classSkills = rpgRows(rpg.classSkills, RPG_CLASS_SKILL_ROWS, () => new RpgPower());
    return rpg;
  }

  canSetRpgValue(character: Character, path: string, value: RpgValue): boolean {
    return rpgValueValid(this.rpgProgress(character.progress.rpg), path, value);
  }

  setRpgValue(character: Character, path: string, value: RpgValue): boolean {
    const rpg = this.rpgProgress(character.progress.rpg);
    if (!rpgValueValid(rpg, path, value)) {
      return false;
    }
    const keys = path.split('.');
    let target = rpg as unknown as Record<string, unknown>;
    keys.slice(0, -1).forEach((key) => {
      target[key] = target[key] || [];
      target = target[key] as Record<string, unknown>;
    });
    target[keys[keys.length - 1]] = keys[keys.length - 1] === 'state' && !value ? undefined : value;
    character.progress.rpg = rpg;
    return true;
  }
}
