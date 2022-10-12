import { Component, Input } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Ability } from "src/app/game/model/Ability";
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
  @Input() monster!: Monster;
  @Input() flipped: boolean = false;
  @Input() reveal: boolean = false;
  @Input() relative: boolean = false;
  @Input() highlightElements: boolean = false;
  @Input() statsCalculation: boolean = true;
  

  settingsManager: SettingsManager = settingsManager;

  abilityIndex(ability: Ability) {
    if (this.abilities && this.abilities.length > 0) {
      return this.abilities.indexOf(ability);
    }
    return gameManager.abilities(this.monster).indexOf(ability);
  }

  abilityLabel(ability: Ability): string {
    let label = 'data.monster.' + this.monster.name;
    if (ability?.name) {
      label = 'data.ability.' + ability.name;
    } else if (this.monster.deck != this.monster.name) {
      label = 'data.deck.' + this.monster.deck;
      if (label.split('.')[label.split('.').length - 1] === applyPlaceholder(settingsManager.getLabel(label)) && this.monster.deck) {
        label = 'data.monster.' + this.monster.deck;
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