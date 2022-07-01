import { gameManager } from "../businesslogic/GameManager";
import { Character } from "./Character";
import { Condition } from "./Condition";
import { Figure } from "./Figure";

export interface Entity {
  health: number;
  level: number;
  maxHealth: number | string;
  conditions: Condition[];
  turnConditions: Condition[];
  expiredConditions: Condition[];
  markers: string[];
}

export function EntityValueFunction(value: string, L: number | undefined = undefined): number {
  let C = gameManager.game.figures.filter((figure: Figure) => figure instanceof Character).length;

  if (C < 1) {
    C = 1;
  }
  if (L == undefined) {
    L = gameManager.game.level;
  }

  value = value.replace(/[x]/g, "*");
  value = value.replace(/[C]/g, "" + C);
  value = value.replace(/[L]/g, "" + L);
  const result = eval(value)
  return result as number;
}