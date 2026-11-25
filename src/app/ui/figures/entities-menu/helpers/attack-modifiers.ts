import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Character } from 'src/app/game/model/Character';
import { AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Condition, ConditionName } from 'src/app/game/model/data/Condition';
import { AdditionalAMSelectDialogComponent } from 'src/app/ui/figures/entities-menu/additional-am-select/additional-am-select';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

export class AttackModifierHelper {
  constructor(private component: EntitiesMenuDialogComponent) {}

  updateCurseBless() {
    if (this.component.figure) {
      const amDeck = gameManager.attackModifierManager.byFigure(this.component.figure);
      this.component.blessMin = this.countUpcomingAttackModifier(amDeck, AttackModifierType.bless);
      this.component.curseMin = this.countUpcomingAttackModifier(amDeck, AttackModifierType.curse);
    } else {
      this.component.blessMin = -1;
      this.component.curseMin = -1;
    }
  }

  updateEmpowerEnfeeble(updateChars: boolean = true) {
    if (updateChars) {
      this.component.empowerChars = gameManager.game.figures
        .filter(
          (figure) =>
            figure instanceof Character &&
            gameManager.entityManager.isAlive(figure) &&
            figure.additionalModifier &&
            figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.empower)
        )
        .map((figure) => figure as Character);

      this.component.empowerChars.forEach((char) => {
        if (char.active) {
          this.component.empowerChar = char;
        }
      });

      if (!this.component.empowerChar && this.component.empowerChars.length === 1) {
        this.component.empowerChar = this.component.empowerChars[0];
      }

      this.component.enfeebleChars = gameManager.game.figures
        .filter(
          (figure) =>
            figure instanceof Character &&
            gameManager.entityManager.isAlive(figure) &&
            !figure.absent &&
            figure.additionalModifier &&
            figure.additionalModifier.find((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.enfeeble)
        )
        .map((figure) => figure as Character);

      this.component.enfeebleChars.forEach((char) => {
        if (char.active) {
          this.component.enfeebleChar = char;
        }
      });

      if (!this.component.enfeebleChar && this.component.enfeebleChars.length === 1) {
        this.component.enfeebleChar = this.component.enfeebleChars[0];
      }
    }

    if (this.component.figure) {
      const amDeck = gameManager.attackModifierManager.byFigure(this.component.figure);
      this.component.empowerMin = gameManager.attackModifierManager.countUpcomingAdditionalModifiers(
        amDeck,
        AttackModifierType.empower,
        this.component.empowerChar
      );
      this.component.empowerMax = this.component.empowerChar
        ? gameManager.attackModifierManager.additionalAvailable(this.component.empowerChar, AttackModifierType.empower)
        : -1;
      this.component.enfeebleMin = gameManager.attackModifierManager.countUpcomingAdditionalModifiers(
        amDeck,
        AttackModifierType.enfeeble,
        this.component.enfeebleChar
      );
      this.component.enfeebleMax = this.component.enfeebleChar
        ? gameManager.attackModifierManager.additionalAvailable(this.component.enfeebleChar, AttackModifierType.enfeeble)
        : -1;
    } else {
      this.component.empowerMin = -1;
      this.component.empowerMax = -1;
      this.component.enfeebleMin = -1;
      this.component.enfeebleMax = -1;
    }
  }

  updateAmDecks() {
    this.component.amDecks = gameManager.attackModifierManager.objectiveAmDecks();
  }

  countAttackModifier(amDeck: AttackModifierDeck, type: AttackModifierType): number {
    return amDeck.cards.filter((attackModifier) => attackModifier.type === type).length;
  }

  countUpcomingAttackModifier(amDeck: AttackModifierDeck, type: AttackModifierType): number {
    return amDeck.cards.filter((attackModifier, index) => attackModifier.type === type && index > amDeck.current).length;
  }

  countDrawnAttackModifier(amDeck: AttackModifierDeck, type: AttackModifierType): number {
    return amDeck.cards.filter((attackModifier, index) => attackModifier.type === type && index <= amDeck.current).length;
  }

  changeAttackModifiers(type: AttackModifierType, value: number) {
    if (value > 0) {
      gameManager.conditionManager.addDeckConditions(this.component.deckConditionTargets(), new Condition(type, value));
    } else if (value < 0) {
      this.component.applicableEntities.forEach((entity) => {
        const amDeck = gameManager.attackModifierManager.byFigure(this.component.figureForEntity(entity));
        gameManager.attackModifierManager.changeModifierCount(amDeck, type, value, false);
      });
    }
  }

