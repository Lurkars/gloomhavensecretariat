import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { gameManager, GameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Character } from 'src/app/game/model/Character';
import { Subscription } from 'rxjs';


@Component({
	standalone: false,
  selector: 'ghs-attackmodifier-draw',
  templateUrl: './attackmodifier-draw.html',
  styleUrls: ['./attackmodifier-draw.scss']
})
export class AttackModifierDrawComponent implements OnInit, OnDestroy, OnChanges {

  @Input('character') character!: Character;
  @Output('drawing') drawingEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() initTimeout: number = 1500;

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  deck!: AttackModifierDeck;
  numeration: string = "";
  characterIcon: string = "";

  AttackModifierType = AttackModifierType;
  current: number = -1;
  drawing: boolean = false;
  drawTimeout: any = null;
  queue: number = 0;
  queueTimeout: any = null;
  newStyle: boolean = false;

  @ViewChild('drawCard') drawCard!: ElementRef;

  constructor(public element: ElementRef) {
    this.element.nativeElement.addEventListener('click', (event: any) => {
      let elements = document.elementsFromPoint(event.clientX, event.clientY);
      if (elements[0].classList.contains('attack-modifiers') && elements.length > 2) {
        (elements[2] as HTMLElement).click();
      }
    })
  };

  ngOnInit(): void {
    if (this.character) {
      this.deck = this.character.attackModifierDeck;
      this.characterIcon = this.character.iconUrl;
      this.numeration = "" + this.character.number;
      this.newStyle = gameManager.newAmStyle(this.character.edition);
    }


    if (settingsManager.settings.fhStyle) {
      this.newStyle = true;
    }

    this.current = this.deck.current;

    this.uiChangeSubscription = gameManager.uiChange.subscribe({
      next: () => { this.update(); }
    })

  }

  uiChangeSubscription: Subscription | undefined;

  ngOnDestroy(): void {
    if (this.uiChangeSubscription) {
      this.uiChangeSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deck']) {
      this.update()
    }
  }

  update() {
    if (this.character && this.deck != this.character.attackModifierDeck) {
      this.deck = this.character.attackModifierDeck;
    }

    if (this.current < this.deck.current) {
      this.queue = Math.max(0, this.deck.current - this.current);
      if (!this.queueTimeout) {
        this.queue--;
        this.current++;
        this.drawQueue();
      }
    } else if (!this.queueTimeout || this.deck.current < this.current + this.queue) {
      if (this.queueTimeout) {
        clearTimeout(this.queueTimeout);
        this.queueTimeout = null;
      }
      this.queue = 0;
      this.drawing = false;
      this.drawingEmitter.emit(false);
      this.current = this.deck.current;
    }
  }

  drawQueue() {
    this.drawing = true;
    this.drawingEmitter.emit(true);
    this.element.nativeElement.getElementsByClassName('attack-modifier-draw')[0].classList.add('drawing');
    this.queueTimeout = setTimeout(() => {
      this.drawing = false;
      this.drawingEmitter.emit(false);
      this.queueTimeout = null;
      if (this.queue > 0) {
        this.queue--;
        this.current++;
        this.drawQueue();
      } else {
        this.element.nativeElement.getElementsByClassName('attack-modifier-draw')[0].classList.remove('drawing');
        if (this.queue < 0) {
          this.queue = 0;
        }
      }
    }, !settingsManager.settings.animations ? 0 : 2500);
  }
}
