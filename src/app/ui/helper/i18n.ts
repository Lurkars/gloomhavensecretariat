import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { EntityValueFunction, EntityValueRegex } from "src/app/game/model/Entity";
import { Figure } from "src/app/game/model/Figure";

export const ghsLabelRegex = /\%((\w+|\.|\-|\:|\%)+)\%/;

export const applyPlaceholder = function (value: string): string {
  while (value.match(ghsLabelRegex)) {
    value = value.replace(ghsLabelRegex, (match, ...args) => {
      const label: string = args[ 0 ];
      const split: string[] = label.split('.');
      const type = split[ 1 ];

      let quotes = false;

      if (match.startsWith("\"") && match.endsWith("\"")) {
        quotes = true;
      }

      let replace = match;
      let image = '';
      if (type == "condition") {
        split.splice(0, 1);
        image = '<img  src="./assets/images/' + split.join('/') + '.svg" class="icon">';
        replace = '<span class="placeholder-condition">' + settingsManager.getLabel(label) + image + '</span>';
      } else if (type == "action" && split.length == 3 && !split[ 2 ].startsWith('specialTarget')) {
        split.splice(0, 1);
        image = '<img  src="./assets/images/' + split.join('/') + '.svg" class="icon">';
        replace = '<span class="placeholder-action">' + settingsManager.getLabel(label) + image + '</span>';
      } else if (type == "element") {
        let element = split[ 2 ];
        if (element == "consume") {
          image = '<span class="element inline consume">';
          element = split[ 3 ];
        } else {
          image = '<span class="element inline">';
        }
        image += '<img src="./assets/images/element/' + element + '.svg"></span>';
        replace = image;
      } else if (type == "initiative" && split.length == 3) {
        image = '<img class="ghs-svg" src="./assets/images/initiative.svg"></span>'
        replace = '<span class="placeholder-initiative">' + split[ 2 ] + image + '</span>';
      } else if (type == "attackmodifier" && split.length == 3) {
        image = '<img  src="./assets/images/attackmodifier/icons/' + split[ 2 ] + '.png" class="icon">';
        replace = '<span class="placeholder-attackmodifier">' + image + '</span>';
      } else {
        replace = settingsManager.getLabel(label.split(':')[ 0 ], label.split(':').splice(1).map((arg) =>
          applyPlaceholder(settingsManager.getLabel(arg))
        )) + image;
      }

      return replace;
    });
  }

  while (value.match(EntityValueRegex)) {
    value = value.replace(EntityValueRegex, (match, ...args) => {
      if (settingsManager.settings.calculate) {
        const result = EntityValueFunction(match)
        return "" + result;
      } else {
        let func = args[ 2 ];
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

@Directive({
  selector: ' [i18n]'
})
export class I18nDirective implements OnInit, OnChanges {

  @Input('i18n') value!: string;
  @Input('i18n-args') args: string[] = [];

  private C: number;
  private L: number;
  private locale: string;

  constructor(private el: ElementRef) {
    this.C = gameManager.game.figures.filter((figure) => figure instanceof Character).length;
    this.L = gameManager.game.level;
    this.locale = settingsManager.settings.locale;
    gameManager.uiChange.subscribe({
      next: () => {
        if (this.locale != settingsManager.settings.locale || this.C != gameManager.game.figures.filter((figure) => figure instanceof Character).length || this.L != gameManager.game.level) {
          this.C = gameManager.game.figures.filter((figure) => figure instanceof Character).length;
          this.L = gameManager.game.level;
          this.locale = settingsManager.settings.locale;
          this.apply();
        }
      }
    })
  }

  ngOnInit(): void {
    this.apply();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes[ 'args' ] || changes[ 'i18n' ]) {
      this.apply();
    }
  }

  apply(): void {
    this.el.nativeElement.innerHTML = this.value && applyPlaceholder(settingsManager.getLabel(this.value, this.args)) || "";
  }



}