import { gameManager } from "../businesslogic/GameManager";
import { EntityCondition } from "./Condition";
import { GameState } from "./Game";
import { AdditionalIdentifier } from "./data/Identifier";

export interface Entity {
  active: boolean;
  off: boolean;
  health: number;
  level: number;
  maxHealth: number | string;
  entityConditions: EntityCondition[];
  number: number;
  markers: string[];
  tags: string[];
}

export type EntityCounter = { identifier: AdditionalIdentifier, total: number, killed: number };

export const EntityExpressionRegex = /^([xCL0-9\.\+\/\-\*\(\)\=\?\:\|\s\>\<]+)$/;
export const EntityValueRegex = /\[([xCL0-9\.\+\/\-\*\(\)\=\?\:\|\s\>\<]+)(\{(.*)\})?\]/;
export const EntityValueRegexExtended = /\[([a-zA-Z0-9\.\+\/\-\*\(\)\=\?\:\|\s\>\<]+)(\{(.*)\})?\]/;

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

  if (L == undefined) {
    L = gameManager.game.level;
  }

  expression = expression.replace(/[x]/g, "*");
  expression = expression.replace(/[C]/g, "" + Math.max(2, gameManager.characterManager.characterCount()));
  expression = expression.replace(/[L]/g, "" + L);
  expression = expression.replace(/[R]/g, "" + (gameManager.game.round + (gameManager.game.state == GameState.draw ? 1 : 0)));

  let result = 0;
  try {
    result = eval(expression) as number;
  } catch (e) {
    console.warn("Could not evaluate expression: " + expression, e);
    return 0;
  }

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