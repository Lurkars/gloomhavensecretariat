import { Component, Input, ViewEncapsulation } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { AttackModifier, AttackModifierEffect, AttackModifierEffectType, AttackModifierType, AttackModifierValueType } from "src/app/game/model/data/AttackModifier";
import { Perk, PerkType } from "src/app/game/model/data/Perks";

@Component({
	standalone: false,
    selector: 'ghs-perk-label',
    templateUrl: './label.html',
    styleUrls: ['./label.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PerkLabelComponent {

    @Input() perk!: Perk;
    PerkType = PerkType;

    perkLabel(perk: Perk): string[] {
        let label: string[] = [];
        let cardLabel: string[] = [];
        if (perk.cards) {
            perk.cards.forEach((card) => {
                cardLabel.push(settingsManager.getLabel('game.attackModifiers.perks.cardLabel', ['game.attackModifiers.perks.cards.' + card.count, this.attackModifierHtml(card.attackModifier), card.count > 1 ? 'game.attackModifiers.perks.cards' : 'game.attackModifiers.perks.card']))
            })

            if (perk.type == PerkType.replace) {
                const replace = gameManager.attackModifierManager.replaceCount(perk);
                if (replace == 1 && cardLabel.length == 2) {
                    label = cardLabel;
                } else {
                    if (replace > 1) {
                        let multiLabel = "";
                        for (let i = replace - 1; i >= 0; i--) {
                            if (!multiLabel) {
                                multiLabel = cardLabel[i];
                            } else {
                                multiLabel = settingsManager.getLabel('game.attackModifiers.perks.additional', [cardLabel[i], multiLabel])
                            }
                        }
                        label.push(multiLabel);
                    } else {
                        label.push(cardLabel[0]);
                    }

                    if (cardLabel.length - replace == 1) {
                        label.push(cardLabel[replace]);
                    } else {
                        let multiLabel = "";
                        for (let i = cardLabel.length; i >= replace; i--) {
                            if (!multiLabel) {
                                multiLabel = cardLabel[i];
                            } else {
                                multiLabel = settingsManager.getLabel('game.attackModifiers.perks.additional', [cardLabel[i], multiLabel])
                            }
                        }
                        label.push(multiLabel);
                    }
                }
            } if (cardLabel.length < 2) {
                label = cardLabel;
            } else {
                cardLabel.forEach((value, index, self) => {
                    if (index % 2 == 0 && index < self.length - 1) {
                        label.push(settingsManager.getLabel('game.attackModifiers.perks.additional', [value, cardLabel[index + 1]]));
                    }
                });
            }
        }

        return label;
    }

    attackModifierHtml(attackModifier: AttackModifier): string {
        let html = "";
        attackModifier = new AttackModifier(attackModifier.type, attackModifier.value, attackModifier.valueType, attackModifier.id, attackModifier.effects, attackModifier.rolling);

        html += '<span class="attack-modifier-container">'

        if (!settingsManager.settings.fhStyle && attackModifier.rolling) {
            html += '<span class="attack-modifier-effect rolling">&zwj;<img class="action-icon sw" src="./assets/images/attackmodifier/rolling.svg"></span>';
        }

        if (!attackModifier.rolling || attackModifier.type != AttackModifierType.plus0) {
            if (attackModifier.valueType == AttackModifierValueType.minus) {
                html += '<span class="attack-modifier-icon' + (attackModifier.value > 9 ? ' small' : '') + '">-' + attackModifier.value + '</span>';
            } else if (attackModifier.valueType == AttackModifierValueType.multiply) {
                html += '<span class="attack-modifier-icon' + (attackModifier.value > 9 ? ' small' : '') + '">' + attackModifier.value + 'x</span>';
            } else if (attackModifier.type == AttackModifierType.plusX) {
                html += '<span class="attack-modifier-icon">+X</span>';
            } else {
                html += '<span class="attack-modifier-icon' + (attackModifier.value > 9 ? ' small' : '') + '">+' + attackModifier.value + '</span>';
            }
        }

        if (attackModifier.effects) {
            if (attackModifier.effects.length > 1) {
                html += '"';
            }
            attackModifier.effects.forEach((effect, index) => {
                if (index > 0) {
                    html += ',';
                }
                html += this.attackModifierEffectHtml(effect, attackModifier.effects.length > 1);
            })
            if (attackModifier.effects.length > 1) {
                html += '"';
            }
        }

        if (settingsManager.settings.fhStyle && attackModifier.rolling) {
            html += '<span class="attack-modifier-effect rolling">&zwj;<img class="action-icon sw" src="./assets/images/attackmodifier/rolling.svg"></span>';
        }

        html += '</span>';

        return html;
    }

    attackModifierEffectHtml(effect: AttackModifierEffect, noQuotes: boolean = false): string {
        let html = "";

        let quotes: boolean = false;

        switch (effect.type) {
            case AttackModifierEffectType.condition:
                let condition = effect.value.split(':')[0];
                condition = condition.replace('_x', '');
                html += '<span class="attack-modifier-effect condition">' + (settingsManager.settings.fhStyle ? '' : settingsManager.getLabel('game.condition.' + condition)) + '<img class="action-icon sw" src="./assets/images/' + (settingsManager.settings.fhStyle ? 'fh/' : '') + 'condition/' + condition + '.svg">';
                if (effect.value.split(':').length > 1) {
                    html += effect.value.split(':')[1];
                }
                html += '</span>';
                break;
            case AttackModifierEffectType.element:
                html += '<span class="attack-modifier-effect element"><img class="action-icon sw" src="./assets/images/' + (settingsManager.settings.fhStyle ? 'fh/' : '') + 'element/' + effect.value + '.svg"></span>';
                break;
            case AttackModifierEffectType.elementHalf:
                const elements = effect.value.split('|');
                html += '<span class="attack-modifier-effect element-half-placeholder' + (settingsManager.settings.fhStyle ? ' fh' : '') + '"><span class="element-half-container"><span class="element-half"><img src="./assets/images/' + (settingsManager.settings.fhStyle ? 'fh/' : '') + 'element/' + elements[0] + '.svg"></span><span class="element-half"><img src="./assets/images/' + (settingsManager.settings.fhStyle ? 'fh/' : '') + 'element/' + elements[1] + '.svg"></span></span></span>';
                break;
            case AttackModifierEffectType.elementConsume:
                html += '<span class="attack-modifier-effect element consume"><img class="action-icon sw" src="./assets/images/' + (settingsManager.settings.fhStyle ? 'fh/' : '') + 'element/' + effect.value + '.svg"></span>';
                if (effect.effects) {
                    html += ':';
                    effect.effects.forEach((subEffect) => {
                        html += this.attackModifierEffectHtml(subEffect, true);
                    })
                }
                if (!noQuotes) {
                    return '"' + html + '"';
                } else {
                    return html;
                }
            case AttackModifierEffectType.target:
                if (settingsManager.settings.fhStyle) {
                    html += '<span class="placeholder attack-modifier-effect target">+' + effect.value + '<img class="action-icon" src="./assets/images/fh/attackmodifier/target.svg"></span>';
                } else {
                    html += '<span class="placeholder attack-modifier-effect target">' + settingsManager.getLabel((+effect.value) <= 1 ? 'game.custom.perks.addTarget' : 'game.custom.perks.addTargets', [effect.value + ""]) + '<img class="action-icon" src="./assets/images/attackmodifier/target.svg"></span>';
                }
                break;
            case AttackModifierEffectType.specialTarget:
                if (effect.value.split(':').length > 1) {
                    html += '<span class="placeholder attack-modifier-effect special-target">' + settingsManager.getLabel('game.specialTarget.' + effect.value.split(':')[0], effect.value.split(':').slice(1)) + '</span>';
                } else if (settingsManager.settings.fhStyle && effect.value == 'allyShort') {
                    html += '<span class="placeholder attack-modifier-effect special-target">' + settingsManager.getLabel('game.specialTarget.ally') + '</span>';
                } else {
                    html += '<span class="placeholder attack-modifier-effect special-target">' + settingsManager.getLabel('game.specialTarget.' + effect.value) + '</span>';
                }
                break;
            case AttackModifierEffectType.refreshItem:
                html += '<span class="placeholder attack-modifier-effect card">' + settingsManager.getLabel('game.attackModifiers.perks.effects.' + effect.type + (settingsManager.settings.fhStyle ? 'Fh' : '')) + '</span>';
                break;
            case AttackModifierEffectType.refreshSpentItem:
                html += '<span class="placeholder attack-modifier-effect card">' + settingsManager.getLabel('game.attackModifiers.perks.effects.' + effect.type) + '</span>';
                break;
            case AttackModifierEffectType.recoverRandomDiscard:
                html += '<span class="placeholder attack-modifier-effect card">' + settingsManager.getLabel('game.attackModifiers.perks.effects.' + effect.type) + '</span>';
                break;
            case AttackModifierEffectType.custom:
                if (effect.hint) {
                    html += '<span class="placeholder attack-modifier-effect custom-hint">' + settingsManager.getLabel(effect.hint) + '</span>';
                } else {
                    html += '<span class="placeholder attack-modifier-effect custom">' + settingsManager.getLabel('' + effect.value) + '</span>';
                }
                quotes = true;
                break;
            case AttackModifierEffectType.or:
                if (effect.effects) {
                    effect.effects.forEach((subEffect, index) => {
                        html += this.attackModifierEffectHtml(subEffect, true);
                        if (index < effect.effects.length - 1) {
                            html += ' ' + settingsManager.getLabel('or') + ' ';
                        }
                    })
                }
                if (!noQuotes) {
                    return '"' + html + '"';
                } else {
                    return html;
                }
            case AttackModifierEffectType.changeType:
                if (effect.value.startsWith('plus')) {
                    html += '<span class="attack-modifier-icon">+' + effect.value.replace('plus', '') + '</span>';
                } else if (effect.value.startsWith('minus')) {
                    html += '<span class="attack-modifier-icon">-' + effect.value.replace('minus', '') + '</span>';

                } else if (effect.value.startsWith('multiply')) {
                    html += '<span class="attack-modifier-icon">x' + effect.value.replace('multiply', '') + '</span>';
                }
                if (effect.effects) {
                    effect.effects.forEach((subEffect) => {
                        html += this.attackModifierEffectHtml(subEffect, true);
                    })
                }

                if (!noQuotes) {
                    html = '"' + html + '"';
                }
                return html;
            case AttackModifierEffectType.required:
                if (effect.value) {
                    html += '<span>' + effect.value + '</span>';
                } else {
                    html += '<span>!</span>';
                }
                if (effect.effects) {
                    effect.effects.forEach((subEffect) => {
                        html += this.attackModifierEffectHtml(subEffect, true);
                    })
                }

                if (!noQuotes) {
                    html = '"' + html + '"';
                }
                return html;
            default:
                html += '<span class="placeholder attack-modifier-effect default ' + effect.type + '">' + (settingsManager.settings.fhStyle ? '' : settingsManager.getLabel('game.action.' + effect.type)) + '<img  class="action-icon" src="./assets/images/' + (settingsManager.settings.fhStyle ? 'fh/' : '') + 'action/' + effect.type + '.svg"><span class="value">' + effect.value + '</span></span>';
                if ([AttackModifierEffectType.pull, AttackModifierEffectType.push, AttackModifierEffectType.swing, AttackModifierEffectType.pierce].indexOf(effect.type) == -1) {
                    quotes = true;
                }
                break;
        }

        if (effect.effects) {
            quotes = true;
            effect.effects.forEach((subEffect) => {
                html += "," + this.attackModifierEffectHtml(subEffect, true);
            })
        }

        if (quotes && !noQuotes) {
            html = '"' + html + '"';
        }

        return html;

    }
}