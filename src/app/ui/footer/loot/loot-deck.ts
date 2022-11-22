import { Component, ElementRef, OnInit } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { LootManager } from "src/app/game/businesslogic/LootManager";
import { LootDeck } from "src/app/game/model/Loot";

@Component({
    selector: 'ghs-loot-deck',
    templateUrl: './loot-deck.html',
    styleUrls: ['./loot-deck.scss']
})
export class LootDeckComponent implements OnInit {

    gameManager: GameManager = gameManager;
    lootManager: LootManager = gameManager.lootManager;
    current: number = -1;
    drawing: boolean = false;

    constructor(private element: ElementRef) { };

    ngOnInit(): void {
        this.current = gameManager.game.lootDeck.current;
        gameManager.uiChange.subscribe({
            next: () => {
                this.update();
            }
        })
    }

    update() {
        if (this.current != gameManager.game.lootDeck.current) {
            this.current = gameManager.game.lootDeck.current;
            this.drawing = true;
            this.element.nativeElement.getElementsByClassName('deck')[0].classList.add('drawing');
            setTimeout(() => {
                this.element.nativeElement.getElementsByClassName('deck')[0].classList.remove('drawing');
                this.drawing = false;
            }, 1100);
        }
    }


    draw() {
        this.lootManager.drawCard();
        gameManager.uiChange.emit();
    }
}