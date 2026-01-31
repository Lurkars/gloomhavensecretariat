import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { Subscription } from "rxjs";
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
export class PetCardComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() petCard!: PetCard | undefined;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() name: string = "";
    @Output() revealed = new EventEmitter<boolean>();

    settingsManager: SettingsManager = settingsManager;
    gameManager: GameManager = gameManager;
    fontsize: string = "1em";

    constructor(private elementRef: ElementRef, private ghsManager: GhsManager) { }

    ngOnInit(): void {
        this.uiChangeSubscription = this.ghsManager.onUiChange().subscribe({
            next: () => {
                this.fontsize = (this.elementRef.nativeElement.offsetWidth * 0.072) + 'px';
            }
        })
    }

    uiChangeSubscription: Subscription | undefined;

    ngOnDestroy(): void {
        if (this.uiChangeSubscription) {
            this.uiChangeSubscription.unsubscribe();
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.fontsize = (this.elementRef.nativeElement.offsetWidth * 0.072) + 'px';
        }, 1);
    }
}