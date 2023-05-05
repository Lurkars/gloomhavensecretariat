import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Ability } from "src/app/game/model/data/Ability";
import { Character } from "src/app/game/model/Character";
import { Monster } from "src/app/game/model/Monster";
import { applyPlaceholder } from "../../helper/i18n";
import { Subscription } from "rxjs";


@Component({
  selector: 'ghs-ability',
  templateUrl: './ability.html',
  styleUrls: ['./ability.scss']
})
export class AbilityComponent implements OnInit, OnDestroy, OnChanges {

  @Input() ability: Ability | undefined;
  @Input() abilities!: Ability[];
  @Input() monster: Monster | undefined;
  @Input() character: Character | undefined;
  @Input() flipped: boolean = false;
  @Input() reveal: boolean = false;
  @Input() relative: boolean = false;
  @Input() highlightElements: boolean = false;
  @Input() statsCalculation: boolean = true;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  abilityIndex: number = -1;
  abilityLabel: string = "";

  ngOnInit() {
    this.update();
    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => {
        this.update();
      }
    });
  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  update() {
    this.abilityIndex = -1;
    this.abilityLabel = "";
    if (this.ability) {
      this.abilityIndex = this.getAbilityIndex(this.ability);
      this.abilityLabel = this.getAbilityLabel(this.ability);
    }
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
    let label = ability.name || "";

    if (label) {
      label = 'data.ability.' + label;
    } else if (this.monster && this.monster.deck && this.monster.deck != this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(settingsManager.getLabel(label)) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
      }
    } else if (this.monster) {
      label = 'data.monster.' + this.monster.name;
    }

    return applyPlaceholder(settingsManager.getLabel(label));
  }

  onChange(revealed: boolean) {
    if (this.ability) {
      this.ability.revealed = revealed;
    }
  }
}