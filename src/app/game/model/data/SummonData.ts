export class SummonData {

  name: string;
  health: number | string;
  attack: number | string;
  movement: number | string;
  range: number | string;
  level: number | undefined;
  special: boolean;

  constructor(name: string, health: number | string,
    attack: number | string,
    movement: number | string,
    range: number | string,
    level: number,
    special: boolean) {
    this.name = name;
    this.health = health;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.level = level;
    this.special = special;
  }

}