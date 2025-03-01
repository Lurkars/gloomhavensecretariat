import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { Subscription } from "rxjs";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ActionHex, ActionHexFromString } from "src/app/game/model/ActionHex";
import { Character } from "src/app/game/model/Character";
import { ActionType } from "src/app/game/model/data/Action";
import { AttackModifierValueType } from "src/app/game/model/data/AttackModifier";
import { Condition, ConditionType } from "src/app/game/model/data/Condition";
import { EntityValueFunction, EntityValueRegex, EntityValueRegexExtended } from "src/app/game/model/Entity";
import { ActionTypesIcons } from "../figures/actions/action";

export const ghsLabelRegex = /\%((\w+|\.|\-|\:|\,|\+|\(|\)|\||\_|\[|\]|\||\{|\}|\$|\\|\/|\%U+200B)+)\%/;

export const applyPlaceholder = function (value: string, placeholder: string[] = [], relative: boolean = false, style: 'gh' | 'fh' | false = false): string {
  const fh = !style && settingsManager.settings.fhStyle || style == 'fh';
  while (value.match(ghsLabelRegex)) {
    value = value.replace(ghsLabelRegex, (match, ...args) => {
      let label: string = args[0];
      let value = "";
      if (label.indexOf(':') != -1) {
        value = label.split(':')[1];
        label = label.split(':')[0];
      }
      let split: string[] = label.split('.');
      if (!value && args[0].indexOf(':') != -1) {
        value = split[split.length - 1];
      }

      if (!value) {
        value = "";
      }

      const prefix = split[0];
      const type = split[1];

      let replace: string = match;
      let image: string = '';
      if (type == "condition" || type == "immunity") {
        let condition = new Condition(split[2]);
        image = '<span class="condition-icon' + (type == "immunity" ? ' immunity' : '') + '">';
        image += '<img  src="./assets/images/' + (fh ? 'fh/' : '') + 'condition/' + condition.name + '.svg" class="icon">';
        if (!value && condition.types.indexOf(ConditionType.upgrade) != -1) {
          value = 'X';
        }
        if (value) {
          image += '<span class="value">' + value + '</span>';
        }
        image += '</span>';
        replace = '<span class="placeholder-condition">' + (fh ? '&nbsp;' : settingsManager.getLabel('game.condition.' + condition.name, [value ? value : ''])) + image + '</span>';
      } else if (type == "conditionIcon" || type == "immunityIcon") {
        let condition = new Condition(split[2]);
        image = '<span class="condition-icon' + (type == "immunityIcon" ? ' immunity' : '') + '">';
        image += '<img  src="./assets/images/' + (fh ? 'fh/' : '') + 'condition/' + condition.name + '.svg" class="icon">';
        if (!value && condition.types.indexOf(ConditionType.upgrade) != -1) {
          value = 'X';
        }
        if (value) {
          image += '<span class="value">' + value + '</span>';
        }
        image += '</span>';
        replace = '<span class="placeholder-condition">&nbsp;' + image + '</span>';
      } else if (type == "action" && split.length == 3 && !split[2].startsWith('specialTarget') && !split[2].startsWith('summon') && !split[2].startsWith('area')) {
        split.splice(0, 1);
        const ghsSvg = ActionTypesIcons.indexOf(split[split.length - 1] as ActionType) != -1;
        image = '<img  src="./assets/images/' + (fh ? 'fh/' : '') + split.join('/') + '.svg" class="icon' + (ghsSvg ? ' ghs-svg' : '') + '">';
        replace = '&nbsp;<span class="placeholder-action">' + (fh ? '&nbsp;' : settingsManager.getLabel(label)) + image + value + '</span>';
      } else if (type == "element") {
        let element = split[2];
        if (element == "consume") {
          image = '<span class="element inline consume">';
          element = split[3];
        } else {
          image = '<span class="element inline">';
        }
        image += '<img src="./assets/images/' + (fh ? 'fh/' : '') + 'element/' + element + '.svg"></span>';
        replace = image;
      } else if (type == "elementHalf") {
        let consume: boolean = false;
        if (split[2] && split[2].startsWith("consume")) {
          consume = true;
        }
        const elements = value.split('|');
        replace = '<span class="attack-modifier-effect placeholder-element-half element-half-placeholder' + (fh ? ' fh' : '') + '"><span class="element-half-container' + (consume ? ' consume' : '') + '"><span class="element-half"><img src="./assets/images/' + (fh ? 'fh/' : '') + 'element/' + elements[0] + '.svg"></span><span class="element-half"><img src="./assets/images/' + (fh ? 'fh/' : '') + 'element/' + elements[1] + '.svg"></span></span></span>';
      } else if (type == "action" && split[2].startsWith('area')) {
        replace = '<span class="placeholder-area">'

        if (split[2] == 'areaRotated') {
          replace = '<span class="placeholder-area" style="transform:rotate(-90deg);">';
        }

        value.split('|').forEach((hexValue) => {
          const hex: ActionHex | null = ActionHexFromString(hexValue);
          if (hex != null) {
            replace += '<span class="hex" style="grid-column-start : ' + (hex.x * 2 + 1 + (hex.y % 2)) + ';grid-column-end:' + (hex.x * 2 + 3 + (hex.y % 2)) + ';grid-row-start:' + (hex.y + 1) + ';grid-row-end:' + (hex.y + 1) + '"><img src="./assets/images/action/hex/' + hex.type + '.svg"></span>';
          }
        })
        replace += '</span>'
      } else if (type == "initiative" && split.length == 3) {
        image = '<img class="ghs-svg" src="./assets/images/initiative.svg"></span>'
        replace = '<span class="placeholder-initiative">' + split[2] + image + '</span>';
      } else if (type == "action" && split.length == 4) {
        image = '<img  src="./assets/images/action/' + split[2] + '/' + split[3] + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-perk">' + image + value + '</span>';
      } else if (prefix == "game" && type == "items" && split.length == 4) {
        image = '<img  src="./assets/images/items/' + split[2] + '/' + split[3] + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-item-slot">' + image + value + '</span>';
      } else if (prefix == "game" && type == "itemFh" && split.length == 3) {
        const itemId: number = +split[2];
        replace = '<span class="placeholder-item-fh">' + '<span class="value">' + (itemId < 100 ? '0' : '') + (itemId < 10 ? '0' : '') + itemId + '</span></span>';
      } else if (type == "card" && split.length == 3) {
        let card = split[2]
        let cardValue = "";
        if (value) {
          cardValue = '<span class="card-value">' + value + '</span>';
        }
        image = '<img class="icon ghs-svg" src="./assets/images/action/card/' + card + '.svg">';
        const cardOverlay = '<img class="card-overlay" src="./assets/images/action/card/overlay/' + card + '.svg">';
        replace = '<span class="placeholder-effect placeholder-card">' + image + cardOverlay + cardValue + '</span>';
      } else if (type == "attackmodifier" && split.length == 3) {
        image = '<img  src="./assets/images' + (fh ? '/fh' : '') + '/attackmodifier/icons/' + split[2] + '.png" class="icon">';
        replace = '<span class="placeholder-attackmodifier">' + image + '</span>';
      } else if (type == "experience") {
        image = '<img  src="./assets/images/experience.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-experience">' + image + (value ? '<span class="value">' + value + '</span>' : '') + '</span>';
      } else if (type == "characterIcon" && split.length == 3) {
        const characterName = split[2];
        image = '<img class="icon" src="' + gameManager.characterManager.characterIcon(characterName) + '">';
        replace = '<span class="placeholder-character-icon">' + image + '</span>';
      } else if (type == "characterIconColored" && split.length == 3) {
        const characterName = split[2];
        image = '<img class="icon" src="' + gameManager.characterManager.characterIcon(characterName) + '">';
        replace = '<span class="placeholder-character-icon-colored">' + image + '</span>';
      } else if (type == "characterIconColoredBg" && split.length == 3) {
        const characterName = split[2];
        image = '<img class="icon" src="' + gameManager.characterManager.characterIcon(characterName) + '">';
        replace = '<span class="placeholder-character-icon-colored-bg" style="background-color:' + gameManager.characterManager.characterColor(characterName) + '">' + image + '</span>';
      } else if (type == "characterIconIdentity" && split.length == 4) {
        const characterName = split[2];
        const identity = +split[3];
        image = '<img class="icon" src="' + gameManager.characterManager.characterIdentityIcon(characterName, identity) + '">';
        replace = '<span class="placeholder-character-icon">' + image + '</span>';
      } else if (type == "characterIconIdentityColored" && split.length == 4) {
        const characterName = split[2];
        const identity = +split[3];
        image = '<img class="icon" src="' + gameManager.characterManager.characterIdentityIcon(characterName, identity) + '">';
        replace = '<span class="placeholder-character-icon-colored">' + image + '</span>';
      } else if (type == "characterIconIdentityColoredBg" && split.length == 4) {
        const characterName = split[2];
        const identity = +split[3];
        image = '<img class="icon" src="' + gameManager.characterManager.characterIdentityIcon(characterName, identity) + '">';
        replace = '<span class="placeholder-character-icon-colored-bg" style="background-color:' + gameManager.characterManager.characterColor(characterName) + '">' + image + '</span>';
      } else if (type == "characterToken" && split.length >= 3) {
        const characterName = split[2];
        let icon = gameManager.characterManager.characterIcon(characterName);
        let additionalToken = false;
        if (split.length > 3) {
          icon = './assets/images/character/token/' + characterName + '-' + split[3] + '.svg';
          additionalToken = true;
        }
        image = '<img src="' + icon + '">';
        replace = '<span class="placeholder-character-token' + (additionalToken ? ' additional' : '') + '" style="--ghs-character-color:' + gameManager.characterManager.characterColor(characterName) + '">' + image + '</span>';
      } else if (type == "coloredToken" && split.length > 3) {
        const color = split[2];
        const icon = './assets/images/character/custom/' + split[3] + '.svg';
        image = '<img src="' + icon + '">';
        replace = '<span class="placeholder-character-token" style="--ghs-character-color:#' + color + '">' + image + '</span>';
      } else if (type == "characterColored") {
        const characterName = split[2];
        replace = '<span style="color: ' + gameManager.characterManager.characterColor(characterName) + ';">' + value + '</span>'
      }
      else if (type == "monsterType" && split.length == 3) {
        const monsterType = split[2];
        replace = '<span class="placeholder-monster-type ' + monsterType + '">' + settingsManager.getLabel('game.monster.' + monsterType) + '</span>';
      } else if (type == "monsterType" && split.length == 4) {
        const monsterType = split[2];
        replace = '<span class="placeholder-monster-type ' + monsterType + '">' + split[3] + '</span>';
      } else if (type == "mapMarker" && split.length == 3) {
        if (split[2] == ('element')) {
          image = '<img src="./assets/images/element/' + value + '.svg">';
          replace = '<span class="placeholder-element">' + image + '</span>';
        } else {
          replace = '<span class="map-marker">' + split[2] + '</span>';
        }
      } else if (type == "objectiveMarker" && split.length == 3) {
        replace = '<span class="objective-marker">' + split[2] + '</span>';
      } else if (type == "scenarioNumber") {
        replace = '<span class="scenario-number">' + value + '</span>';
      } else if (fh && type == "target" && split.length == 2) {
        image = '<img  src="./assets/images/fh/action/target.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-action">' + image + '</span>';
      } else if (!fh && type == "damage") {
        replace = '<span class="damage">' + settingsManager.getLabel('game.damage', [value]) + '</span>';
      } else if (fh && type == "damage") {
        image = '<img  src="./assets/images/fh/action/damage.svg" class="icon ghs-svg">';
        replace = '<span class="damage">&nbsp;' + image + value + '</span>';
      } else if (type == "loot" && split.length == 4) {
        image = '<img  src="./assets/images/' + split[3] + '-player.svg" class="icon">';
        replace = '<span class="placeholder-player">' + image + '</span>';
      } else if (type == "resource" && split.length == 3) {
        image = '<img  src="./assets/images/fh/loot/' + split[2] + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-resource">' + image + '</span>';
      } else if (type == "section" && value) {
        image = '<img src="./assets/images/fh/party/section.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-section">' + image + value + '</span>';
      } else if (type == "checkmark") {
        replace = '<span class="placeholder-checkmark"><img src="./assets/images/check.svg" class="icon ghs-svg"></span>';
      } else if (type == "itemSlot" && value) {
        replace = '<span class="placeholder-items-slot"><img src="./assets/images/items/slots/' + value + '.svg" class="icon ghs-svg"></span>';
      } else if (type == "bbAm" && split.length == 3) {
        replace = '<span class="placeholder-bb-am"><img src="./assets/images/bb/attackmodifier/' + split[2] + '.svg" class="icon ghs-svg"></span>';
      } else if (type == "townGuardAm" && split.length == 3 && value) {
        const valueType = split[2];
        let valueSign = "";
        if (valueType == AttackModifierValueType.plus) {
          valueSign = "+";
        } else if (valueType == AttackModifierValueType.minus) {
          valueSign = "-";
        } else if (valueType == AttackModifierValueType.multiply) {
          valueSign = "x";
        }
        replace = '<span class="placeholder-town-guard-am ' + split[2] + '">' + valueSign + value + '</span>';
      } else if (type == "fhIcon" && value) {
        image = '<img src="./assets/images/fh/icons/' + value + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-fh-icon">' + image + '</span>';
      } else if (type == "gameIcon" && value) {
        image = '<img src="./assets/images/' + value + '.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-game-icon">' + image + '</span>';
      } else if (type == "trait" && value) {
        image = '<img src="./assets/images/fh/character/traits/trait.svg" class="icon ghs-svg">';
        replace = '<span class="placeholder-trait">' + image + settingsManager.getLabel('data.character.traits.' + value) + '</span>';
      } else if (type == "eventCheckbox" && value) {
        replace = '<span class="event-checkbox">' + value + '</span>';
      } else {
        let labelArgs = label.split(':').splice(1).map((arg) =>
          applyPlaceholder(settingsManager.getLabel(arg), placeholder, relative));
        if (value) {
          labelArgs = [value, ...labelArgs];
        }
        labelArgs.push(...placeholder);
        replace = settingsManager.getLabel(label.split(':')[0], labelArgs) + image;
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
        let funcArgs: string[] = [];
        const funcLabel = func && func.startsWith('$');
        if (funcLabel) {
          func = func.replace('$', '');
          if (func.indexOf(':') != -1) {
            funcArgs = [func.split(':')[1]];
            func = func.split(':')[0];
          }
        }
        return funcLabel ? args[0] + ' ' + settingsManager.getLabel('game.custom.' + func, funcArgs) : args[0];
      }
    });
  }

  while (value.match(EntityValueRegexExtended)) {
    value = value.replace(EntityValueRegexExtended, (match, ...args) => {
      let func = args[2];
      let funcArgs: string[] = [];
      const funcLabel = func && func.startsWith('$');
      if (funcLabel) {
        func = func.replace('$', '');
        if (func.indexOf(':') != -1) {
          funcArgs = [func.split(':')[1]];
          func = func.split(':')[0];
        }
      }
      return funcLabel ? args[0] + ' ' + settingsManager.getLabel('game.custom.' + func, funcArgs) : args[0];
    });
  }

  return value;
}

