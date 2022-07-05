import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionValueType } from 'src/app/game/model/Action';
import { EntityCondition } from 'src/app/game/model/Condition';
import { Editional } from 'src/app/game/model/Editional';
import { EntityValueFunction } from 'src/app/game/model/Entity';

@Pipe({
  name: 'ghsValueCalc', pure: false
})
export class GhsValueCalcPipe implements PipeTransform {

  transform(value: Action | string | number, ...args: any[]): string | number {
    const empty: boolean = args.indexOf("empty") != -1;
    if (typeof value === "number") {
      if (empty && value == 0) {
        return "-";
      }

      return value;
    }

    if (!value) {
      return "-";
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
  name: 'ghsActiveConditions', pure: false
})
export class GhsActiveConditionsPipe implements PipeTransform {

  transform(value: EntityCondition[], ...args: string[]): any[] {
    return value.filter((value: EntityCondition) => !value.expired);
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
  name: 'ghsHtmlLabel', pure: false
})
export class GhsHtmlLabelPipe implements PipeTransform {


  valuePipe = new GhsValueCalcPipe();

  constructor(private sanitizer: DomSanitizer) { }

  transform(value: string, ...args: string[]): SafeHtml {
    if (!value) {
      return "";
    }
    return this.sanitizer.bypassSecurityTrustHtml(this.applyPlaceholder(settingsManager.getLabel(value, args)));
  }

  applyPlaceholder(value: string): string {

    const labelRegex = /\%((\w+|\.|\-)+)\%/;

    while (value.match(labelRegex)) {
      value = value.replace(labelRegex, (match, ...args) => {
        const label = args[ 0 ];
        const split: string[] = label.split('.');
        const type = split[ 1 ];

        let image = '';
        if (type == "condition" || type == "action" && split.length == 3) {
          split.splice(0, 1);
          image = '<img  src="./assets/images/' + split.join('/') + '.svg" class="icon">';
          return '<span class="placeholder-condition">' + settingsManager.getLabel(label) + '</span>' + image;
        } else if (type == "element") {
          let element = split[ 2 ];
          if (element == "consume") {
            image = '<span class="element inline consume">';
            element = split[ 3 ];
          } else {
            image = '<span class="element inline">';
          }
          image += '<img src="./assets/images/element/' + element + '.svg"></span>';
          return image;
        }

        return settingsManager.getLabel(label) + image;
      });
    }

    const calcRegex = /\[(([a-zA-Z0-9\+\/\-\*])+)(\{(.*)\})?\]/;

    while (value.match(calcRegex)) {
      value = value.replace(calcRegex, (match, ...args) => {
        const expression = args[ 0 ];
        let func = args[ 3 ];
        const funcLabel = func && func.startsWith('%');
        if (funcLabel) {
          func = func.replace('%', '');
        }
        if (settingsManager.settings.calculate) {
          let result = this.valuePipe.transform(expression) as number;
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
          return "" + result;
        } else {
          return funcLabel ? expression + ' ' + settingsManager.getLabel('game.custom.' + func) : expression;
        }
      });
    }

    return value;
  }

}

@Pipe({
  name: 'ghsSort', pure: false
})
export class GhsSortPipe implements PipeTransform {

  transform(value: any[], ...args: string[]): any[] {
    return value.sort((a: any, b: any) => {
      if (a.spoiler && !b.spoiler) {
        return 1;
      }
      if (!a.spoiler && b.spoiler) {
        return -1;
      }
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