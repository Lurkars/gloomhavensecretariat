import { Dialog } from '@angular/cdk/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject, input, OnInit, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AbilityCard } from 'src/app/game/model/data/AbilityCard';
import { Action, ActionType, ActionValueType } from 'src/app/game/model/data/Action';
import { CharacterData } from 'src/app/game/model/data/CharacterData';
import { CharacterStat } from 'src/app/game/model/data/CharacterStat';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { Monster } from 'src/app/game/model/Monster';
import { sortDeck } from 'src/app/game/util/sorter';
import { AbilityCardComponent } from 'src/app/ui/figures/ability-card/ability-card';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { HeaderComponent } from 'src/app/ui/header/header';
import { SettingMenuComponent } from 'src/app/ui/header/menu/settings/setting/setting';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { downloadJsonString } from 'src/app/ui/helper/Static';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { EditorActionDialogComponent } from 'src/app/ui/tools/editor/action/action';
import { environment } from 'src/environments/environment';

export function compactAction(action: any) {
  if (action.valueType && action.valueType === ActionValueType.fixed) {
    action.valueType = undefined;
  }

  if (action.subActions && action.subActions.length === 0) {
    action.subActions = undefined;
  } else if (action.subActions) {
    action.subActions.forEach((action: any) => {
      compactAction(action);
    });
  }

  if (action.type === ActionType.summon) {
    try {
      const value = JSON.parse(action.value);
      if (typeof value !== 'string') {
        Object.keys(value).forEach((key) => {
          if (!value[key] || value[key] === false) {
            value[key] = undefined;
          }
        });

        if (value.action) {
          compactAction(value.action);
        }
        if (value.additionalAction) {
          compactAction(value.additionalAction);
        }
      }
      action.value = JSON.stringify(value);
    } catch {
      // continue
    }
  }

  if (!action.value && action.value !== 0) {
    action.value = undefined;
  }

  if (!action.small) {
    action.small = undefined;
  }
}

