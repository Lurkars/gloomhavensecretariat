import { Pipe, PipeTransform } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { applyPlaceholder } from './i18n';
import { ghsValueSign } from './Static';

@Pipe({
  name: 'ghsValueSign'
})
export class GhsValueSignPipe implements PipeTransform {

  transform(value: number, ...args: any[]): string {
    return ghsValueSign(value, args.indexOf("empty") != -1)
  }
}

@Pipe({
  name: 'ghsLabel', pure: false
})
export class GhsLabelPipe implements PipeTransform {

  transform(value: string, args: string[] | undefined = undefined): string {

    if (!value) {
      return "";
    }

    return applyPlaceholder(settingsManager.getLabel(value, args?.map((arg) => settingsManager.getLabel(arg))));
  }

}

@Pipe({
  name: 'ghsRange'
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

