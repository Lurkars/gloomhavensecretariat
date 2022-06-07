import { Pipe, PipeTransform } from '@angular/core';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionValueType } from 'src/app/game/model/Action';
import { Editional } from 'src/app/game/model/Editional';
import { EntityValueFunction } from 'src/app/game/model/Entity';

@Pipe({
  name: 'ghsValueCalc', pure: false
})
export class GhsValueCalcPipe implements PipeTransform {

  transform(value: Action | string | number, ...args: any[]): string | number {
    if (typeof value === "number") {
      if (args.indexOf("empty") != -1 && value == 0) {
        return "-";
      }

      return value;
    }

    if (value instanceof Action) {
      const action: Action = value;
      if (settingsManager.settings.calculate && isNaN(+action.value)) {
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

    if (settingsManager.settings.calculate) {
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
    } else if (args.indexOf("empty") != -1 && value == 0) {
      return "-";
    } else {
      return "" + value;
    }
  }
}

@Pipe({
  name: 'ghsEditionFilter', pure: false
})
export class GhsEditionFilterPipe implements PipeTransform {

  transform(value: any[], ...args: string[]): any[] {
    if (args.length > 0) {
      return value.filter((value: Editional) => value.edition == args[ 0 ]);
    }
    return value.filter((value: Editional) => gameManager.game.edition == undefined || value.edition == gameManager.game.edition);
  }
}

@Pipe({
  name: 'ghsLabel', pure: false
})
export class GhsLabelPipe implements PipeTransform {

  transform(value: string, ...args: string[]): string {
    return settingsManager.getLabel(value, args);
  }

}



@Pipe({
  name: 'ghsSort', pure: false
})
export class GhsSortPipe implements PipeTransform {

  transform(value: any[], ...args: string[]): any[] {
    return value.sort((a: any, b: any) => {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    })
  }
}