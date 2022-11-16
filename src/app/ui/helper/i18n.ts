import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { EntityValueFunction, EntityValueRegex } from "src/app/game/model/Entity";

export const ghsLabelRegex = /\%((\w+|\.|\-|\:|\%)+)\%/;

export const applyPlaceholder = function (value: string, placeholder: string[] = [], relative: boolean = false): string {

  if (settingsManager.settings.fhStyle) {
    return applyFhPlaceholder(value, placeholder, relative);
  }

  while (value.match(ghsLabelRegex)) {
    value = value.replace(ghsLabelRegex, (match, ...args) => {
      const label: string = args[0];
      const split: string[] = label.split('.');
      const type = split[1];

      let quotes: boolean = false;

      if (match.startsWith("\"") && match.endsWith("\"")) {
        quotes = true;
      }

      let replace: string = match;
      let image: string = '';
      if (type == "condition") {
        split.splice(0, 1);
        image = '<img  src="./assets/images/' + split.join('/') + '.svg" class="icon">';
        replace = '<span class="placeholder-condition">' + settingsManager.getLabel(label) + image + '</span>';
      } else if (type == "action" && split.length == 3 && !split[2].startsWith('specialTarget') && !split[2].startsWith('summon')) {
        split.splice(0, 1);
        image = '<img  src="./assets/images/' + split.join('/') + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-action">' + settingsManager.getLabel(label) + image + '</span>';
      } else if (type == "element") {
        let element = split[2];
        if (element == "consume") {
          image = '<span class="element inline consume">';
          element = split[3];
        } else {
          image = '<span class="element inline">';
        }
        image += '<img src="./assets/images/element/' + element + '.svg"></span>';
        replace = image;
      } else if (type == "initiative" && split.length == 3) {
        image = '<img class="ghs-svg" src="./assets/images/initiative.svg"></span>'
        replace = '<span class="placeholder-initiative">' + split[2] + image + '</span>';
      } else if (type == "action" && split.length == 4) {
        image = '<img  src="./assets/images/action/' + split[2] + '/' + split[3] + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-perk">' + image + '</span>';
      } else if (type == "card" && split.length == 3) {
        let card = split[2]
        let cardValue = "";
        if (card.split(':').length > 1) {
          cardValue = '<span class="card-value">' + card.split(':')[1] + '</span>';
          card = card.split(':')[0];
        }
        image = '<img class="icon ghs-svg" src="./assets/images/action/card/' + card + '.svg">';
        let cardOverlay = '<img class="card-overlay" src="./assets/images/action/card/overlay/' + card + '.svg">';
        replace = '<span class="placeholder-effect placeholder-card">' + image + cardOverlay + cardValue + '</span>';
      } else if (type == "attackmodifier" && split.length == 3) {
        image = '<img  src="./assets/images/attackmodifier/icons/' + split[2] + '.png" class="icon">';
        replace = '<span class="placeholder-attackmodifier">' + image + '</span>';
      } else if (type == "characterToken" && split.length == 3) {
        let characterName = split[2];
        image = '<img src="' + gameManager.characterManager.characterIcon(characterName) + '">';
        replace = '<span class="placeholder-character-token" style="background-color:' + gameManager.characterManager.characterColor(characterName) + '">' + image + '</span>';
      } else if (type == "mapMarker" && split.length == 3) {
        replace = '<span class="map-marker">' + split[2] + '</span>';
      } else if (type == "objectiveMarker" && split.length == 3) {
        replace = '<span class="objective-marker">' + split[2] + '</span>';
      } else if (type && type.startsWith("damage")) {
        let value = '';
        if (type.split(':').length > 1) {
          value = type.split(':')[1];
        }
        replace = '<span class="damage">' + settingsManager.getLabel('game.damage', [value]) + '</span>';
      } else {
        let labelArgs = label.split(':').splice(1).map((arg) =>
          applyPlaceholder(settingsManager.getLabel(arg), placeholder, relative));
        labelArgs.push(...placeholder);
        replace = settingsManager.getLabel(label.split(':')[0], labelArgs) + image;
      }

      return replace;
    });
  }

  value = applyValueCalc(value, relative);

  return value;
}

