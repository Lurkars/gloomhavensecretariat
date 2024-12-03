import { Pipe, PipeTransform } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { ghsDurationLabel, ghsValueSign } from './Static';
import { ScenarioCache } from 'src/app/game/model/Scenario';

@Pipe({
	standalone: false,
  name: 'ghsValueSign'
})
export class GhsValueSignPipe implements PipeTransform {

  transform(value: number, ...args: any[]): string {
    return ghsValueSign(value, args.indexOf("empty") != -1)
  }
}

@Pipe({
	standalone: false,
  name: 'ghsRange'
})
export class GhsRangePipe implements PipeTransform {
  transform(items: any[], quantity: number, reverse: boolean = false): any {
    items.length = 0;
    for (let i = 0; i < quantity; i++) {
      items.push(reverse ? quantity - i - 1 : i);
    }
    return items;
  }
}

@Pipe({
	standalone: false,
  name: 'ghsFloor'
})
export class GhsFloorPipe implements PipeTransform {
  transform(number: number): number {
    return Math.floor(number);
  }
}

@Pipe({
	standalone: false,
  name: 'ghsCeil'
})
export class GhsCeilPipe implements PipeTransform {
  transform(number: number): number {
    return Math.ceil(number);
  }
}

@Pipe({
	standalone: false,
  name: 'ghsMinZero'
})
export class GhsMinZeroPipe implements PipeTransform {
  transform(number: number): number {
    return number < 0 ? 0 : number;
  }
}

@Pipe({
	standalone: false,
  name: 'ghsDurationLabel'
})
export class GhsDurationLabelPipe implements PipeTransform {
  transform(value: number, totalHours: boolean = false): string {
    return ghsDurationLabel(value, totalHours);
  }
}


@Pipe({
	standalone: false,
  name: 'ghsScenarioSearch'
})
export class GhsScenarioSearch implements PipeTransform {
  transform(items: ScenarioCache[], search: string): ScenarioCache[] {
    return items.filter((scenarioData) => {
      if (!search || search == '') {
        return true;
      }
      search = search.toLowerCase();
      let index = scenarioData.index.toLowerCase()

      let zeros = 0;

      while (search.startsWith('0')) {
        zeros++;
        search = search.replace('0', '');
      }

      for (let i = 0; i < zeros; i++) {
        search = '0' + search;
        if (index.length < search.length) {
          index = '0' + index;
        }
      }

      if (index.includes(search)) {
        return true;
      }

      return settingsManager.getLabel(scenarioData.name).toLowerCase().includes(search)
    });
  }
}