@Component({
  imports: [
    NgClass,
    DragDropModule,
    FormsModule,
    AbilityCardComponent,
    ActionComponent,
    HeaderComponent,
    GhsLabelDirective,
    TrackUUIDPipe,
    SettingMenuComponent
  ],
  selector: 'ghs-deck-editor',
  templateUrl: './deck.html',
  styleUrls: ['../editor.scss', './deck.scss']
})
export class DeckEditorComponent implements OnInit {
  private dialog = inject(Dialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ghsManager = inject(GhsManager);

  readonly inputDeckData = viewChild.required<ElementRef>('inputDeckData');

  readonly inputCharacter = input<Character>(undefined, { alias: 'character' });
  get character(): Character | undefined {
    return this.inputCharacter();
  }

  readonly inputMonster = input<Monster>(undefined, { alias: 'monster' });
  get monster(): Monster | undefined {
    return this.inputMonster();
  }

  readonly inputEdition = input<string | undefined>(undefined, { alias: 'edition' });
  readonly standalone = input<boolean>(true);

  edition: string | undefined;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  ActionType = ActionType;
  ActionValueType = ActionValueType;
  deckData: DeckData;
  decksData: DeckData[] = [];
  editions: string[] = [];
  deckError: any;
  abilityColor: string = '#aaaaaa';

  private destroyRef = inject(DestroyRef);

  constructor() {
    this.deckData = new DeckData();
    this.deckData.abilities.push(new AbilityCard());
  }

  async ngOnInit() {
    this.edition = this.inputEdition();
    if (this.standalone()) {
      await settingsManager.init(!environment.production);
    }

    if (this.character) {
      this.deckData.character = true;
    }
    this.deckDataToJson();
    this.updateDecksData();
    this.inputDeckData().nativeElement.addEventListener('change', () => {
      this.deckDataFromJson();
    });

    this.editions = gameManager.editions(true);

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (queryParams) => {
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(!true).includes(this.edition)) {
            this.edition = undefined;
          }
        }

        if (queryParams['deck']) {
          const deckData = this.decksData.find((deckData) => deckData.name === queryParams['deck']);
          if (deckData) {
            this.deckData = deckData;
            this.deckDataToJson();
          }
        }

        if (!this.deckData.edition && this.edition) {
          this.deckData.edition = this.edition;
        }
      }
    });
  }

  updateQueryParams() {
    if (!this.deckData.edition && this.edition) {
      this.deckData.edition = this.edition;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        edition: this.edition || undefined,
        monster: (this.monster && this.monster.name) || undefined,
        character: (this.character && this.character.name) || undefined,
        deck: this.deckData.name || undefined
      },
      queryParamsHandling: 'merge'
    });
    this.updateDecksData();
  }

  updateDecksData() {
    this.decksData = gameManager.decksData(this.edition).filter((deckData) => {
      if (this.character) {
        return deckData.character;
      } else if (this.monster) {
        return !deckData.character;
      }

      return true;
    });
  }

  jsonDownload(value: string) {
    downloadJsonString(value, this.deckData.name + '.json');
  }

  deckDataToJson() {
    const compactData: any = JSON.parse(JSON.stringify(this.deckData));

    Object.keys(compactData).forEach((key) => {
      if (!compactData[key] || compactData[key] === false) {
        compactData[key] = undefined;
      }
    });

    if (compactData.abilities) {
      compactData.abilities.forEach((ability: any) => {
        Object.keys(ability).forEach((key) => {
          if ((!ability[key] && ability[key] !== 0) || (typeof ability[key] === 'boolean' && ability[key] === false)) {
            ability[key] = undefined;
          }

          ability.revealed = undefined;

          if (key === 'level' && ability[key] === 0) {
            ability[key] = undefined;
          }

          if (key === 'xp' && ability[key] === 0) {
            ability[key] = undefined;
          }

          if (key === 'bottomXp' && ability[key] === 0) {
            ability[key] = undefined;
          }

          if (ability.actions && ability.actions.length === 0) {
            ability.actions = undefined;
          } else if (ability.actions) {
            ability.actions.forEach((action: any) => {
              compactAction(action);
            });
          }

          if (ability.bottomActions && ability.bottomActions.length === 0) {
            ability.bottomActions = undefined;
          } else if (ability.bottomActions) {
            ability.bottomActions.forEach((action: any) => {
              compactAction(action);
            });
          }
        });
      });
    }

    const sortedData = sortDeck(compactData);
    this.inputDeckData().nativeElement.value = JSON.stringify(sortedData, null, 2);
  }

  deckDataFromJson() {
    this.deckError = '';
    const inputDeckData = this.inputDeckData();
    if (inputDeckData.nativeElement.value) {
      try {
        this.deckData = JSON.parse(inputDeckData.nativeElement.value);
        return;
      } catch (e) {
        this.deckData = new DeckData();
        this.deckData.abilities.push(new AbilityCard());
        this.deckError = e;
      }
    }
  }

  valueChange(value: string): number | string {
    if (value && !isNaN(+value)) {
      return +value;
    }
    return value;
  }

  changeInitiative(event: any, abilityCard: AbilityCard) {
    if (event.target.value) {
      abilityCard.initiative = +event.target.value;
    } else {
      abilityCard.initiative = 0;
    }
    event.target.value = (abilityCard.initiative < 10 ? '0' : '') + abilityCard.initiative;
    this.deckDataToJson();
  }

  changeCardId(event: any, abilityCard: AbilityCard) {
    if (event.target.value) {
      abilityCard.cardId = +event.target.value;
      event.target.value = (abilityCard.cardId < 100 ? '0' : '') + (abilityCard.cardId < 10 ? '0' : '') + abilityCard.cardId;
    } else {
      abilityCard.cardId = undefined;
    }
    this.deckDataToJson();
  }

  addAbility() {
    this.deckData.abilities.push(new AbilityCard());
    this.deckDataToJson();
  }

  removeAbility(abilityCard: AbilityCard) {
    this.deckData.abilities.splice(this.deckData.abilities.indexOf(abilityCard), 1);
    this.deckDataToJson();
  }

  addAbilityAction(abilityCard: AbilityCard) {
    const action = new Action(ActionType.attack);
    if (!abilityCard.actions) {
      abilityCard.actions = [];
    }
    abilityCard.actions.push(action);
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
      data: { action: action, character: this.getCharacter(), cardId: abilityCard.cardId }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value === false) {
          abilityCard.actions.splice(abilityCard.actions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    });
  }

  editAbilityAction(abilityCard: AbilityCard, action: Action) {
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
      data: { action: action, character: this.getCharacter(), cardId: abilityCard.cardId }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value === false) {
          abilityCard.actions.splice(abilityCard.actions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    });
  }

  dropAction(actions: Action[], event: CdkDragDrop<number>) {
    moveItemInArray(actions, event.previousIndex, event.currentIndex);
    this.ghsManager.triggerUiChange();
  }

  addAbilityActionBottom(abilityCard: AbilityCard) {
    const action = new Action(ActionType.move);
    if (!abilityCard.bottomActions) {
      abilityCard.bottomActions = [];
    }
    abilityCard.bottomActions.push(action);
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
      data: { action: action, character: this.getCharacter(), cardId: abilityCard.cardId }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value === false) {
          abilityCard.bottomActions.splice(abilityCard.bottomActions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    });
  }

  editAbilityActionBottom(abilityCard: AbilityCard, action: Action) {
    const dialog = this.dialog.open(EditorActionDialogComponent, {
      panelClass: ['dialog'],
      data: { action: action, character: this.getCharacter(), cardId: abilityCard.cardId }
    });

    dialog.closed.subscribe({
      next: (value) => {
        if (value === false) {
          abilityCard.bottomActions.splice(abilityCard.actions.indexOf(action), 1);
        }
        this.deckDataToJson();
      }
    });
  }

  divider(actions: Action[], index: number): boolean {
    if (index < 1) {
      return false;
    }

    const action = actions[index];

    if (!action) {
      return false;
    }

    if ((action.type === ActionType.element || action.type === ActionType.elementHalf) && action.valueType !== ActionValueType.minus) {
      return false;
    }

    if (action.type === ActionType.card) {
      return false;
    }

    if (actions[index - 1].type === ActionType.box) {
      return false;
    }

    if (
      action.type === ActionType.concatenation &&
      action.subActions.every(
        (subAction) =>
          subAction.type === ActionType.card || subAction.type === ActionType.element || subAction.type === ActionType.elementHalf
      )
    ) {
      return false;
    }

    return true;
  }

  getCharacter(): Character | undefined {
    if (this.character) {
      return this.character;
    }

    if (this.deckData.character) {
      const characterData = new CharacterData();
      characterData.iconUrl = './assets/images/warning.svg';
      for (let i = 0; i < 9; i++) {
        characterData.stats.push(new CharacterStat(i, i));
      }
      characterData.color = this.abilityColor;
      if (this.edition) {
        characterData.edition = this.edition;
      }
      return new Character(characterData, 1);
    }

    return undefined;
  }

  loadDeckData(event: any) {
    const index = +event.target.value;
    if (index === -1) {
      this.deckData = new DeckData();
      this.deckData.abilities.push(new AbilityCard());
      if (this.character) {
        this.deckData.character = true;
      }
    } else {
      this.deckData = this.decksData[index];
    }
    this.deckDataToJson();
    this.updateQueryParams();
  }
}