@Directive({
  standalone: false,
  selector: '[ghs-label]'
})
export class GhsLabelDirective implements OnInit, OnDestroy, OnChanges {

  @Input('ghs-label') value!: string | number;
  @Input('ghs-label-args') args: (string | number | boolean)[] = [];
  @Input('ghs-label-args-replace') argLabel: boolean = true;
  @Input('ghs-label-empty') empty: boolean = true;
  @Input('ghs-label-attribute') attribute: string = "";
  @Input('relative') relative: boolean = false;
  @Input('style') style: 'gh' | 'fh' | false = false;

  private C: number;
  private L: number;
  private locale: string;
  private calc: boolean = false;
  private fhStyle: boolean = false;

  constructor(private el: ElementRef) {
    el.nativeElement.classList.add('placeholder');
    this.C = Math.max(2, gameManager.characterManager.characterCount());
    this.L = gameManager.game.level;
    this.locale = settingsManager.settings.locale;
    this.calc = settingsManager.settings.calculate;
    this.fhStyle = settingsManager.settings.fhStyle;
  }

  ngOnInit(): void {
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        if (this.locale != settingsManager.settings.locale || this.C != gameManager.game.figures.filter((figure) => figure instanceof Character).length || this.L != gameManager.game.level || (this.fhStyle != settingsManager.settings.fhStyle) || this.calc != settingsManager.settings.calculate) {
          this.C = Math.max(2, gameManager.characterManager.characterCount());
          this.L = gameManager.game.level;
          this.locale = settingsManager.settings.locale;
          this.calc = settingsManager.settings.calculate;
          this.fhStyle = settingsManager.settings.fhStyle;
          this.apply();
        }
      }
    });
    this.apply();
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['args'] && JSON.stringify(changes['args'].previousValue) != JSON.stringify(changes['args'].currentValue) || changes['value'] && changes['value'].previousValue != changes['value'].currentValue || changes['style'] && changes['style'].previousValue != changes['style'].currentValue) {
      this.apply();
    }
  }

  apply(): void {
    let args: string[] = this.args.map((arg) => '' + arg) || [];
    if (this.argLabel) {
      args = args.map((arg) => applyPlaceholder(settingsManager.getLabel(arg, [], false, this.empty), [], this.relative, this.style));
    }

    const value = typeof this.value === 'number' ? this.value : (this.value && applyPlaceholder(settingsManager.getLabel(this.value, args, false, this.empty), args, this.relative, this.style) || "");
    if (this.attribute) {
      this.el.nativeElement.setAttribute(this.attribute, value);
    } else {
      this.el.nativeElement.innerHTML = value;
    }
  }
}

@Directive({
  standalone: false,
  selector: '[ghs-label-element]'
})
export class GhsLabelElementDirective implements OnInit {

  value: string = "";
  @Input('ghs-label-element') prefix: string = "";

  constructor(private el: ElementRef) {
    el.nativeElement.classList.add('placeholder');
  }

  ngOnInit(): void {
    this.value = this.el.nativeElement.textContent;
    this.apply();
  }

  apply(): void {
    const value = this.value && applyPlaceholder(settingsManager.getLabel((this.prefix ? this.prefix + '.' : '') + this.value)) || "";
    if (value) {
      this.el.nativeElement.innerHTML = value;
    }
  }
}

@Directive({
  standalone: false,
  selector: '[ghs-placeholder]'
})
export class GhsPlaceholderDirective implements OnInit, OnChanges {

  @Input('ghs-placeholder') value: string = "";

  constructor(private el: ElementRef) {
    el.nativeElement.classList.add('placeholder');
  }

  ngOnInit(): void {
    this.value = this.el.nativeElement.textContent;
    this.apply();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.apply();
  }

  apply(): void {
    const value = this.value && applyPlaceholder('%' + this.value + '%') || "";
    if (value) {
      this.el.nativeElement.innerHTML = value;
    }
  }
}