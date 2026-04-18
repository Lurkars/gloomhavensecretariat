import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnInit } from '@angular/core';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Ability } from 'src/app/game/model/data/Ability';
import { ActionValueType } from 'src/app/game/model/data/Action';
import { Monster } from 'src/app/game/model/Monster';
import { ActionsComponent } from 'src/app/ui/figures/actions/actions';
import { InteractiveActionsComponent } from 'src/app/ui/figures/actions/interactive/interactive-actions';
import { CardRevealDirective } from 'src/app/ui/helper/CardReveal';
import { applyPlaceholder, GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective, CardRevealDirective, ActionsComponent, InteractiveActionsComponent],
  selector: 'ghs-ability',
  templateUrl: './ability.html',
  styleUrls: ['./ability.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AbilityComponent implements OnInit, OnChanges {
  elementRef = inject(ElementRef);
  private ghsManager = inject(GhsManager);

  @Input() ability: Ability | undefined;
  @Input() abilities!: Ability[];
  @Input() monster: Monster | undefined;
  @Input() character: Character | undefined;
  @Input() flipped: boolean = false;
  @Input() reveal: boolean = false;
  @Input() relative: boolean = false;
  @Input() interactiveAbilities: boolean = false;
  @Input() statsCalculation: boolean = true;
  @Input() activeActions: 'top' | 'bottom' | false = false;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ActionValueType = ActionValueType;

  deckLabel: string = '';
  abilityIndex: number = -1;
  abilityLabel: string = '';
  shieldStats: boolean = false;
  fh: boolean = false;

  interactiveActions: InteractiveAction[] = [];
  interactiveActionsChange = new EventEmitter<InteractiveAction[]>();
  interactiveBottomActions: InteractiveAction[] = [];
  interactiveBottomActionsChange = new EventEmitter<InteractiveAction[]>();

  fontsize: string = '';

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
  }

  ngOnInit() {
    this.update();
  }

  ngOnChanges(): void {
    this.update();
  }

  update() {
    this.fontsize = this.elementRef.nativeElement.offsetWidth * 0.04 + 'px';
    if (this.monster) {
      const deck =
        this.monster.statEffect && this.monster.statEffect.deck && !this.monster.statEffect.deck.startsWith(this.monster.name)
          ? this.monster.statEffect.deck
          : this.monster.deck
            ? this.monster.deck
            : this.monster.name;
      this.deckLabel = 'data.deck.' + deck;
      if (deck == settingsManager.getLabel(this.deckLabel)) {
        this.deckLabel = 'data.monster.' + deck;
      }
    } else if (this.character) {
      const deck = this.character.deck ? this.character.deck : this.character.name;
      this.deckLabel = 'data.deck.' + deck;
      if (deck == settingsManager.getLabel(this.deckLabel)) {
        this.deckLabel = 'data.character.' + this.character.edition + '.' + deck;
      }
    }
    this.abilityIndex = -1;
    this.abilityLabel = '';
    if (this.ability) {
      this.abilityIndex = this.getAbilityIndex(this.ability);
      this.abilityLabel = this.getAbilityLabel(this.ability);
    }
    this.fh =
      (this.character && (this.character.edition == 'fh' || gameManager.editionExtensions(this.character.edition).includes('fh'))) || false;
    this.shieldStats = settingsManager.settings.calculateShieldStats;
  }

  getAbilityIndex(ability: Ability): number {
    if (this.abilities && this.abilities.length > 0) {
      return this.abilities.indexOf(ability);
    } else if (this.monster) {
      return gameManager.abilities(this.monster).indexOf(ability);
    }
    return -1;
  }

  getAbilityLabel(ability: Ability): string {
    let label = ability.name || '';

    if (label) {
      label = 'data.ability.' + label;
    } else {
      label = this.deckLabel;
    }

    return applyPlaceholder(settingsManager.getLabel(label));
  }

  onChange(revealed: boolean) {
    if (this.ability) {
      this.ability.revealed = revealed;
    }
  }

  onInteractiveActionsChange(change: InteractiveAction[]) {
    if (this.interactiveAbilities) {
      this.interactiveActionsChange.emit(change);
      this.interactiveActions = change;
    }
  }

  onInteractiveBottomActionsChange(change: InteractiveAction[]) {
    if (this.interactiveAbilities) {
      this.interactiveBottomActionsChange.emit(change);
      this.interactiveBottomActions = change;
    }
  }
}
