import { gameManager } from "../businesslogic/GameManager";
import { CharacterEntity } from "./CharacterEntity";
import { Condition } from "./Condition";
import { Figure } from "./Figure";

export interface Entity {
  health: number;
  level: number;
  maxHealth: number;
  conditions: Condition[];
  turnConditions: Condition[];
}

export function EntityValueFunction(value: string, L: number | undefined = undefined): number {
  let C = gameManager.game.figures.filter((figure: Figure) => figure instanceof CharacterEntity).length;

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