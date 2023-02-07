import { Component, Input } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Ability } from "src/app/game/model/Ability";
import { Character } from "src/app/game/model/Character";
import { Monster } from "src/app/game/model/Monster";
import { applyPlaceholder } from "../../helper/i18n";


@Component({
  selector: 'ghs-ability',
  templateUrl: './ability.html',
  styleUrls: ['./ability.scss']
})
export class AbilityComponent {

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

  abilityIndex(ability: Ability): number {
    if (this.abilities && this.abilities.length > 0) {
      return this.abilities.indexOf(ability);
    } else if (this.monster) {
      return gameManager.abilities(this.monster).indexOf(ability);
    }
    return -1;
  }

  abilityLabel(ability: Ability): string {
    let label = ability.name || "";
    if (!ability.name && this.monster) {
      label = 'data.monster.' + this.monster.name;
      if (ability.name) {
        label = 'data.ability.' + ability.name;
      } else if (this.monster.deck != this.monster.name) {
        label = 'data.deck.' + this.monster.deck;
        if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(settingsManager.getLabel(label)) && this.monster.deck) {
          label = 'data.monster.' + this.monster.deck;
        }
      }
    }

    return applyPlaceholder(settingsManager.getLabel(label));
  }

  onChange(revealed: boolean) {
    if (this.ability) {
      this.ability.revealed = revealed;
    }
  }
}