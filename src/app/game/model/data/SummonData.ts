export class SummonData {

  name: string;
  health: number | string;
  attack: number | string;
  movement: number | string;
  range: number | string;
  level: number | undefined;
  special: boolean;
  count: number = 1;

  constructor(name: string, health: number | string,
    attack: number | string,
    movement: number | string,
    range: number | string,
    level: number | undefined,
    special: boolean,
    count: number) {
    this.name = name;
    this.health = health;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.level = level;
    this.special = special;
    this.count = count;
  }

}