export const applyFhPlaceholder = function (value: string, placeholder: string[] = [], relative: boolean = false): string {
  while (value.match(ghsLabelRegex)) {
    value = value.replace(ghsLabelRegex, (match, ...args) => {
      const label: string = args[0];
      const split: string[] = label.split('.');
      const type = split[1];

      let quotes: boolean = false;

      if (match.startsWith("\"") && match.endsWith("\"")) {
        quotes = true;
      }

      let replace: string = match;
      let image: string = '';
      if (type == "condition") {
        split.splice(0, 1);
        image = '<img  src="./assets/images/fh/' + split.join('/') + '.svg" class="icon">';
        replace = '<span class="placeholder-condition">' + image + '</span>';
      } else if (type == "action" && split.length == 3 && !split[2].startsWith('specialTarget') && !split[2].startsWith('summon')) {
        split.splice(0, 1);
        image = '<img  src="./assets/images/fh/' + split.join('/') + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-action">' + image + '</span>';
      } else if (type == "element") {
        let element = split[2];
        if (element == "consume") {
          image = '<span class="element inline consume">';
          element = split[3];
        } else {
          image = '<span class="element inline">';
        }
        image += '<img src="./assets/images/fh/element/' + element + '.svg"></span>';
        replace = image;
      } else if (type == "initiative" && split.length == 3) {
        image = '<img class="ghs-svg" src="./assets/images/initiative.svg"></span>'
        replace = '<span class="placeholder-initiative">' + split[2] + image + '</span>';
      } else if (type == "action" && split.length == 4) {
        image = '<img  src="./assets/images/fh/action/' + split[2] + '/' + split[3] + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-perk">' + image + '</span>';
      } else if (type == "card" && split.length == 3) {
        let card = split[2]
        let cardValue = "";
        if (card.split(':').length > 1) {
          cardValue = '<span class="card-value">' + card.split(':')[1] + '</span>';
          card = card.split(':')[0];
        }
        image = '<img class="icon ghs-svg" src="./assets/images/action/card/' + card + '.svg">';
        let cardOverlay = '<img class="card-overlay" src="./assets/images/action/card/overlay/' + card + '.svg">';
        replace = '<span class="placeholder-effect placeholder-card">' + image + cardOverlay + cardValue + '</span>';
      } else if (type == "attackmodifier" && split.length == 3) {
        image = '<img  src="./assets/images/attackmodifier/icons/' + split[2] + '.png" class="icon">';
        replace = '<span class="placeholder-attackmodifier">' + image + '</span>';
      } else if (type == "characterToken" && split.length == 3) {
        let characterName = split[2];
        image = '<img src="' + gameManager.characterManager.characterIcon(characterName) + '">';
        replace = '<span class="placeholder-character-token" style="background-color:' + gameManager.characterManager.characterColor(characterName) + '">' + image + '</span>';
      } else if (type == "mapMarker" && split.length == 3) {
        replace = '<span class="map-marker">' + split[2] + '</span>';
      } else if (type == "objectiveMarker" && split.length == 3) {
        replace = '<span class="objective-marker">' + split[2] + '</span>';
      } else if (type == "target" && split.length == 2) {
        image = '<img  src="./assets/images/fh/action/target.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-action">' + image + '</span>';
      } else if (type && type.startsWith("damage")) {
        let value = '';
        if (type.split(':').length > 1) {
          value = type.split(':')[1];
        }
        image = '<img  src="./assets/images/fh/action/damage.svg" class="icon ghs-svg">';
        replace = '<span class="damage">' + image + value + '</span>';
      } else {
        replace = settingsManager.getLabel(label.split(':')[0], label.split(':').splice(1).map((arg) =>
          applyFhPlaceholder(settingsManager.getLabel(arg), placeholder, relative)
        )) + image;
      }

      return replace;
    });
  }

  value = applyValueCalc(value, relative);

  return value;
}

export const applyValueCalc = function (value: string, relative: boolean): string {

  while (value.match(EntityValueRegex)) {
    value = value.replace(EntityValueRegex, (match, ...args) => {
      if (settingsManager.settings.calculate && !relative) {
        const result = EntityValueFunction(match)
        return "" + result;
      } else {
        let func = args[2];
        const funcLabel = func && func.startsWith('%');
        if (funcLabel) {
          func = func.replace('%', '');
        }
        return funcLabel ? args[0] + ' ' + settingsManager.getLabel('game.custom.' + func) : args[0];
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
  @Input('i18n-arg-label') argLabel: boolean = true;
  @Input('relative') relative: boolean = false;

  private C: number;
  private L: number;
  private locale: string;

  constructor(private el: ElementRef) {
    el.nativeElement.classList.add('placeholder');
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
    if (changes['args'] && JSON.stringify(changes['args'].previousValue) != JSON.stringify(changes['args'].currentValue) || changes['value'] && changes['value'].previousValue != changes['value'].currentValue) {
      this.apply();
    }
  }

  apply(): void {
    this.el.nativeElement.innerHTML = this.value && applyPlaceholder(settingsManager.getLabel(this.value, this.args, this.argLabel), this.args, this.relative) || "";
  }



}