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
  summon: boolean;

  constructor(name: string, level: number = 0, noTag: boolean = false, expire: boolean = false, summon: boolean = false) {
    this.name = name;
    this.level = level;
    this.noTag = noTag;
    this.expire = expire;
    this.summon = summon;
  }
}