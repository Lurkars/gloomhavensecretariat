import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { applyMathFunctionLabels, applyPlaceholder, applyValueCalc } from 'src/app/ui/helper/label';

// applyPlaceholder() is the core %placeholder% -> HTML expander used across every game label in
// the app (conditions, actions, items, characters, ...). It has ~50 branches keyed off the
// dot-separated placeholder "type" (e.g. %game.condition.poison%, %game.action.attack%). This
// spec covers a representative cross-section of branch families rather than every branch, plus
// the Math.*()-label substitution (applyMathFunctionLabels) and bracket-expression evaluation
// (applyValueCalc) it delegates to. Label text itself falls back to the raw label key since no
// label data is loaded in the test environment (consistent with SettingsManager.spec.ts).

describe('label helpers', () => {
  beforeEach(() => {
    settingsManager.settings.fhStyle = false;
    settingsManager.settings.calculate = true;
    gameManager.game.party.conclusions = [];
  });

  describe('applyPlaceholder', () => {
    it('leaves plain text without placeholders unchanged', () => {
      expect(applyPlaceholder('just plain text')).toEqual('just plain text');
    });

    it('the default branch resolves a bare label to its raw key fallback', () => {
      expect(applyPlaceholder('%some.label%')).toEqual('some.label');
    });

    it('the default branch passes a colon-suffixed value as the first label arg', () => {
      // no label data is loaded, so getLabel falls back to the raw key and ignores args,
      // but this still exercises the value-extraction/labelArgs-building code path
      expect(applyPlaceholder('%some.label:5%')).toEqual('some.label');
    });

    it('resolves nested label args recursively (the "label:otherLabel" form)', () => {
      // label.split(':').splice(1) picks up "other.label" and resolves it via getLabel first
      const result = applyPlaceholder('%some.label:other.label%');
      expect(result).toEqual('some.label');
    });

    it('condition renders an icon plus the condition label text', () => {
      const result = applyPlaceholder('%game.condition.poison%');
      expect(result).toContain('placeholder-condition');
      expect(result).toContain('condition/poison.svg');
      expect(result).not.toContain('class="value"');
    });

    it('condition with an explicit value renders a value span', () => {
      const result = applyPlaceholder('%game.condition.poison:3%');
      expect(result).toContain('<span class="value">3</span>');
    });

    it('an upgradeable condition (poison_x) defaults its value to "X" when none given', () => {
      const result = applyPlaceholder('%game.condition.poison_x%');
      expect(result).toContain('<span class="value">X</span>');
    });

    it('immunity uses the immunity icon class', () => {
      const result = applyPlaceholder('%game.immunity.stun%');
      expect(result).toContain('condition-icon immunity');
    });

    it('conditionIcon renders only the icon (no label text)', () => {
      const result = applyPlaceholder('%game.conditionIcon.stun%');
      expect(result).toContain('condition/stun.svg');
      expect(result).not.toContain('game.condition.stun');
    });

    it('a 3-part action placeholder renders an icon and marks known action types with ghs-svg', () => {
      const result = applyPlaceholder('%game.action.attack%');
      expect(result).toContain('placeholder-action');
      expect(result).toContain('action/attack.svg');
      expect(result).toContain('ghs-svg');
    });

    it('an action type outside ActionTypesIcons omits the ghs-svg class', () => {
      const result = applyPlaceholder('%game.action.push%');
      expect(result).toContain('action/push.svg');
      expect(result).not.toContain('ghs-svg');
    });

    it('a 4-part "...valueSign" action placeholder renders a signed value', () => {
      const result = applyPlaceholder('%game.action.attack.valueSign:2%');
      expect(result).toContain('+2');
      expect(result).toContain('action/attack.svg');
    });

    it('actionIcon renders only the icon, no label text', () => {
      const result = applyPlaceholder('%game.actionIcon.attack%');
      expect(result).toContain('action/attack.svg');
    });

    it('actionText resolves the action label without an icon', () => {
      const result = applyPlaceholder('%game.actionText.attack%');
      expect(result).toEqual('&#8203;<span class="placeholder-action">game.action.attack</span>');
    });

    it('element renders an inline element icon', () => {
      const result = applyPlaceholder('%game.element.fire%');
      expect(result).toEqual('<span class="element inline"><img src="./assets/images/element/fire.svg"></span>');
    });

    it('element "consume" variant adds the consume class and shifts the element index', () => {
      const result = applyPlaceholder('%game.element.consume.ice%');
      expect(result).toContain('element inline consume');
      expect(result).toContain('element/ice.svg');
    });

    it('elementHalf splits a "a|b" value into two half-icons', () => {
      const result = applyPlaceholder('%game.elementHalf.x:fire|ice%');
      expect(result).toContain('element/fire.svg');
      expect(result).toContain('element/ice.svg');
      expect(result).toContain('element-half-placeholder');
    });

    it('area parses "(x,y,type)" hex tokens into positioned spans', () => {
      const result = applyPlaceholder('%game.action.area:(0,0,target)|(1,0,active)%');
      expect(result).toContain('placeholder-area');
      expect((result.match(/class="hex"/g) || []).length).toEqual(2);
      expect(result).toContain('hex/target.svg');
      expect(result).toContain('hex/active.svg');
    });

    it('areaRotated adds an inline rotation style', () => {
      const result = applyPlaceholder('%game.action.areaRotated:(0,0,target)%');
      expect(result).toContain('transform:rotate(-90deg)');
    });

    it('initiative renders the value alongside the initiative icon', () => {
      const result = applyPlaceholder('%game.initiative.42%');
      expect(result).toEqual(
        '<span class="placeholder-initiative">42<img class="ghs-svg" src="./assets/images/initiative.svg"></span></span>'
      );
    });

    it('a generic 4-part action placeholder (not valueSign) renders a perk-style icon', () => {
      const result = applyPlaceholder('%game.action.attack.perkid%');
      expect(result).toContain('placeholder-perk');
      expect(result).toContain('action/attack/perkid.svg');
    });

    it('game.items renders an item-slot icon', () => {
      const result = applyPlaceholder('%game.items.head.slot%');
      expect(result).toContain('placeholder-item-slot');
      expect(result).toContain('items/head/slot.svg');
    });

    it('game.itemFh with a numeric id zero-pads to 3 digits', () => {
      const result = applyPlaceholder('%game.itemFh.7%');
      expect(result).toContain('<span class="value">007</span>');
    });

    it('game.itemFh "random" renders the random-item icon', () => {
      const result = applyPlaceholder('%game.itemFh.random%');
      expect(result).toContain('random_item.svg');
    });

    it('card renders the action-card artwork plus overlay', () => {
      const result = applyPlaceholder('%game.card.42:3%');
      expect(result).toContain('action/card/42.svg');
      expect(result).toContain('card-overlay');
      expect(result).toContain('<span class="card-value">3</span>');
    });

    it('attackmodifier renders its icon for a normal type', () => {
      const result = applyPlaceholder('%game.attackmodifier.plus1%');
      expect(result).toContain('attackmodifier/icons/plus1.png');
    });

    it('attackmodifier "rolling"/"target" use the condition-icon style instead', () => {
      const result = applyPlaceholder('%game.attackmodifier.rolling%');
      expect(result).toContain('class="condition-icon"');
      expect(result).toContain('attackmodifier/rolling.svg');
    });

    it('amDeck "M"/"A" render the literal deck letter (no character lookup)', () => {
      expect(applyPlaceholder('%game.amDeck.M%')).toContain('placeholder-am-deck">M<');
      expect(applyPlaceholder('%game.amDeck.A%')).toContain('placeholder-am-deck">A<');
    });

    it('customAction renders a custom effect icon', () => {
      const result = applyPlaceholder('%game.customAction:something%');
      expect(result).toContain('action/custom/something.svg');
    });

    it('experience renders with a value span when given, without when omitted', () => {
      expect(applyPlaceholder('%game.experience:4%')).toContain('<span class="value">4</span>');
      expect(applyPlaceholder('%game.experience%')).not.toContain('class="value"');
    });

    it('monsterType with 3 parts resolves via the label fallback', () => {
      const result = applyPlaceholder('%game.monsterType.elite%');
      expect(result).toEqual('<span class="placeholder-monster-type elite">game.monster.elite</span>');
    });

    it('monsterType with 4 parts uses the explicit 4th segment as the label text', () => {
      const result = applyPlaceholder('%game.monsterType.elite.Custom%');
      expect(result).toEqual('<span class="placeholder-monster-type elite">Custom</span>');
    });

    it('mapMarker renders an element icon or a plain marker label', () => {
      expect(applyPlaceholder('%game.mapMarker.element:fire%')).toContain('element/fire.svg');
      expect(applyPlaceholder('%game.mapMarker.custom%')).toEqual('<span class="map-marker">custom</span>');
    });

    it('scenarioNumber wraps the value in a scenario-number span', () => {
      expect(applyPlaceholder('%game.scenarioNumber:12%')).toEqual('<span class="scenario-number">12</span>');
    });

    it('checkmark and prosperity render fixed icon markup', () => {
      expect(applyPlaceholder('%game.checkmark%')).toContain('check.svg');
      expect(applyPlaceholder('%game.prosperity%')).toContain('prosperity.svg');
    });

    it('valueSign renders a signed value, with no leading + omitted for -1', () => {
      expect(applyPlaceholder('%game.valueSign:3%')).toEqual('<span class="value-sign">+3</span>');
      expect(applyPlaceholder('%game.valueSign:-1%')).toEqual('<span class="value-sign">-1</span>');
    });

    it('trait renders the trait icon and (when given) its label', () => {
      const result = applyPlaceholder('%game.trait:brute%');
      expect(result).toContain('traits/trait.svg');
      expect(result).toContain('data.character.traits.brute');
    });

    it('overlayCustomText falls back to a blank line when no matching conclusion exists', () => {
      expect(applyPlaceholder('%game.overlayCustomText.gh:12%')).toEqual('___________________');
    });

    it('overlayCustomText renders the custom text of a matching conclusion', () => {
      gameManager.game.party.conclusions = [{ index: '12', edition: 'gh', group: undefined, custom: 'my custom text' } as any];
      expect(applyPlaceholder('%game.overlayCustomText.gh:12%')).toEqual(
        '<span class="placeholder-overlay-custom-text">my custom text</span>'
      );
    });

    it('tooltip wraps a label and its ".tooltip" text in a hint container', () => {
      const result = applyPlaceholder('%game.tooltip:some.key%');
      expect(result).toContain('hint-container');
      expect(result).toContain('hint-trigger');
    });

    it('fh style switches condition text to a zero-width space and adds the fh image path', () => {
      settingsManager.settings.fhStyle = true;
      const result = applyPlaceholder('%game.condition.poison%');
      expect(result).toContain('fh/condition/poison.svg');
      expect(result).toContain('placeholder-condition fh');
    });
  });

  describe('applyMathFunctionLabels', () => {
    it('leaves plain expressions without Math.* calls unchanged', () => {
      expect(applyMathFunctionLabels('L+1')).toEqual('L+1');
    });

    it('substitutes Math.floor(X) with "X <label>"', () => {
      expect(applyMathFunctionLabels('Math.floor(3.5)')).toEqual('3.5 game.custom.math.floor');
    });

    it('substitutes Math.abs(X) with |X|', () => {
      expect(applyMathFunctionLabels('Math.abs(X)')).toEqual('|X|');
    });

    it('substitutes Math.pow(X,N) with X^N', () => {
      expect(applyMathFunctionLabels('Math.pow(2,3)')).toEqual('2^3');
    });

    it('recursively processes nested Math.* calls in arguments', () => {
      expect(applyMathFunctionLabels('Math.abs(Math.pow(2,3))')).toEqual('|2^3|');
    });

    it('preserves surrounding text outside the Math.* call', () => {
      expect(applyMathFunctionLabels('damage Math.floor(X) total')).toEqual('damage X game.custom.math.floor total');
    });
  });

  describe('applyValueCalc', () => {
    it('evaluates a bracketed expression to a number string when calculate is on', () => {
      gameManager.game.level = 3;
      expect(applyValueCalc('[L+1]', false)).toEqual('4');
    });

    it('renders the bracketed expression as display text when relative=true', () => {
      expect(applyValueCalc('[L+1]', true)).toEqual('L+1');
    });

    it('renders the bracketed expression as display text when calculate is off', () => {
      settingsManager.settings.calculate = false;
      expect(applyValueCalc('[L+1]', false)).toEqual('L+1');
    });

    it('applies Math.*() label substitution within a bracketed display expression', () => {
      settingsManager.settings.calculate = false;
      expect(applyValueCalc('[Math.floor(3.5)]', false)).toEqual('3.5 game.custom.math.floor');
    });
  });
});
