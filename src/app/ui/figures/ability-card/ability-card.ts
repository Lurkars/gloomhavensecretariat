import { NgClass } from '@angular/common';
import { Component, inject, input, OnChanges, OnInit, output } from '@angular/core';
import { InteractiveAction } from 'src/app/game/businesslogic/ActionsManager';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { ActionValueType } from 'src/app/game/model/data/Action';
import { Monster } from 'src/app/game/model/Monster';
import { ActionsComponent } from 'src/app/ui/figures/actions/actions';
import { InteractiveActionsComponent } from 'src/app/ui/figures/actions/interactive/interactive-actions';
import { CardRevealDirective } from 'src/app/ui/helper/CardReveal';
import { applyPlaceholder, GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective, CardRevealDirective, ActionsComponent, InteractiveActionsComponent],
  selector: 'ghs-ability-card',
  templateUrl: './ability-card.html',
  styleUrls: ['./ability-card.scss']
})
export class AbilityCardComponent implements OnInit, OnChanges {
  private ghsManager = inject(GhsManager);

  readonly inputAbilityCard = input<AbilityCard>(undefined, { alias: 'abilityCard' });
  get abilityCard(): AbilityCard | undefined {
    return this.inputAbilityCard();
  }

  readonly inputAbilityCards = input<AbilityCard[]>([], { alias: 'abilityCards' });
  get abilityCards(): AbilityCard[] {
    return this.inputAbilityCards();
  }

  readonly inputMonster = input<Monster>(undefined, { alias: 'monster' });
  get monster(): Monster | undefined {
    return this.inputMonster();
  }

  readonly inputCharacter = input<Character>(undefined, { alias: 'character' });
  get character(): Character | undefined {
    return this.inputCharacter();
  }

  readonly flipped = input<boolean>(false);
  readonly reveal = input<boolean>(false);
  readonly relative = input<boolean>(false);
  readonly interactiveAbilities = input<boolean>(false);
  readonly statsCalculation = input<boolean>(true);
  readonly activeActions = input<'top' | 'bottom' | false>(false);
  readonly revealedChanged = output<boolean>();

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ActionValueType = ActionValueType;

  deckLabel: string = '';
  abilityIndex: number = -1;
  abilityLabel: string = '';
  identityColor: string | undefined;
  identityIcon: string = '';
  identityInitiatives: { identity: number; initiative: number; icon: string; color: string }[] = [];
  shieldStats: boolean = false;
  fh: boolean = false;

  interactiveActions: InteractiveAction[] = [];
  interactiveBottomActions: InteractiveAction[] = [];

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
    if (this.monster) {
      const deck =
        this.monster.statEffect && this.monster.statEffect.deck && !this.monster.statEffect.deck.startsWith(this.monster.name)
          ? this.monster.statEffect.deck
          : this.monster.deck
            ? this.monster.deck
            : this.monster.name;
      this.deckLabel = 'data.deck.' + deck;
      if (deck === settingsManager.getLabel(this.deckLabel)) {
        this.deckLabel = 'data.monster.' + deck;
      }
    } else if (this.character) {
      const deck = this.character.deck ? this.character.deck : this.character.name;
      this.deckLabel = 'data.deck.' + deck;
      if (deck === settingsManager.getLabel(this.deckLabel)) {
        this.deckLabel = 'data.character.' + this.character.edition + '.' + deck;
      }
    }
    this.abilityIndex = -1;
    this.abilityLabel = '';
    this.identityColor = undefined;
    this.identityIcon = '';
    this.identityInitiatives = [];
    if (this.abilityCard) {
      this.abilityIndex = this.getAbilityIndex(this.abilityCard);
      this.abilityLabel = this.getAbilityLabel(this.abilityCard);
      const identityInitiative = this.abilityCard.identityInitiative;
      if (this.character && identityInitiative) {
        const characterName = this.character.name;
        this.identityInitiatives = identityInitiative.map((initiative, identity) => ({
          identity: identity,
          initiative: initiative,
          icon: gameManager.characterManager.characterIdentityIcon(characterName, identity),
          color: gameManager.characterManager.characterIdentityColor(characterName, identity)
        }));
      }
      if (this.character && this.abilityCard.identity !== undefined && this.character.identities.length > this.abilityCard.identity) {
        this.identityIcon = gameManager.characterManager.characterIdentityIcon(this.character.name, this.abilityCard.identity);
        const identityColor = this.character.identityColors[this.abilityCard.identity];
        if (identityColor && identityColor !== this.character.color) {
          this.identityColor = identityColor;
        }
      }
    }
    this.fh = (this.character && gameManager.isEditionRelevant(this.character.edition, 'fh')) || false;
    this.shieldStats = settingsManager.settings.calculateShieldStats;
  }

  getAbilityIndex(abilityCard: AbilityCard): number {
    if (this.abilityCards && this.abilityCards.length > 0) {
      return this.abilityCards.indexOf(abilityCard);
    } else if (this.monster) {
      return gameManager.abilityCards(this.monster).indexOf(abilityCard);
    }
    return -1;
  }

  getAbilityLabel(abilityCard: AbilityCard): string {
    let label = abilityCard.name || '';

    if (label) {
      label = 'data.ability.' + label;
    } else {
      label = this.deckLabel;
    }

    return applyPlaceholder(settingsManager.getLabel(label));
  }

  onChange(revealed: boolean) {
    if (this.abilityCard) {
      this.abilityCard.revealed = revealed;
    }
    this.revealedChanged.emit(revealed);
  }

  onInteractiveActionsChange(change: InteractiveAction[]) {
    if (this.interactiveAbilities()) {
      this.interactiveActions = change;
    }
  }

  onInteractiveBottomActionsChange(change: InteractiveAction[]) {
    if (this.interactiveAbilities()) {
      this.interactiveBottomActions = change;
    }
  }
}
