import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { PetCard } from 'src/app/game/model/data/PetCard';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { CardRevealDirective } from 'src/app/ui/helper/CardReveal';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [ActionComponent, CardRevealDirective, GhsLabelDirective, NgClass, PointerInputDirective],
  selector: 'ghs-pet-card',
  templateUrl: './pet-card.html',
  styleUrls: ['./pet-card.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PetCardComponent implements AfterViewInit {
  private elementRef = inject(ElementRef);
  private ghsManager = inject(GhsManager);

  private cdr = inject(ChangeDetectorRef);

  @Input() petCard!: PetCard | undefined;
  @Input() flipped: boolean = false;
  @Input() reveal: boolean = false;
  @Input() name: string = '';
  @Output() revealed = new EventEmitter<boolean>();

  settingsManager: SettingsManager = settingsManager;
  gameManager: GameManager = gameManager;
  fontsize: string = '1em';

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.fontsize = this.elementRef.nativeElement.offsetWidth * 0.072 + 'px';
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.fontsize = this.elementRef.nativeElement.offsetWidth * 0.072 + 'px';
      this.cdr.markForCheck();
    }, 1);
  }
}
