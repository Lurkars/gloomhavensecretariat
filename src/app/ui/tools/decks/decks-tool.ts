import { Component, OnInit } from "@angular/core";
import { gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { DeckData } from "src/app/game/model/data/DeckData";
import { Monster } from "src/app/game/model/Monster";
import { MonsterType } from "src/app/game/model/MonsterType";

@Component({
  selector: 'ghs-decks-tool',
  templateUrl: './decks-tool.html',
  styleUrls: ['./decks-tool.scss']
})
export class DecksToolComponent implements OnInit {

  settingsManager: SettingsManager = settingsManager;
  decks: DeckData[] = [];
  monsters: (Monster | undefined)[] = [];
  entity: boolean = true;
  elite: boolean = true;
  level: number = 1;

  async ngOnInit() {
    await settingsManager.init();
    gameManager.stateManager.init();

    this.update();
  }

  update() {
    this.decks = gameManager.decksData(true).sort((a, b) => {
      if (a.edition == b.edition) {
        return a.name < b.name ? -1 : 1;
      } else {
        return gameManager.editionData.map((editionData) => editionData.edition).indexOf(a.edition) - gameManager.editionData.map((editionData) => editionData.edition).indexOf(b.edition);
      }
    });

    this.monsters = [];
    if (settingsManager.settings.calculate) {
      this.decks.forEach((deckData) => {
        this.monsters.push(this.monster(deckData.name));
      })
    }
    gameManager.uiChange.emit();
  }

  monster(deck: string): Monster | undefined {
    let monsterData = gameManager.monstersData(true).find((monsterData) => monsterData.name == deck);

    if (!monsterData) {
      monsterData = gameManager.monstersData(true).find((monsterData) => monsterData.deck == deck);
    }

    if (monsterData) {
      const monster = new Monster(monsterData);
      monster.level = this.level;
      if (monster.boss && this.entity) {
        gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.boss);
      }

      if (!monster.boss && this.elite) {
        gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.elite);
      }
      if (!monster.boss && this.entity) {
        gameManager.monsterManager.addMonsterEntity(monster, 2, MonsterType.normal);
      }

      return monster;
    }
    return undefined;
  }

}
