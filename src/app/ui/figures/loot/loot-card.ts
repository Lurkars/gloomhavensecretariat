import { Dialog } from '@angular/cdk/dialog';
import { NgClass } from '@angular/common';
import { Component, inject, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { Loot, LootType } from 'src/app/game/model/data/Loot';
import { LootApplyDialogComponent } from 'src/app/ui/figures/loot/loot-apply-dialog';
import { openLootRandomItemDialog } from 'src/app/ui/figures/loot/random-item/random-item-dialog';
import { ScenarioSummaryComponent } from 'src/app/ui/footer/scenario/summary/scenario-summary';
import { CardRevealDirective } from 'src/app/ui/helper/CardReveal';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';

@Component({
  imports: [CardRevealDirective, GhsLabelDirective, GhsRangePipe, NgClass, PointerInputDirective],
  selector: 'ghs-loot',
  templateUrl: './loot-card.html',
  styleUrls: ['./loot-card.scss']
})
export class LootComponent implements OnInit, OnChanges {
  private dialog = inject(Dialog);
  private ghsManager = inject(GhsManager);

  readonly inputLoot = input.required<Loot>({ alias: 'loot' });
  get loot(): Loot {
    return this.inputLoot();
  }

  readonly index = input<number>(-1);
  readonly disableFlip = input<boolean>(false);
  readonly flipped = input<boolean>(false);
  readonly reveal = input<boolean>(false);
  readonly edit = input<boolean>(false);
  readonly looted = input<boolean>(false);
  readonly highlight = input<boolean>(true);
  readonly apply = input<boolean>(true);
  readonly character = input<string>('');

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  LootType = LootType;

  characterCount: number = 0;
  lootValue: number = 0;
  revealed: boolean = false;
  animate: boolean = false;
  sections: string[] = [];

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      this.characterCount = gameManager.characterManager.characterCount();
      this.lootValue = gameManager.lootManager.getValue(this.loot, false);
    });
  }

  ngOnInit(): void {
    this.animate = !this.disableFlip();
    if ((this.loot.type === LootType.special1 || this.loot.type === LootType.special2) && this.loot.value) {
      this.sections = this.loot.value.split('|');
    }
  }

  onChange(revealed: boolean) {
    this.revealed = revealed;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const flipped = changes['flipped'];
    if (flipped && !this.disableFlip() && flipped.currentValue && flipped.currentValue !== flipped.previousValue) {
      this.animate = true;
    }
    if ((this.loot.type === LootType.special1 || this.loot.type === LootType.special2) && this.loot.value) {
      this.sections = this.loot.value.split('|');
    }
  }

  hasSection(section: string): boolean {
    return gameManager.lootManager.lootDeckSectionApplied(section);
  }

  toggleSection(event: TouchEvent | MouseEvent, section: string, force: boolean = false) {
    if (this.hasSection(section)) {
      if (force) {
        gameManager.stateManager.before('unsetLootCardSection', section);
        gameManager.lootManager.removeLootDeckSection(section);
        gameManager.stateManager.after();
      }
    } else {
      const conclusion = gameManager.editionManager
        .sectionData(gameManager.editionManager.currentEdition())
        .find((sectionData) => sectionData.index === section && sectionData.conclusion);
      if (conclusion && !force) {
        this.dialog
          .open(ScenarioSummaryComponent, {
            panelClass: ['dialog'],
            data: {
              scenario: conclusion,
              conclusionOnly: true
            }
          })
          .closed.subscribe({
            next: () => {
              if (this.hasSection(section)) {
                this.addSection(section);
              }
            }
          });
      } else {
        this.addSection(section);
      }
    }
    event.stopPropagation();
    event.preventDefault();
  }

  addSection(section: string) {
    gameManager.stateManager.before('setLootCardSection', section);
    gameManager.lootManager.addLootDeckSection(section, this.characterFigure(this.character()));
    gameManager.stateManager.after();
  }

  characterFigure(name: string | undefined): Character | undefined {
    return name
      ? (gameManager.game.figures.find((figure) => figure instanceof Character && figure.name === name) as Character | undefined)
      : undefined;
  }

  changeCharacter(event: any) {
    const edit = this.edit();
    if (settingsManager.settings.applyLoot && (edit || !this.character())) {
      event.preventDefault();
      event.stopPropagation();
      const dialog = this.dialog.open(LootApplyDialogComponent, {
        panelClass: ['dialog'],
        data: { loot: this.loot, selected: this.character(), edit: edit }
      });

      dialog.closed.subscribe({
        next: (name) => {
          if (typeof name !== 'string') {
            return;
          }
          const index = this.index();
          const holder = gameManager.lootManager.lootCardHolder(index);
          const character = this.characterFigure(name);
          if (!gameManager.lootManager.canAssignLootCard(index, character)) {
            return;
          }
          const value = gameManager.lootManager.getValue(this.loot);
          if (character) {
            gameManager.stateManager.before(
              'addLootCard',
              gameManager.characterManager.characterName(character, true, true),
              'game.loot.' + this.loot.type,
              value
            );
          } else if (holder) {
            gameManager.stateManager.before(
              'removeLootCard',
              gameManager.characterManager.characterName(holder, true, true),
              'game.loot.' + this.loot.type,
              value
            );
          } else {
            return;
          }
          const result = gameManager.lootManager.assignLootCard(index, character);
          gameManager.stateManager.after();
          if (character && result) {
            openLootRandomItemDialog(this.dialog, result, character, index);
          }
        }
      });
    }
  }
}
