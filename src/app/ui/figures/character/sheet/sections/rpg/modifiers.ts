import { NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { AttackModifier, AttackModifierType, AttackModifierValueType } from 'src/app/game/model/data/AttackModifier';
import { CharacterSheetSection } from 'src/app/ui/figures/character/sheet/sections/section';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

const AM_ORDER: AttackModifierType[] = [
  AttackModifierType.null,
  AttackModifierType.minus2,
  AttackModifierType.minus1,
  AttackModifierType.plus0,
  AttackModifierType.plus1,
  AttackModifierType.plus2,
  AttackModifierType.plus3,
  AttackModifierType.plus4,
  AttackModifierType.double
];

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-character-sheet-rpg-modifiers',
  templateUrl: 'modifiers.html',
  styleUrls: ['./rpg.scss', './modifiers.scss']
})
export class CharacterSheetRpgModifiersComponent extends CharacterSheetSection implements OnInit {
  private ghsManager = inject(GhsManager);

  modifiers: AttackModifier[] = [];
  modifierRows: number = 10;

  constructor() {
    super();
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.modifiers = this.character.attackModifierDeck.cards
      .filter((attackModifier) => AM_ORDER.includes(attackModifier.type))
      .sort(
        (a, b) =>
          AM_ORDER.indexOf(a.type) - AM_ORDER.indexOf(b.type) ||
          (a.attribute || 0) - (b.attribute || 0) ||
          (a.effects?.length || 0) - (b.effects?.length || 0)
      );
    this.modifierRows = Math.max(1, Math.ceil(this.modifiers.length / 2));
  }

  modifierLabel(attackModifier: AttackModifier): string {
    switch (attackModifier.type) {
      case AttackModifierType.null:
        return 'Null';
      case AttackModifierType.double:
        return 'x2';
      default:
        return (attackModifier.valueType === AttackModifierValueType.minus ? '-' : '+') + attackModifier.value;
    }
  }
}
