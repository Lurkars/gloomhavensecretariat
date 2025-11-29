export class CharacterStat {
  level: number;
  health: number;

  constructor(level: number, health: number) {
    this.level = level;
    this.health = health;
  }
}

export interface SpecialActionCounter {
  initial: number;
  min?: number;
  max?: number;
  decrementOnRound?: boolean;
  removeOnZero?: boolean;
}

export class CharacterSpecialAction {
  name: string;
  level: number;
  noTag: boolean;
  expire: boolean;
  round: boolean;
  summon: boolean;
  perk: number | undefined;
  counter?: SpecialActionCounter;

  constructor(name: string, level: number = 0, noTag: boolean = false, expire: boolean = false, round: boolean = false, summon: boolean = false, counter?: SpecialActionCounter) {
    this.name = name;
    this.level = level;
    this.noTag = noTag;
    this.expire = expire;
    this.round = round;
    this.summon = summon;
    this.counter = counter;
  }
}
