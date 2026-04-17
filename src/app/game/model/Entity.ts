import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Action } from 'src/app/game/model/data/Action';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { GameState } from 'src/app/game/model/Game';
import { evaluateExpression } from 'src/app/game/util/ExpressionEvaluator';

export interface Entity {
  active: boolean;
  off: boolean;
  health: number;
  level: number;
  maxHealth: number | string;
  entityConditions: EntityCondition[];
  immunities: ConditionName[];
  number: number;
  markers: string[];
  tags: string[];
  shield: Action | undefined;
  shieldPersistent: Action | undefined;
  retaliate: Action[];
  retaliatePersistent: Action[];
}

export type EntityCounter = { identifier: AdditionalIdentifier; total: number; killed: number };

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

  if (value == '-') {
    return 0;
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

  let result = 0;
  try {
    result = evaluateExpression(expression, {
      C: Math.max(2, gameManager.characterManager.characterCount()),
      L: L,
      P: gameManager.prosperityLevel(),
      R: gameManager.game.round + (gameManager.game.state == GameState.draw ? 1 : 0)
    });
  } catch (e) {
    console.warn('Could not evaluate expression: ' + expression, e);
    return 0;
  }

  let funcValue: number | undefined;
  if (func && func.startsWith('$')) {
    func = func.replace('$', '');
    if (func.includes(':')) {
      funcValue = +func.split(':')[1];
      func = func.split(':')[0];
    }
  }

  if (func) {
    switch (true) {
      case func == 'math.ceil':
        result = Math.ceil(result);
        break;
      case func == 'math.floor':
        result = Math.floor(result);
        break;
      case func == 'math.max' && funcValue != undefined:
        result = Math.min(result, funcValue);
        break;
      case func == 'math.maxCeil' && funcValue != undefined:
        result = Math.ceil(Math.min(result, funcValue));
        break;
      case func == 'math.maxFloor' && funcValue != undefined:
        result = Math.floor(Math.min(result, funcValue));
        break;
      case func == 'math.min' && funcValue != undefined:
        result = Math.max(result, funcValue);
        break;
      case func == 'math.minCeil' && funcValue != undefined:
        result = Math.ceil(Math.max(result, funcValue));
        break;
      case func == 'math.minFloor' && funcValue != undefined:
        result = Math.floor(Math.max(result, funcValue));
        break;
      default:
        console.error('Unknown expression: ' + func + '(' + match + ')');
        break;
    }
  }
  return Math.round(result);
}
