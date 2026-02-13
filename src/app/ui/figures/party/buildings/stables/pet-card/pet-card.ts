import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnInit, Output } from "@angular/core";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { GhsManager } from "src/app/game/businesslogic/GhsManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { PetCard } from "src/app/game/model/data/PetCard";

@Component({
    standalone: false,
    selector: 'ghs-pet-card',
    templateUrl: './pet-card.html',
    styleUrls: ['./pet-card.scss']
})
export class PetCardComponent implements OnInit, AfterViewInit {
    private cdr = inject(ChangeDetectorRef);

    @Input() petCard!: PetCard | undefined;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() name: string = "";
    @Output() revealed = new EventEmitter<boolean>();

    settingsManager: SettingsManager = settingsManager;
    gameManager: GameManager = gameManager;
    fontsize: string = "1em";

    constructor(private elementRef: ElementRef, private ghsManager: GhsManager) {
        this.ghsManager.uiChangeEffect(() => {
            this.fontsize = (this.elementRef.nativeElement.offsetWidth * 0.072) + 'px';
        });
    }

    ngOnInit(): void {
    }


    ngAfterViewInit(): void {
        setTimeout(() => {
            this.fontsize = (this.elementRef.nativeElement.offsetWidth * 0.072) + 'px';
            this.cdr.markForCheck();
        }, 1);
    }
}