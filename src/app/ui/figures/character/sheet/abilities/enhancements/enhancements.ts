import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, inject, input, OnInit, output } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { Character } from 'src/app/game/model/Character';
import { Action, ActionType } from 'src/app/game/model/data/Action';
import { Condition, ConditionName, ConditionType } from 'src/app/game/model/data/Condition';
import { Element } from 'src/app/game/model/data/Element';
import { Enhancement, EnhancementAction, EnhancementType } from 'src/app/game/model/data/Enhancement';
import { SummonData } from 'src/app/game/model/data/SummonData';
import { ActionComponent } from 'src/app/ui/figures/actions/action';
import { SettingMenuComponent } from 'src/app/ui/header/menu/settings/setting/setting';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { GhsCeilPipe, GhsRangePipe } from 'src/app/ui/helper/Pipes';
import { PointerInputDirective } from 'src/app/ui/helper/pointer-input';
import { EditorActionComponent } from 'src/app/ui/tools/editor/action/action';

@Component({
  imports: [
    forwardRef(() => ActionComponent),
    forwardRef(() => EditorActionComponent),
    GhsCeilPipe,
    GhsLabelDirective,
    GhsRangePipe,
    NgClass,
    PointerInputDirective,
    SettingMenuComponent
  ],
  selector: 'ghs-enhancements',
  templateUrl: 'enhancements.html',
  styleUrls: ['./enhancements.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnhancementsComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  inputAction = input<Action>(undefined, { alias: 'action' });

  readonly inputCharacterSignal = input<Character>(undefined, { alias: 'character' });
  get inputCharacter(): Character | undefined {
    return this.inputCharacterSignal();
  }

  readonly inputSummonSignal = input<SummonData>(undefined, { alias: 'summon' });
  get inputSummon(): SummonData | undefined {
    return this.inputSummonSignal();
  }

  readonly inputActionIndex = input<string>(undefined, { alias: 'actionIndex' });
  readonly inputEnhancementIndex = input<number>(undefined, { alias: 'enhancementIndex' });
  readonly inputCardId = input<number>(undefined, { alias: 'cardId' });
  readonly standalone = input<boolean>(false);

  readonly triggerClose = output<void>();

  gameManager: GameManager = gameManager;
  ActionType = ActionType;
  EnhancementType = EnhancementType;
  Elements: Element[] = Object.values(Element);

  action: Action = new Action(ActionType.attack, 1);
  rootAction: Action = new Action(ActionType.attack, 1);
  enhanceAction: Action = new Action(ActionType.attack, 1);
  level: number = 1;
  enhancements: number = 0;
  special: 'summon' | 'lost' | 'persistent' | undefined;
  character: Character | undefined;
  customAction: boolean = false;
  wipSpecial: boolean = false;
  customSpecial: boolean = false;

  actionTypes: ActionType[] = [];
  enhancementAction: EnhancementAction = 'plus1';
  enhancementType: EnhancementType | undefined;
  isMultiTarget: boolean = false;

  enhancedCards: number = 0;

  constructor() {
    this.ghsManager.uiChangeEffect(() => {
      if (this.inputCharacter && this.inputCardId()) {
        this.enhancements =
          (this.inputCharacter.progress.enhancements &&
            this.inputCharacter.progress.enhancements.filter((enhancement) => {
              const inputActionIndex = this.inputActionIndex();
              return (
                enhancement.cardId === this.inputCardId() &&
                inputActionIndex &&
                enhancement.actionIndex.indexOf('bottom') === inputActionIndex.indexOf('bottom')
              );
            }).length) ||
          0;
        this.enhancedCards =
          this.inputCharacter.progress.enhancements &&
          this.inputCharacter.progress.enhancements
            .filter((e) => !e.inherited)
            .map((enhancement) => enhancement.cardId)
            .filter((cardId, index, self) => {
              const inputCardId = this.inputCardId();
              return (!inputCardId || inputCardId !== cardId) && index === self.indexOf(cardId);
            }).length;
      }
    });
  }

  ngOnInit(): void {
    const inputAction = this.inputAction();
    this.action = inputAction ? JSON.parse(JSON.stringify(inputAction)) : new Action(ActionType.attack, 1);
    this.rootAction = this.action;
    this.action.small = false;
    this.character = this.inputCharacter ? JSON.parse(JSON.stringify(this.inputCharacter)) : undefined;
    this.customAction = false;
    this.enhanceAction = new Action(this.action.type, this.action.value, this.action.valueType, this.action.subActions);
    this.enhanceAction.multiTarget = this.action.multiTarget;
    if (this.inputSummon) {
      this.action = new Action(ActionType.summon, 'summonData');
      this.action.valueObject = this.inputSummon;
      this.action.enhancementTypes = [EnhancementType.square, EnhancementType.square, EnhancementType.square, EnhancementType.square];
    }
    this.wipSpecial =
      this.action !== undefined && this.action.type === ActionType.custom && this.action.value === '%character.abilities.wip%';

    const inputActionIndex = this.inputActionIndex();
    const inputEnhancementIndex = this.inputEnhancementIndex();
    if (inputAction && inputActionIndex && this.inputCardId() && inputEnhancementIndex !== undefined && this.inputCharacter) {
      const ability = gameManager.deckData(this.inputCharacter).abilities.find((ability) => ability.cardId === this.inputCardId());
      const rootIndex = +inputActionIndex.replace('bottom-', '').split('-')[0];
      if (ability) {
        this.level = typeof ability.level === 'number' ? ability.level : 1;
        if (inputActionIndex.includes('bottom')) {
          if (
            ability.bottomLost ||
            ability.bottomActions.find((action) => action.type === ActionType.card && action.value.toString().includes('lost'))
          ) {
            this.special = 'lost';
          }
          if (
            ability.bottomPersistent ||
            ability.bottomActions.find((action) => action.type === ActionType.card && action.value.toString().includes('persistent'))
          ) {
            this.special = 'persistent';
          }
          this.rootAction = ability.bottomActions[rootIndex];
          if (!this.rootAction) {
            console.warn('invalid root action', ability.bottomActions, inputActionIndex, rootIndex);
            this.rootAction = this.action;
          }
        } else {
          if (
            ability.lost ||
            ability.actions.find((action) => action.type === ActionType.card && action.value.toString().includes('lost'))
          ) {
            this.special = 'lost';
          }
          if (
            ability.persistent ||
            ability.actions.find((action) => action.type === ActionType.card && action.value.toString().includes('persistent'))
          ) {
            this.special = 'persistent';
          }
          this.rootAction = ability.actions[rootIndex];
          if (!this.rootAction) {
            console.warn('invalid root action', ability.actions, inputActionIndex, rootIndex);
            this.rootAction = this.action;
          }
        }

        if (this.inputSummon) {
          this.special = 'summon';
        }
      }

      this.enhancements =
        (this.inputCharacter.progress.enhancements &&
          this.inputCharacter.progress.enhancements.filter((enhancement) => {
            const inputActionIndexValue = this.inputActionIndex();
            return (
              enhancement.cardId === this.inputCardId() &&
              inputActionIndexValue &&
              enhancement.actionIndex.indexOf('bottom') === inputActionIndexValue.indexOf('bottom')
            );
          }).length) ||
        0;

      this.enhancedCards =
        this.inputCharacter.progress.enhancements &&
        this.inputCharacter.progress.enhancements
          .filter((e) => !e.inherited)
          .map((e) => e.cardId)
          .filter((cardId, index, self) => {
            const inputCardId = this.inputCardId();
            return (!inputCardId || inputCardId !== cardId) && index === self.indexOf(cardId);
          }).length;

      if ([ActionType.custom, ActionType.specialTarget].includes(inputAction.type) && inputAction.enhancementTypes && !this.wipSpecial) {
        this.customSpecial = true;
        const enhancementType = inputAction.enhancementTypes[inputEnhancementIndex];
        switch (enhancementType) {
          case EnhancementType.square:
            this.actionTypes = gameManager.enhancementsManager.squareActions;
            break;
          case EnhancementType.circle:
            this.actionTypes = gameManager.enhancementsManager.circleActions;
            break;
          case EnhancementType.diamond:
            this.actionTypes = gameManager.enhancementsManager.diamondActions;
            break;
          case EnhancementType.diamond_plus:
            this.actionTypes = gameManager.enhancementsManager.diamondPlusActions;
            break;
        }
        this.action = new Action(this.actionTypes[0], 1);
      }
    } else {
      this.customAction = true;
    }

    this.update();
  }

  updateAction(action: Action | undefined = undefined) {
    if (action) {
      this.action = action;
      this.enhanceAction = new Action(this.action.type, this.action.value, this.action.valueType, this.action.subActions);
      this.enhanceAction.multiTarget = this.action.multiTarget;
    }
    this.update();
  }

  update() {
    if (!this.customSpecial) {
      this.actionTypes = [
        ...gameManager.enhancementsManager.squareActions,
        ...gameManager.enhancementsManager.circleActions,
        ...gameManager.enhancementsManager.diamondActions,
        ...gameManager.enhancementsManager.diamondPlusActions,
        ...gameManager.enhancementsManager.hexActions
      ].filter((type, index, self) => index === self.indexOf(type));
    }

    if (this.special === 'summon') {
      this.actionTypes = [...gameManager.enhancementsManager.summonActions];
    } else if (!this.actionTypes.includes(this.action.type)) {
      this.action = new Action(ActionType.attack, 1);
    }

    const oldEnhancementType = this.enhancementType;

    const inputEnhancementIndex = this.inputEnhancementIndex();
    if (!this.action.enhancementTypes || !this.action.enhancementTypes.length || this.wipSpecial) {
      if (gameManager.enhancementsManager.squareActions.includes(this.action.type)) {
        this.enhancementType = EnhancementType.square;
      }
      if (gameManager.enhancementsManager.circleActions.includes(this.action.type)) {
        this.enhancementType = EnhancementType.circle;
      }
      if (
        gameManager.enhancementsManager.diamondActions.includes(this.action.type) &&
        (this.action.type !== ActionType.condition || new Condition('' + this.action.value).types.includes(ConditionType.negative))
      ) {
        this.enhancementType = EnhancementType.diamond;
      }
      if (
        gameManager.enhancementsManager.diamondPlusActions.includes(this.action.type) &&
        (this.action.type !== ActionType.condition || new Condition('' + this.action.value).types.includes(ConditionType.positive))
      ) {
        this.enhancementType = EnhancementType.diamond_plus;
      }
      if (gameManager.enhancementsManager.hexActions.includes(this.action.type)) {
        this.enhancementType = EnhancementType.hex;
      }
    } else if (inputEnhancementIndex !== undefined) {
      this.enhancementType = this.action.enhancementTypes[inputEnhancementIndex];
    }

    if (this.special === 'summon') {
      this.enhancementType = EnhancementType.square;
      this.enhancementAction = 'plus1';
    }

    const inputAction = this.inputAction();

    if (inputAction && (this.enhancementAction === 'plus1' || this.enhancementAction === 'hex')) {
      if (this.wipSpecial || this.customSpecial) {
        this.enhanceAction = this.action;
        this.enhanceAction.enhancementTypes = inputAction.enhancementTypes;
      } else {
        this.enhanceAction = new Action(inputAction.type, inputAction.value, inputAction.valueType);
      }
      this.enhanceAction.multiTarget = inputAction.multiTarget;
    } else if (Object.values(ConditionName).includes(this.enhancementAction as ConditionName)) {
      this.enhanceAction = new Action(ActionType.condition, this.enhancementAction);
    } else if (Object.values(Element).includes(this.enhancementAction as Element)) {
      this.enhanceAction = new Action(ActionType.element, this.enhancementAction);
    } else if (this.enhancementAction === ActionType.jump) {
      this.enhanceAction = new Action(ActionType.jump);
    } else if (this.enhancementAction === 'plus1') {
      this.enhanceAction = new Action(this.action.type, this.action.value, this.action.valueType, this.action.subActions);
    }
    if (this.action.subActions) {
      this.enhanceAction.subActions = JSON.parse(JSON.stringify(this.action.subActions));
    }

    if (this.enhancementType === EnhancementType.hex) {
      this.enhancementAction = 'hex';
    } else if (oldEnhancementType !== this.enhancementType) {
      this.enhancementAction = 'plus1';
    }

    const inputCardId = this.inputCardId();
    const inputActionIndex = this.inputActionIndex();
    if (inputActionIndex && inputCardId && inputEnhancementIndex !== undefined && this.character) {
      this.character.tags = [];
      this.character.progress.enhancements =
        (this.inputCharacter &&
          this.inputCharacter.progress.enhancements &&
          JSON.parse(JSON.stringify(this.inputCharacter.progress.enhancements))) ||
        [];

      this.character.progress.enhancements.push(
        new Enhancement(inputCardId, inputActionIndex, inputEnhancementIndex, this.enhancementAction)
      );
    }

    this.isMultiTarget = gameManager.enhancementsManager.isMultiTarget(this.enhanceAction, this.rootAction);
    this.ghsManager.triggerUiChange();
  }

  setEnhancementAction(enhancementAction: EnhancementAction) {
    this.enhancementAction = enhancementAction;
    this.update();
  }

  toggleSpecial(special: 'summon' | 'lost' | 'persistent' | undefined) {
    if (this.special === special) {
      this.special = undefined;
    } else {
      this.special = special;
    }
    this.update();
  }

  setEdition(edition: string) {
    gameManager.game.edition = edition;
    this.ghsManager.triggerUiChange();
  }

  close() {
    // TODO: The 'emit' function requires a mandatory void argument
    this.triggerClose.emit();
  }

  apply(force: boolean = false) {
    const costs = gameManager.enhancementsManager.calculateCosts(
      this.enhanceAction,
      this.rootAction,
      this.level,
      this.special,
      this.enhancements
    );
    const inputCardId = this.inputCardId();
    const inputActionIndex = this.inputActionIndex();
    const inputEnhancementIndex = this.inputEnhancementIndex();
    if (
      inputActionIndex &&
      inputCardId &&
      inputEnhancementIndex !== undefined &&
      this.inputCharacter &&
      ((this.inputCharacter.progress.gold >= costs &&
        (gameManager.enhancementsManager.fh || this.enhancedCards < gameManager.prosperityLevel())) ||
        force)
    ) {
      gameManager.stateManager.before(
        'enhanceCard',
        gameManager.characterManager.characterName(this.inputCharacter, true, true),
        inputCardId
      );

      if (!this.inputCharacter.progress.enhancements) {
        this.inputCharacter.progress.enhancements = [];
      }

      this.inputCharacter.progress.enhancements.push(
        new Enhancement(inputCardId, inputActionIndex, inputEnhancementIndex, this.enhancementAction)
      );

      if (!force) {
        this.inputCharacter.progress.gold -= costs;
      }

      gameManager.stateManager.after();
      // TODO: The 'emit' function requires a mandatory void argument
      this.triggerClose.emit();
    }
  }
}
