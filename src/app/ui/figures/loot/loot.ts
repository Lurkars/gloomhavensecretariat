import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Loot, LootType } from "src/app/game/model/Loot";

@Component({
    selector: 'ghs-loot',
    templateUrl: './loot.html',
    styleUrls: ['./loot.scss']
})
export class LootComponent implements OnChanges {

    @Input() loot!: Loot;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;

    LootType = LootType;

    revealed: boolean = false;
    animate: boolean = false;

    onChange(revealed: boolean) {
        this.revealed = revealed;
    }

    ngOnChanges(changes: SimpleChanges): void {
        const flipped = changes['flipped'];
        if (flipped && !flipped.firstChange && flipped.currentValue != flipped.previousValue) {
            this.animate = true;
        }
    }
}