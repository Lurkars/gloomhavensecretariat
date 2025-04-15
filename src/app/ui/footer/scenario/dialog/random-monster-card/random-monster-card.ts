import { Component, Input, OnInit } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { Element } from "src/app/game/model/data/Element";
import { MonsterData } from "src/app/game/model/data/MonsterData";
import { MonsterStandeeData } from "src/app/game/model/data/RoomData";
import { ScenarioData, ScenarioOverlay } from "src/app/game/model/data/ScenarioData";

@Component({
    standalone: false,
    selector: 'ghs-random-monster-card',
    templateUrl: './random-monster-card.html',
    styleUrls: ['./random-monster-card.scss']
})
export class RandomMonsterCardComponent implements OnInit {

    @Input() section!: ScenarioData;
    @Input() flipped: boolean = false;

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
        this.fh = this.section.edition == 'fh' || gameManager.editionExtensions(this.section.edition).indexOf('fh') != -1;
        this.element = this.section.rules && this.section.rules.find((rule) => rule.elements && rule.elements.length)?.elements[0].type as Element || undefined;
        this.standees = [];
        if (this.section.rooms.length && this.section.rooms[0] && this.section.rooms[0].monster) {
            this.section.rooms[0].monster.forEach((standee) => {
                if (!isNaN(+standee.marker)) {
                    this.standees[+standee.marker - 1] = standee;
                    const monster = gameManager.monstersData().find((monsterData) => monsterData.name == standee.name && (monsterData.edition == this.section.edition || gameManager.editionExtensions(this.section.edition).indexOf(monsterData.edition) != -1));
                    if (monster) {
                        this.monster[+standee.marker - 1] = monster;
                    }
                }
            })
        }
        this.overlays = [];
        if (this.section.overlays) {
            this.section.overlays.forEach((overlay) => {
                if (!isNaN(+overlay.marker)) {
                    this.overlays[+overlay.marker - 1] = overlay;
                }
            })
        }
    }
}