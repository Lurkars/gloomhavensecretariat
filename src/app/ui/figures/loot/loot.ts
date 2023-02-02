import { Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Loot, LootType } from "src/app/game/model/Loot";

@Component({
    selector: 'ghs-loot',
    templateUrl: './loot.html',
    styleUrls: ['./loot.scss']
})
export class LootComponent implements OnInit, OnChanges {

    @Input() loot!: Loot;
    @Input() disableFlip: boolean = false;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;

    gameManager: GameManager = gameManager;
    LootType = LootType;

    revealed: boolean = false;
    animate: boolean = false;

    ngOnInit(): void {
        this.animate = !this.disableFlip;
    }

    onChange(revealed: boolean) {
        this.revealed = revealed;
    }

    ngOnChanges(changes: SimpleChanges): void {
        const flipped = changes['flipped'];
        if (flipped && !this.disableFlip && flipped.currentValue && flipped.currentValue != flipped.previousValue) {
            this.animate = true;
        }
    }
}