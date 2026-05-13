export class CharacterStat {
  level: number;
  health: number;

  constructor(level: number, health: number) {
    this.level = level;
    this.health = health;
  }
}

export class CharacterSpecialAction {
  name: string;
  level: number;
  noTag: boolean;
  expire: boolean;
  round: boolean;
  summon: boolean;
  slots: number | undefined;
  perk: number | undefined;

  constructor(
    name: string,
    level: number = 0,
    noTag: boolean = false,
    expire: boolean = false,
    round: boolean = false,
    summon: boolean = false,
    slots: number | undefined = undefined
  ) {
    this.name = name;
    this.level = level;
    this.noTag = noTag;
    this.expire = expire;
    this.round = round;
    this.summon = summon;
    this.slots = slots;
  }
}
