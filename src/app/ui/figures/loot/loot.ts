import { Component, Input } from "@angular/core";
import { Loot, LootType } from "src/app/game/model/Loot";

@Component({
    selector: 'ghs-loot',
    templateUrl: './loot.html',
    styleUrls: ['./loot.scss']
})
export class LootComponent {

    @Input() loot!: Loot;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;

    LootType = LootType;

    revealed: boolean = false;

    onChange(revealed: boolean) {
        this.revealed = revealed;
    }
}