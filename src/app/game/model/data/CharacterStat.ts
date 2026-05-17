import { ActionCardType } from 'src/app/game/model/data/Action';

export class CharacterStat {
  level: number;
  health: number;

  constructor(level: number, health: number) {
    this.level = level;
    this.health = health;
  }
}

export type CharacterSpecialActionSlotTrigger = 'turnStart' | 'turnEnd' | 'roundStart' | 'roundEnd' | 'manual' | undefined;

export class CharacterSpecialAction {
  name: string;
  level: number;
  noTag: boolean;
  expire: boolean;
  round: boolean;
  summon: boolean;
  slots: ActionCardType[] | undefined;
  slotTrigger: CharacterSpecialActionSlotTrigger;
  perk: number | undefined;

  constructor(
    name: string,
    level: number = 0,
    noTag: boolean = false,
    expire: boolean = false,
    round: boolean = false,
    summon: boolean = false,
    slots: ActionCardType[] | undefined = undefined,
    slotTrigger: CharacterSpecialActionSlotTrigger
  ) {
    this.name = name;
    this.level = level;
    this.noTag = noTag;
    this.expire = expire;
    this.round = round;
    this.summon = summon;
    this.slots = slots;
    this.slotTrigger = slotTrigger;
  }
}
