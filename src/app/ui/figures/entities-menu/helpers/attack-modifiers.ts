import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, AttackModifierDeck, AttackModifierType } from 'src/app/game/model/data/AttackModifier';
import { Entity } from 'src/app/game/model/Entity';
import { Monster } from 'src/app/game/model/Monster';
import { ObjectiveContainer } from 'src/app/game/model/ObjectiveContainer';
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
      this.component.empowerMin = this.countUpcomingAttackModifier(amDeck, AttackModifierType.empower);
      this.component.empowerMax = this.component.empowerChar
        ? this.component.empowerChar.additionalModifier
            .filter((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.empower)
            .map((perk) => perk.count)
            .reduce((a, b) => a + b) -
          gameManager.attackModifierManager.countUpcomingAdditional(this.component.empowerChar, AttackModifierType.empower)
        : -1;
      this.component.enfeebleMin = this.countUpcomingAttackModifier(amDeck, AttackModifierType.enfeeble);
      this.component.enfeebleMax = this.component.enfeebleChar
        ? this.component.enfeebleChar.additionalModifier
            .filter((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.enfeeble)
            .map((perk) => perk.count)
            .reduce((a, b) => a + b) -
          gameManager.attackModifierManager.countUpcomingAdditional(this.component.enfeebleChar, AttackModifierType.enfeeble)
        : -1;
    } else {
      this.component.empowerMin = -1;
      this.component.empowerMax = -1;
      this.component.enfeebleMin = -1;
      this.component.enfeebleMax = -1;
    }
  }

  updateAmDecks() {
    this.component.amDecks = ['M'];

    if (
      settingsManager.settings.allyAttackModifierDeck &&
      (settingsManager.settings.alwaysAllyAttackModifierDeck || gameManager.fhRules(true))
    ) {
      this.component.amDecks.push('A');
    }

    this.component.amDecks.push(
      ...gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).map((figure) => figure.name)
    );

    if (
      this.component.figure instanceof ObjectiveContainer &&
      this.component.figure.amDeck &&
      !this.component.amDecks.includes(this.component.figure.amDeck)
    ) {
      this.component.figure.amDeck = 'M';
    }
  }

  countAttackModifier(amDeck: AttackModifierDeck, type: AttackModifierType): number {
    return amDeck.cards.filter((attackModifier) => attackModifier.type === type).length;
  }

  countUpcomingAttackModifier(amDeck: AttackModifierDeck, type: AttackModifierType, idPrefix: string | undefined = undefined): number {
    return amDeck.cards.filter(
      (attackModifier, index) =>
        attackModifier.type === type &&
        index > amDeck.current &&
        (!idPrefix || (attackModifier.id && attackModifier.id.startsWith(idPrefix)))
    ).length;
  }

  countDrawnAttackModifier(amDeck: AttackModifierDeck, type: AttackModifierType): number {
    return amDeck.cards.filter((attackModifier, index) => attackModifier.type === type && index <= amDeck.current).length;
  }

  changeAttackModifier(entity: Entity, type: AttackModifierType, value: number) {
    const figure = this.component.figureForEntity(entity);
    const amDeck = gameManager.attackModifierManager.byFigure(figure);
    const isMonster =
      (figure instanceof Monster &&
        ((!figure.isAlly && !figure.isAllied) || (!settingsManager.settings.alwaysAllyAttackModifierDeck && !gameManager.fhRules()))) ||
      (figure instanceof ObjectiveContainer && figure.amDeck === 'M');
    if (value > 0) {
      for (let i = 0; i < value; i++) {
        if (
          (type === AttackModifierType.bless && gameManager.attackModifierManager.countUpcomingBlesses() < 10) ||
          (type === AttackModifierType.curse && gameManager.attackModifierManager.countUpcomingCurses(isMonster) < 10)
        ) {
          gameManager.attackModifierManager.addModifier(amDeck, new AttackModifier(type));
        }
      }
    } else if (value < 0) {
      let card = amDeck.cards.find((attackModifier, index) => attackModifier.type === type && index > amDeck.current);
      while (card && value < 0) {
        amDeck.cards.splice(amDeck.cards.indexOf(card), 1);
        card = amDeck.cards.find((attackModifier, index) => attackModifier.type === type && index > amDeck.current);
        value++;
      }
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
    if (this.component.bless !== 0) {
      this.component.before(
        this.component.bless < 0
          ? 'removeCondition' + (this.component.bless < -1 ? 's' : '')
          : 'addCondition' + (this.component.bless > 1 ? 's' : ''),
        AttackModifierType.bless,
        this.component.bless > 0 ? this.component.bless : this.component.bless * -1
      );
      this.component.entities.forEach((entity) => {
        this.changeAttackModifier(entity, AttackModifierType.bless, this.component.bless);
      });
      gameManager.stateManager.after();
      this.component.bless = 0;
    }

    if (this.component.curse !== 0) {
      this.component.before(
        this.component.curse < 0
          ? 'removeCondition' + (this.component.curse < -1 ? 's' : '')
          : 'addCondition' + (this.component.curse > 1 ? 's' : ''),
        AttackModifierType.curse,
        this.component.curse > 0 ? this.component.curse : this.component.curse * -1
      );
      this.component.entities.forEach((entity) => {
        this.changeAttackModifier(entity, AttackModifierType.curse, this.component.curse);
      });
      gameManager.stateManager.after();
      this.component.curse = 0;
    }

    if (this.component.empower !== 0) {
      if (this.component.empowerChar || this.component.empower < 0) {
        this.component.before(
          this.component.empower < 0
            ? 'removeCondition' + (this.component.empower < -1 ? 's' : '')
            : 'addCondition' + (this.component.empower > 1 ? 's' : ''),
          AttackModifierType.empower,
          this.component.empower > 0 ? this.component.empower : this.component.empower * -1
        );
        this.component.entities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          const amDeck = gameManager.attackModifierManager.byFigure(figure);
          if (this.component.empowerChar && this.component.empower > 0) {
            const additional = gameManager.attackModifierManager.getAdditional(this.component.empowerChar, AttackModifierType.empower);
            for (let i = 0; i < Math.min(this.component.empower, additional.length); i++) {
              const count =
                this.component.empowerChar.additionalModifier
                  .filter((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.empower)
                  .map((perk) => perk.count)
                  .reduce((a, b) => a + b) -
                gameManager.attackModifierManager.countUpcomingAdditional(this.component.empowerChar, AttackModifierType.empower);
              if (count > 0) {
                gameManager.attackModifierManager.addModifier(amDeck, additional[i]);
              }
            }
          } else {
            for (let i = 0; i < this.component.empower * -1; i++) {
              const empower = amDeck.cards.find((am, index) => index > amDeck.current && am.type === AttackModifierType.empower);
              if (empower) {
                amDeck.cards.splice(amDeck.cards.indexOf(empower), 1);
              }
            }
          }
        });
        gameManager.stateManager.after();
        this.component.empower = 0;
      }
    }

    if (this.component.enfeeble !== 0) {
      if (this.component.enfeebleChar || this.component.enfeeble < 0) {
        this.component.before(
          this.component.enfeeble < 0
            ? 'removeCondition' + (this.component.enfeeble < -1 ? 's' : '')
            : 'addCondition' + (this.component.enfeeble > 1 ? 's' : ''),
          AttackModifierType.enfeeble,
          this.component.enfeeble > 0 ? this.component.enfeeble : this.component.enfeeble * -1
        );
        this.component.entities.forEach((entity) => {
          const figure = this.component.figureForEntity(entity);
          const amDeck = gameManager.attackModifierManager.byFigure(figure);
          if (this.component.enfeebleChar && this.component.enfeeble > 0) {
            const additional = gameManager.attackModifierManager.getAdditional(this.component.enfeebleChar, AttackModifierType.enfeeble);
            for (let i = 0; i < Math.min(this.component.enfeeble, additional.length); i++) {
              const count =
                this.component.enfeebleChar.additionalModifier
                  .filter((perk) => perk.attackModifier && perk.attackModifier.type === AttackModifierType.enfeeble)
                  .map((perk) => perk.count)
                  .reduce((a, b) => a + b) -
                gameManager.attackModifierManager.countUpcomingAdditional(this.component.enfeebleChar, AttackModifierType.enfeeble);
              if (count > 0) {
                gameManager.attackModifierManager.addModifier(amDeck, additional[i]);
              }
            }
          } else {
            for (let i = 0; i < this.component.enfeeble * -1; i++) {
              const enfeeble = amDeck.cards.find((am, index) => index > amDeck.current && am.type === AttackModifierType.enfeeble);
              if (enfeeble) {
                amDeck.cards.splice(amDeck.cards.indexOf(enfeeble), 1);
              }
            }
          }
        });
        gameManager.stateManager.after();
        this.component.enfeeble = 0;
      }
    }
  }
}
