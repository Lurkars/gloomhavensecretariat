import { gameManager } from "../businesslogic/GameManager";
import { Character } from "./Character";
import { EntityCondition } from "./Condition";

export interface Entity {
  health: number;
  level: number;
  maxHealth: number | string;
  entityConditions: EntityCondition[];
  markers: string[];
  tags: string[];
}

export const EntityExpressionRegex = /^([xCL0-9\.\+\/\-\*\(\)\=\?\:\|\s\>\<]+)$/;
export const EntityValueRegex = /\[([xCL0-9\.\+\/\-\*\(\)\=\?\:\|\s\>\<]+)(\{(.*)\})?\]/;

export function EntityValueFunction(value: string | number, L: number | undefined = undefined): number {

  if (!value) {
    return 0;
  }

  if (typeof value == 'number') {
    return value;
  }

  let expression = value;
  let func = undefined;

  const match = value.match(EntityValueRegex);

  if (match && match[0].length == value.length) {
    expression = match[1];
    func = match[3];
  }


  let C = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).length;
  if (C < 1) {
    C = 1;
  }
  if (L == undefined) {
    L = gameManager.game.level;
  }

  expression = expression.replace(/[x]/g, "*");
  expression = expression.replace(/[C]/g, "" + C);
  expression = expression.replace(/[L]/g, "" + L);

  let result = eval(expression) as number;

  if (func && func.startsWith('$')) {
    func = func.replace('$', '');
  }

  if (func) {
    switch (func) {
      case 'math.ceil':
        result = Math.ceil(result);
        break;
      case 'math.floor':
        result = Math.floor(result);
        break;
      default:
        console.error("Unknown expression: " + func + "(" + match + ")");
        break;
    }
  }
  return Math.round(result);
}