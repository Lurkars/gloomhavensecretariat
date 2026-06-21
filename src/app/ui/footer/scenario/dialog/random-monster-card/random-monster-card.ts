import { NgClass } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { Element } from 'src/app/game/model/data/Element';
import { MonsterData } from 'src/app/game/model/data/MonsterData';
import { MonsterStandeeData } from 'src/app/game/model/data/RoomData';
import { ScenarioData, ScenarioOverlay } from 'src/app/game/model/data/ScenarioData';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';

@Component({
  imports: [NgClass, GhsLabelDirective, GhsRangePipe],
  selector: 'ghs-random-monster-card',
  templateUrl: './random-monster-card.html',
  styleUrls: ['./random-monster-card.scss']
})
export class RandomMonsterCardComponent implements OnInit {
  readonly inputSection = input.required<ScenarioData>({ alias: 'section' });
  get section(): ScenarioData {
    return this.inputSection();
  }

  readonly flipped = input<boolean>(false);

  standees: MonsterStandeeData[] = [];
  monster: MonsterData[] = [];
  overlays: ScenarioOverlay[] = [];
  fh: boolean = false;
  element: Element | undefined;

  gameManager: GameManager = gameManager;

  ngOnInit(): void {
    this.update();
  }

  update() {
    this.fh = gameManager.isEditionRelevant(this.section.edition, 'fh');
    this.element =
      (this.section.rules && (this.section.rules.find((rule) => rule.elements && rule.elements.length)?.elements[0].type as Element)) ||
      undefined;
    this.standees = [];
    if (this.section.rooms.length && this.section.rooms[0] && this.section.rooms[0].monster) {
      this.section.rooms[0].monster.forEach((standee) => {
        if (!isNaN(+standee.marker)) {
          this.standees[+standee.marker - 1] = standee;
          const monster = gameManager
            .monstersData()
            .find(
              (monsterData) => monsterData.name === standee.name && gameManager.isEditionRelevant(this.section.edition, monsterData.edition)
            );
          if (monster) {
            this.monster[+standee.marker - 1] = monster;
          }
        }
      });
    }
    this.overlays = [];
    if (this.section.overlays) {
      this.section.overlays.forEach((overlay) => {
        if (!isNaN(+overlay.marker)) {
          this.overlays[+overlay.marker - 1] = overlay;
        }
      });
    }
  }
}
