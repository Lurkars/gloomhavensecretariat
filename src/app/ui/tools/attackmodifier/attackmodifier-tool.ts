import { Component, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { AttackModifier, defaultAttackModifier } from "src/app/game/model/AttackModifier";
import { Character } from "src/app/game/model/Character";
import { PerkType } from "src/app/game/model/Perks";

@Component({
  selector: 'ghs-attackmodifier-tool',
  templateUrl: './attackmodifier-tool.html',
  styleUrls: [ './attackmodifier-tool.scss' ]
})
export class AttackModifierToolComponent implements OnInit {

  characters: Character[] = [];

  async ngOnInit() {
    await settingsManager.init();
    gameManager.stateManager.init();
    gameManager.charactersData().forEach((characterData) => {
      let character = new Character(characterData, 0);

      character.attackModifierDeck.cards = [];

      let perkId = 0;
      character.perks.forEach((perk) => {
        if (perk.cards) {
          perk.cards.forEach((card, index) => {
            if (perk.type == PerkType.add || perk.type == PerkType.replace) {
              let am = Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier);
              am.id = "perk" + perkId;
              if (!gameManager.attackModifierManager.findByAttackModifier(defaultAttackModifier, am) || perk.type == PerkType.add || index > 0) {
                am.character = true;
              }
              if (am.character) {
                if (!gameManager.attackModifierManager.findByAttackModifier(character.attackModifierDeck.cards, am)) {
                  perkId++;
                }
                for (let i = 0; i < card.count * perk.count; i++) {
                  character.attackModifierDeck.cards.push(am);
                }
              }
            }
          })
        }
      })

      this.characters.push(character);
    })
    this.characters.sort((a, b) => {
      if (a.edition != b.edition) {
        return a.edition < b.edition ? -1 : 1;
      } else {
        let aName = settingsManager.getLabel('data.character.' + a.name).toLowerCase();
        let bName = settingsManager.getLabel('data.character.' + b.name).toLowerCase();
        return aName < bName ? -1 : 1;
      }
    })
  }

}
