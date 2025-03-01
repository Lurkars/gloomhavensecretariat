import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { PetCard } from "src/app/game/model/data/PetCard";

@Component({
    standalone: false,
    selector: 'ghs-pet-card',
    templateUrl: './pet-card.html',
    styleUrls: ['./pet-card.scss']
})
export class PetCardComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('container') containerElement!: ElementRef;
    @Input() petCard!: PetCard | undefined;
    @Input() flipped: boolean = false;
    @Input() reveal: boolean = false;
    @Input() name: string = "";
    @Output() revealed = new EventEmitter<boolean>();

    settingsManager: SettingsManager = settingsManager;
    gameManager: GameManager = gameManager;
    fontsize: string = "1em";

    ngOnInit(): void {
        this.uiChangeSubscription = gameManager.uiChange.subscribe({
            next: () => {
                this.fontsize = (this.containerElement.nativeElement.offsetWidth * 0.072) + 'px';;
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
            this.fontsize = (this.containerElement.nativeElement.offsetWidth * 0.072) + 'px';
        }, 1);
    }
}