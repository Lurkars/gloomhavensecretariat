import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Action } from 'src/app/game/model/data/Action';
import { ConditionName, EntityCondition } from 'src/app/game/model/data/Condition';
import { AdditionalIdentifier } from 'src/app/game/model/data/Identifier';
import { GameState } from 'src/app/game/model/Game';
import { evaluateExpression, UnknownVariableError } from 'src/app/game/util/ExpressionEvaluator';

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
  extraActions: Action[];
  extraActionsPersistent: Action[];
}

export type EntityCounter = { identifier: AdditionalIdentifier; total: number; killed: number };

export const EntityExpressionRegex = /^([xCL0-9\.\+\/\-\*\(\)\=\?\:\|\s\>\<]+)$/;
export const EntityValueRegex = /\[([a-zA-Z0-9\.\+\/\-\*\(\)\=\?\:\|\s\>\<\,]+)\]/;

export function EntityValueFunction(value: string | number, L: number | undefined = undefined): number {
  if (!value) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value === '-') {
    return 0;
  }

  let expression = value;
  let wasBracketed = false;

  const match = value.match(EntityValueRegex);

  if (match && match[0].length === value.length) {
    expression = match[1];
    wasBracketed = true;
  }

  if (L === undefined) {
    L = gameManager.game.level;
  }

  let result = 0;
  try {
    result = evaluateExpression(expression, {
      C: gameManager.levelManager.characterCountVariable(),
      L: L,
      P: gameManager.prosperityLevel(),
      R: gameManager.game.round + (gameManager.game.state === GameState.draw ? 1 : 0)
    });
  } catch (e) {
    if (wasBracketed && e instanceof UnknownVariableError) {
      throw e;
    }
    console.warn('Could not evaluate expression: ' + expression, e);
    return 0;
  }

  return Math.round(result);
}