  selectAdditionalAM(type: AttackModifierType) {
    if (type === AttackModifierType.empower || type === AttackModifierType.enfeeble) {
      const dialog = this.component.dialog.open(AdditionalAMSelectDialogComponent, {
        panelClass: ['dialog'],
        data: {
          characters: type === AttackModifierType.empower ? this.component.empowerChars : this.component.enfeebleChars,
          type: type
        }
      });

      dialog.closed.subscribe({
        next: (index) => {
          if (typeof index === 'number' && index !== -1) {
            if (type === AttackModifierType.empower) {
              this.component.empowerChar = this.component.empowerChars[index];
            } else {
              this.component.enfeebleChar = this.component.enfeebleChars[index];
            }
            this.updateEmpowerEnfeeble(false);
          }
        }
      });
    }
  }

  close() {
    const applicableEntities = this.component.applicableEntities;

    if (this.component.bless !== 0 && applicableEntities.length) {
      this.component.before(
        this.component.bless < 0
          ? 'removeCondition' + (this.component.bless < -1 ? 's' : '')
          : 'addCondition' + (this.component.bless > 1 ? 's' : ''),
        AttackModifierType.bless,
        this.component.bless > 0 ? this.component.bless : this.component.bless * -1
      );
      this.changeAttackModifiers(AttackModifierType.bless, this.component.bless);
      gameManager.stateManager.after();
      this.component.bless = 0;
    }

    if (this.component.curse !== 0 && applicableEntities.length) {
      this.component.before(
        this.component.curse < 0
          ? 'removeCondition' + (this.component.curse < -1 ? 's' : '')
          : 'addCondition' + (this.component.curse > 1 ? 's' : ''),
        AttackModifierType.curse,
        this.component.curse > 0 ? this.component.curse : this.component.curse * -1
      );
      this.changeAttackModifiers(AttackModifierType.curse, this.component.curse);
      gameManager.stateManager.after();
      this.component.curse = 0;
    }

    if (this.component.empower !== 0 && applicableEntities.length) {
      if (this.component.empowerChar || this.component.empower < 0) {
        this.component.before(
          this.component.empower < 0
            ? 'removeCondition' + (this.component.empower < -1 ? 's' : '')
            : 'addCondition' + (this.component.empower > 1 ? 's' : ''),
          AttackModifierType.empower,
          this.component.empower > 0 ? this.component.empower : this.component.empower * -1
        );
        if (this.component.empowerChar && this.component.empower > 0) {
          gameManager.conditionManager.addDeckConditions(
            this.component.deckConditionTargets(),
            new Condition(ConditionName.empower, this.component.empower),
            this.component.empowerChar
          );
        } else {
          applicableEntities.forEach((entity) => {
            gameManager.attackModifierManager.changeAdditionalCount(
              gameManager.attackModifierManager.byFigure(this.component.figureForEntity(entity)),
              this.component.empowerChar,
              AttackModifierType.empower,
              this.component.empower
            );
          });
        }
        gameManager.stateManager.after();
        this.component.empower = 0;
      }
    }

    if (this.component.enfeeble !== 0 && applicableEntities.length) {
      if (this.component.enfeebleChar || this.component.enfeeble < 0) {
        this.component.before(
          this.component.enfeeble < 0
            ? 'removeCondition' + (this.component.enfeeble < -1 ? 's' : '')
            : 'addCondition' + (this.component.enfeeble > 1 ? 's' : ''),
          AttackModifierType.enfeeble,
          this.component.enfeeble > 0 ? this.component.enfeeble : this.component.enfeeble * -1
        );
        if (this.component.enfeebleChar && this.component.enfeeble > 0) {
          gameManager.conditionManager.addDeckConditions(
            this.component.deckConditionTargets(),
            new Condition(ConditionName.enfeeble, this.component.enfeeble),
            this.component.enfeebleChar
          );
        } else {
          applicableEntities.forEach((entity) => {
            gameManager.attackModifierManager.changeAdditionalCount(
              gameManager.attackModifierManager.byFigure(this.component.figureForEntity(entity)),
              this.component.enfeebleChar,
              AttackModifierType.enfeeble,
              this.component.enfeeble
            );
          });
        }
        gameManager.stateManager.after();
        this.component.enfeeble = 0;
      }
    }
  }
}
