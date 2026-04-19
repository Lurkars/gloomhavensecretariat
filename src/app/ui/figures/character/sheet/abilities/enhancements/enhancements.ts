import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
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
    ActionComponent,
    EditorActionComponent,
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

  @Input('action') inputAction: Action | undefined;
  @Input('actionIndex') inputActionIndex: string | undefined;
  @Input('enhancementIndex') inputEnhancementIndex: number | undefined;
  @Input('cardId') inputCardId: number | undefined;
  @Input('character') inputCharacter: Character | undefined;
  @Input('summon') inputSummon: SummonData | undefined;
  @Input() standalone: boolean = false;

  @Output() triggerClose: EventEmitter<void> = new EventEmitter<void>();

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
      if (this.inputCharacter && this.inputCardId) {
        this.enhancements =
          (this.inputCharacter.progress.enhancements &&
            this.inputCharacter.progress.enhancements.filter(
              (enhancement) =>
                enhancement.cardId === this.inputCardId &&
                this.inputActionIndex &&
                enhancement.actionIndex.indexOf('bottom') === this.inputActionIndex.indexOf('bottom')
            ).length) ||
          0;
        this.enhancedCards =
          this.inputCharacter.progress.enhancements &&
          this.inputCharacter.progress.enhancements
            .filter((e) => !e.inherited)
            .map((enhancement) => enhancement.cardId)
            .filter((cardId, index, self) => (!this.inputCardId || this.inputCardId !== cardId) && index === self.indexOf(cardId)).length;
      }
    });
  }

  ngOnInit(): void {
    this.action = this.inputAction ? JSON.parse(JSON.stringify(this.inputAction)) : new Action(ActionType.attack, 1);
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

    if (this.inputAction && this.inputActionIndex && this.inputCardId && this.inputEnhancementIndex !== undefined && this.inputCharacter) {
      const ability = gameManager.deckData(this.inputCharacter).abilities.find((ability) => ability.cardId === this.inputCardId);
      const rootIndex = +this.inputActionIndex.replace('bottom-', '').split('-')[0];
      if (ability) {
        this.level = typeof ability.level === 'number' ? ability.level : 1;
        if (this.inputActionIndex.includes('bottom')) {
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
            console.warn('invalid root action', ability.bottomActions, this.inputActionIndex, rootIndex);
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
            console.warn('invalid root action', ability.actions, this.inputActionIndex, rootIndex);
            this.rootAction = this.action;
          }
        }

        if (this.inputSummon) {
          this.special = 'summon';
        }
      }

      this.enhancements =
        (this.inputCharacter.progress.enhancements &&
          this.inputCharacter.progress.enhancements.filter(
            (enhancement) =>
              enhancement.cardId === this.inputCardId &&
              this.inputActionIndex &&
              enhancement.actionIndex.indexOf('bottom') === this.inputActionIndex.indexOf('bottom')
          ).length) ||
        0;

      this.enhancedCards =
        this.inputCharacter.progress.enhancements &&
        this.inputCharacter.progress.enhancements
          .filter((e) => !e.inherited)
          .map((e) => e.cardId)
          .filter((cardId, index, self) => (!this.inputCardId || this.inputCardId !== cardId) && index === self.indexOf(cardId)).length;

      if (
        [ActionType.custom, ActionType.specialTarget].includes(this.inputAction.type) &&
        this.inputAction.enhancementTypes &&
        !this.wipSpecial
      ) {
        this.customSpecial = true;
        const enhancementType = this.inputAction.enhancementTypes[this.inputEnhancementIndex];
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
    } else if (this.inputEnhancementIndex !== undefined) {
      this.enhancementType = this.action.enhancementTypes[this.inputEnhancementIndex];
    }

    if (this.special === 'summon') {
      this.enhancementType = EnhancementType.square;
      this.enhancementAction = 'plus1';
    }

    if (this.inputAction && (this.enhancementAction === 'plus1' || this.enhancementAction === 'hex')) {
      if (this.wipSpecial || this.customSpecial) {
        this.enhanceAction = this.action;
        this.enhanceAction.enhancementTypes = this.inputAction.enhancementTypes;
      } else {
        this.enhanceAction = new Action(this.inputAction.type, this.inputAction.value, this.inputAction.valueType);
      }
      this.enhanceAction.multiTarget = this.inputAction.multiTarget;
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

    if (this.inputActionIndex && this.inputCardId && this.inputEnhancementIndex !== undefined && this.character) {
      this.character.tags = [];
      this.character.progress.enhancements =
        (this.inputCharacter &&
          this.inputCharacter.progress.enhancements &&
          JSON.parse(JSON.stringify(this.inputCharacter.progress.enhancements))) ||
        [];

      this.character.progress.enhancements.push(
        new Enhancement(this.inputCardId, this.inputActionIndex, this.inputEnhancementIndex, this.enhancementAction)
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
    if (
      this.inputActionIndex &&
      this.inputCardId &&
      this.inputEnhancementIndex !== undefined &&
      this.inputCharacter &&
      ((this.inputCharacter.progress.gold >= costs &&
        (gameManager.enhancementsManager.fh || this.enhancedCards < gameManager.prosperityLevel())) ||
        force)
    ) {
      gameManager.stateManager.before(
        'enhanceCard',
        gameManager.characterManager.characterName(this.inputCharacter, true, true),
        this.inputCardId
      );

      if (!this.inputCharacter.progress.enhancements) {
        this.inputCharacter.progress.enhancements = [];
      }

      this.inputCharacter.progress.enhancements.push(
        new Enhancement(this.inputCardId, this.inputActionIndex, this.inputEnhancementIndex, this.enhancementAction)
      );

      if (!force) {
        this.inputCharacter.progress.gold -= costs;
      }

      gameManager.stateManager.after();
      this.triggerClose.emit();
    }
  }
}
