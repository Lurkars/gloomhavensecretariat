import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { EntityExpressionRegex, EntityValueFunction, EntityValueRegex } from "src/app/game/model/Entity";
import { ghsLabelRegex } from "./label";


export function valueCalc(value: string | number, level: number | undefined = undefined, empty: boolean = false): string | number {

  if (typeof value === "number") {
    if (empty && value == 0) {
      return "-";
    }

    return value;
  }

  if (typeof value === "string" && value == '0') {
    return "-";
  } else if (!value) {
    return empty ? "-" : "";
  }

  let L = gameManager.game.level;
  if (level && level > 0) {
    L = level;
  }


  if (settingsManager.settings.calculate && (value.match(EntityExpressionRegex) || value.match(EntityValueRegex))) {
    try {
      return EntityValueFunction(value, L)
    } catch (e) {
      console.error("Could not calculate value for: ", value);
      return value;
    }
  }

  const match = value.match(EntityValueRegex);
  if (match) {
    let func = match[3];
    let funcArgs: string[] = [];
    const funcLabel = func && func.startsWith('$');
    if (funcLabel) {
      func = func.replace('$', '');
      if (func.indexOf(':') != -1) {
        funcArgs = [func.split(':')[1]];
        func = func.split(':')[0];
      }
    }
    return funcLabel ? match[1] + ' ' + settingsManager.getLabel('game.custom.' + func, funcArgs) : match[1];
  }


  while (value.match(ghsLabelRegex)) {
    value = value.replace(ghsLabelRegex, (match, ...args) => {
      return settingsManager.getLabel(args[0]);
    });
  }

  return value ? value : (empty ? '-' : '');
}

@Directive({
  standalone: false,
  selector: ' [value-calc]'
})
export class ValueCalcDirective implements OnInit, OnDestroy, OnChanges {

  @Input('value-calc') value!: string | number;
  @Input('level') level: number | undefined;
  @Input('empty') empty: boolean = false;

  private C: number;
  private L: number;
  private calc: boolean;

  constructor(private el: ElementRef) {
    this.C = Math.max(2, gameManager.characterManager.characterCount());
    this.L = gameManager.game.level;
    this.calc = settingsManager.settings.calculate;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.el.nativeElement.innerHTML = valueCalc(this.value, this.level, this.empty);
  }


  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        if (this.calc != settingsManager.settings.calculate || this.C != Math.max(2, gameManager.characterManager.characterCount()) || this.L != gameManager.game.level) {
          this.C = Math.max(2, gameManager.characterManager.characterCount());
          this.L = gameManager.game.level;
          this.calc = settingsManager.settings.calculate;
          this.el.nativeElement.innerHTML = valueCalc(this.value, this.level, this.empty);
        }
      }
    });
    this.el.nativeElement.innerHTML = valueCalc(this.value, this.level, this.empty);
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }



}