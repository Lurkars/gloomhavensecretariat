import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { EntityCondition } from 'src/app/game/model/Condition';
import { Editional } from 'src/app/game/model/Editional';
import { EntityValueFunction, EntityValueRegex } from 'src/app/game/model/Entity';

export const ghsLabelRegex = /[\"]?\%((\w+|\.|\-|\:|\%)+)\%[\"]?/;

@Pipe({
  name: 'ghsValueCalc', pure: false
})
export class GhsValueCalcPipe implements PipeTransform {

  transform(value: string | number, ...args: any[]): string | number {
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

    let L = gameManager.game.level;
    if (args.length > 0) {
      L = args[ 0 ];
    }


    if (settingsManager.settings.calculate) {
      try {
        return EntityValueFunction(value, L)
      } catch {
        console.error("Could not calculate value for: ", value);
        return value;
      }
    }

    const match = value.match(EntityValueRegex);
    if (match) {
      let func = match[ 4 ];
      const funcLabel = func && func.startsWith('%');
      if (funcLabel) {
        func = func.replace('%', '');
      }
      return funcLabel ? match[ 1 ] + ' ' + settingsManager.getLabel('game.custom.' + func) : match[ 1 ];
    }


    while (value.match(ghsLabelRegex)) {
      value = value.replace(ghsLabelRegex, (match, ...args) => {
        return settingsManager.getLabel(args[ 0 ]);
      });
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

  transform(value: string, args: string[] | undefined = undefined): string {
    return settingsManager.getLabel(value, args?.map((arg: string) => settingsManager.getLabel(arg)));
  }

}

@Pipe({
  name: 'ghsHtmlLabel', pure: false
})
export class GhsHtmlLabelPipe implements PipeTransform {


  valuePipe = new GhsValueCalcPipe();

  constructor(private sanitizer: DomSanitizer) { }

  transform(value: string, args: string[] | undefined = undefined): SafeHtml {
    if (!value) {
      return "";
    }
    return this.sanitizer.bypassSecurityTrustHtml(this.applyPlaceholder(settingsManager.getLabel(value, args)));
  }

  applyPlaceholder(value: string): string {

    while (value.match(ghsLabelRegex)) {
      value = value.replace(ghsLabelRegex, (match, ...args) => {
        const label = args[ 0 ];
        const split: string[] = label.split('.');
        const type = split[ 1 ];

        let image = '';
        if (type == "condition") {
          split.splice(0, 1);
          image = '<img  src="./assets/images/' + split.join('/') + '.svg" class="icon">';
          return '<span class="placeholder-condition">' + settingsManager.getLabel(label) + image + '</span>';
        } else if (type == "action" && split.length == 3 && !split[ 2 ].startsWith('specialTarget')) {
          split.splice(0, 1);
          image = '<img  src="./assets/images/' + split.join('/') + '.svg" class="icon">';
          return '<span class="placeholder-action">' + settingsManager.getLabel(label) + image + '</span>';
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
        } else if (type == "initiative" && split.length == 3) {
          image = '<img class="ghs-svg" src="./assets/images/initiative.svg"></span>'
          return '<span class="placeholder-initiative">' + split[ 2 ] + image + '</span>';
        }

        return settingsManager.getLabel(label.split(':')[ 0 ], label.split(':').splice(1).map((arg: string) =>
          this.applyPlaceholder(settingsManager.getLabel(arg))
        )) + image;
      });
    }

    while (value.match(EntityValueRegex)) {
      value = value.replace(EntityValueRegex, (match, ...args) => {
        if (settingsManager.settings.calculate) {
          const result = EntityValueFunction(match)
          return "" + result;
        } else {
          let func = args[ 3 ];
          const funcLabel = func && func.startsWith('%');
          if (funcLabel) {
            func = func.replace('%', '');
          }
          return funcLabel ? args[ 0 ] + ' ' + settingsManager.getLabel('game.custom.' + func) : args[ 0 ];
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

@Pipe({
  name: 'ghsRange',
  pure: false
})
export class GhsRangePipe implements PipeTransform {
  transform(items: any[], quantity: number): any {
    items.length = 0;
    for (let i = 0; i < quantity; i++) {
      items.push(i);
    }
    return items;
  }
}

@Pipe({
  name: 'ghsLimit',
  pure: false
})
export class GhsLimitPipe implements PipeTransform {
  transform(items: any[], limit: number, offset: number): any {
    return items.slice(offset, offset + limit);
  }
}  