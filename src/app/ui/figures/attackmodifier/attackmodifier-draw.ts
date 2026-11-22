import { NgClass } from '@angular/common';
import { Component, inject, input, OnChanges, OnInit, output, SimpleChanges } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { AttackModifierComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier';
import { DeckDrawDirective } from 'src/app/ui/helper/deck-draw';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';

@Component({
  imports: [AttackModifierComponent, NgClass, TrackUUIDPipe],
  selector: 'ghs-attackmodifier-draw',
  templateUrl: './attackmodifier-draw.html',
  styleUrls: ['./attackmodifier-draw.scss']
})
export class AttackModifierDrawComponent extends DeckDrawDirective implements OnInit, OnChanges {
  private ghsManager = inject(GhsManager);
  protected drawingClass: string = 'attack-modifier-draw';
  protected override serverAware: boolean = false;
  override init: boolean = true;

  readonly inputCharacter = input.required<Character>({ alias: 'character' });
  get character(): Character {
    return this.inputCharacter();
  }

  readonly drawingEmitter = output<boolean>({ alias: 'drawing' });
  readonly initTimeout = input<number>(1500);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  deck!: AttackModifierDeck;
  numeration: string = '';
  characterIcon: string = '';

  AttackModifierType = AttackModifierType;
  newStyle: boolean = false;

  constructor() {
    super();
    this.ghsManager.uiChangeEffect((fromServer: boolean) => this.update(fromServer));
    this.clickThrough('attack-modifiers');
  }

  protected deckCurrent(): number {
    return this.deck ? this.deck.current : -1;
  }

  protected override drawDuration(): number {
    return 2500;
  }

  protected override setDrawing(drawing: boolean) {
    this.drawing = drawing;
    this.drawingEmitter.emit(drawing);
  }

  ngOnInit(): void {
    this.deck = this.character.attackModifierDeck;
    this.characterIcon = this.character.iconUrl;
    this.numeration = '' + this.character.number;
    this.newStyle = gameManager.newAmStyle(this.character.edition);

    if (settingsManager.settings.fhStyle) {
      this.newStyle = true;
    }

    this.current = this.deck.current;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['deck']) {
      this.update();
    }
  }

  update(fromServer: boolean = false) {
    this.updateQueue(true, fromServer);
  }
}
