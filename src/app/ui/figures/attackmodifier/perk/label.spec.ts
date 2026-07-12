import { TestBed } from '@angular/core/testing';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import {
  AttackModifier,
  AttackModifierEffect,
  AttackModifierEffectType,
  AttackModifierType,
  AttackModifierValueType
} from 'src/app/game/model/data/AttackModifier';
import { Perk, PerkCard, PerkType } from 'src/app/game/model/data/Perks';
import { PerkLabelComponent } from 'src/app/ui/figures/attackmodifier/perk/label';

// PerkLabelComponent has no injected dependencies beyond its required `perk` input, so it's cheaply
// constructible. Following the AppComponent.spec.ts pattern: create via TestBed, never call
// fixture.detectChanges() (ngOnInit never runs — we call calcPerkLabel()/attackModifierHtml()/
// attackModifierEffectHtml() directly instead). Assertions use toContain on the generated HTML
// fragments (icon/label markers) rather than exact-string matches, since the full markup isn't the
// interesting part of this pure-computation logic — the branch selection is.

function createComponent(perk: Perk): PerkLabelComponent {
  const fixture = TestBed.createComponent(PerkLabelComponent);
  fixture.componentRef.setInput('perk', perk);
  return fixture.componentInstance;
}

describe('PerkLabelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PerkLabelComponent] }).compileComponents();
    settingsManager.settings.fhStyle = false;
  });

  describe('attackModifierHtml', () => {
    it('renders a plus value icon', () => {
      const component = createComponent(new Perk());
      const html = component.attackModifierHtml(new AttackModifier(AttackModifierType.plus, 3));
      expect(html).toContain('+3');
    });

    it('renders a minus value icon', () => {
      const component = createComponent(new Perk());
      const html = component.attackModifierHtml(new AttackModifier(AttackModifierType.minus, 2, AttackModifierValueType.minus));
      expect(html).toContain('-2');
    });

    it('renders the null icon for a null modifier', () => {
      const component = createComponent(new Perk());
      const html = component.attackModifierHtml(new AttackModifier(AttackModifierType.null));
      expect(html).toContain('null.svg');
    });

    it('renders "+X" for a plusX modifier', () => {
      const component = createComponent(new Perk());
      const html = component.attackModifierHtml(new AttackModifier(AttackModifierType.plusX));
      expect(html).toContain('+X');
    });

    it('renders a multiply value icon', () => {
      const component = createComponent(new Perk());
      const html = component.attackModifierHtml(new AttackModifier(AttackModifierType.plus, 2, AttackModifierValueType.multiply));
      expect(html).toContain('2x');
    });

    it('includes the rolling icon for a rolling modifier (non-fh style)', () => {
      const component = createComponent(new Perk());
      const am = Object.assign(new AttackModifier(AttackModifierType.plus1, 1), { rolling: true });
      const html = component.attackModifierHtml(am);
      expect(html).toContain('rolling.svg');
    });

    it('includes the shuffle icon for a shuffled modifier', () => {
      const component = createComponent(new Perk());
      const am = Object.assign(new AttackModifier(AttackModifierType.plus1, 1), { shuffle: true });
      const html = component.attackModifierHtml(am);
      expect(html).toContain('shuffle.svg');
    });
  });

  describe('attackModifierEffectHtml', () => {
    it('renders a condition effect with its icon', () => {
      const component = createComponent(new Perk());
      const html = component.attackModifierEffectHtml(new AttackModifierEffect(AttackModifierEffectType.condition, 'poison'));
      expect(html).toContain('condition/poison.svg');
    });

    it('renders an element effect with its icon', () => {
      const component = createComponent(new Perk());
      const html = component.attackModifierEffectHtml(new AttackModifierEffect(AttackModifierEffectType.element, 'fire'));
      expect(html).toContain('element/fire.svg');
    });

    it('renders a custom effect with a hint label', () => {
      const component = createComponent(new Perk());
      const effect = Object.assign(new AttackModifierEffect(AttackModifierEffectType.custom, 'foo'), { hint: 'my.hint' });
      const html = component.attackModifierEffectHtml(effect);
      expect(html).toContain('custom-hint');
    });

    it('wraps an "or" effect group and joins with the or label', () => {
      const component = createComponent(new Perk());
      const effect = Object.assign(new AttackModifierEffect(AttackModifierEffectType.or, ''), {
        effects: [
          new AttackModifierEffect(AttackModifierEffectType.element, 'fire'),
          new AttackModifierEffect(AttackModifierEffectType.element, 'ice')
        ]
      });
      const html = component.attackModifierEffectHtml(effect);
      expect(html.startsWith('"')).toBe(true);
      expect(html).toContain('element/fire.svg');
      expect(html).toContain('element/ice.svg');
    });
  });

  describe('calcPerkLabel', () => {
    it('is empty with no cards', () => {
      const component = createComponent(new Perk());
      expect(component.calcPerkLabel(new Perk())).toEqual([]);
    });

    it('is a single-entry label for a single card', () => {
      const perk = Object.assign(new Perk(), { cards: [new PerkCard()] });
      const component = createComponent(perk);
      expect(component.calcPerkLabel(perk).length).toEqual(1);
    });

    it('combines a pair of cards into a single "additional" label', () => {
      const perk = Object.assign(new Perk(), { cards: [new PerkCard(), new PerkCard()] });
      const component = createComponent(perk);
      expect(component.calcPerkLabel(perk).length).toEqual(1);
    });

    it('is empty for a 4-card, non-replace perk (no card-count bucket matches 4)', () => {
      const perk = Object.assign(new Perk(), { cards: [new PerkCard(), new PerkCard(), new PerkCard(), new PerkCard()] });
      const component = createComponent(perk);
      expect(component.calcPerkLabel(perk).length).toEqual(0);
    });

    it('a replace perk with replace=1 and 2 cards lists both cards plus a combined "additional" entry', () => {
      const perk = Object.assign(new Perk(), { type: PerkType.replace, replaceCount: 1, cards: [new PerkCard(), new PerkCard()] });
      const component = createComponent(perk);
      expect(component.calcPerkLabel(perk).length).toEqual(3);
    });
  });
});
