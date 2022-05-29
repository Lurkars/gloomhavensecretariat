import { Pipe, PipeTransform } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/Action';
import { CharacterEntity } from 'src/app/game/model/CharacterEntity';
import { Editional } from 'src/app/game/model/Editional';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { GameState } from 'src/app/game/model/Game';
import { Monster } from 'src/app/game/model/Monster';

@Pipe({
  name: 'ghsValueCalc', pure: false
})
export class GhsValueCalcPipe implements PipeTransform {

  transform(value: Action | string | number, ...args: any[]): string | number {
    if (typeof value === "number") {
      return value;
    }

    if (value instanceof Action) {
      const action: Action = value;
      if (gameManager.game.calculate && isNaN(+action.value)) {
        let statValue = 0;
        if (args.length > 0) {
          statValue = args[ 0 ];
        }
        if (action.valueType == ActionValueType.plus) {
          if (typeof statValue == "number") {
            return statValue + (action.value as number);
          } else {
            return (this.transform(statValue) as number) + (action.value as number);
          }
        } else if (action.valueType == ActionValueType.minus) {
          if (typeof statValue == "number") {
            return statValue - (action.value as number);
          } else {
            return (this.transform(statValue) as number) - (action.value as number);
          }
        }
      }

      if (!isNaN(+action.value)) {
        if (action.valueType == ActionValueType.plus) {
          return "+" + action.value;
        } else if (action.valueType == ActionValueType.minus) {
          return "-" + action.value;
        }
      }

      return action.value;
    }

    let L = gameManager.game.level;
    if (args.length > 0) {
      L = args[ 0 ];
    }

    if (gameManager.game.calculate) {
      try {
        return EntityValueFunction(value, L)
      } catch {
        return value;
      }
    }

    return value;
  }
}


@Pipe({
  name: 'ghsValueSign', pure: false
})
export class GhsValueSignPipe implements PipeTransform {

  transform(value: number, ...args: any[]): string {
    if (value > 0) {
      return "+" + value;
    } else {
      return "" + value;
    }
  }
}

@Pipe({
  name: 'ghsEditionFilter', pure: false
})
export class GhsEditionFilterPipe implements PipeTransform {

  transform(value: any[], ...args: any[]): any[] {
    return value.filter((value: Editional) => gameManager.game.edition == undefined || value.edition == gameManager.game.edition);
  }
}