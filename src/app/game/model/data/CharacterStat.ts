import { ConditionName } from "./Condition";

export class CharacterStat {
  level: number;
  health: number;
  permanentConditions: ConditionName[] = [];

  constructor(level: number, health: number) {
    this.level = level;
    this.health = health;
  }
}