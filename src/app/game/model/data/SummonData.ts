export class SummonsData {

  health: number | string;
  attack: number | string;
  movement: number | string;
  range: number | string;
  level: number | undefined;
  automatic: boolean;

  constructor(health: number | string,
    attack: number | string,
    movement: number | string,
    range: number | string,
    level: number,
    automatic: boolean) {
    this.health = health;
    this.attack = attack;
    this.movement = movement;
    this.range = range;
    this.level = level;
    this.automatic = automatic;
  }

}