import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { EntityExpressionRegex, EntityValueFunction, EntityValueRegex } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";
import { ghsLabelRegex } from "./i18n";


@Directive({
  selector: ' [value-calc]'
})
export class ValueCalcDirective implements OnInit, OnChanges {

  @Input('value-calc') value!: string | number;
  @Input('level') level: number | undefined;
  @Input('empty') empty: boolean = false;

  private C: number;
  private L: number;
  private calc: boolean;

  constructor(private el: ElementRef) {
    this.C = gameManager.game.figures.filter((figure: Figure) => figure instanceof Character).length;
    this.L = gameManager.game.level;
    this.calc = settingsManager.settings.calculate;
    gameManager.uiChange.subscribe({
      next: () => {
        if (this.calc != settingsManager.settings.calculate || this.C != gameManager.game.figures.filter((figure: Figure) => figure instanceof Character).length || this.L != gameManager.game.level) {
          this.C = gameManager.game.figures.filter((figure: Figure) => figure instanceof Character).length;
          this.L = gameManager.game.level;
          this.calc = settingsManager.settings.calculate;
          this.el.nativeElement.innerHTML = this.transform(this.value, this.level, this.empty);
        }
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.el.nativeElement.innerHTML = this.transform(this.value, this.level, this.empty);
  }


  ngOnInit(): void {
    this.el.nativeElement.innerHTML = this.transform(this.value, this.level, this.empty);
  }

  transform(value: string | number, level: number | undefined, empty: boolean): string | number {

    if (typeof value === "number") {
      if (empty && value == 0) {
        return "-";
      }

      return value;
    }

    if (0 == +value) {
      return "-";
    } else if (!value) {
      return "";
    }

    let L = gameManager.game.level;
    if (level && level > 0) {
      L = level;
    }


    if (settingsManager.settings.calculate && (value.match(EntityExpressionRegex) || value.match(EntityValueRegex))) {
      try {
        return EntityValueFunction(value, L)
      } catch {
        console.error("Could not calculate value for: ", value);
        return value;
      }
    }

    const match = value.match(EntityValueRegex);
    if (match) {
      let func = match[ 3 ];
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