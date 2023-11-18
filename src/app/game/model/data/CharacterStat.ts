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

  constructor(name: string, level: number = 0, noTag: boolean = false) {
    this.name = name;
    this.level = level;
    this.noTag = noTag;
  }
}