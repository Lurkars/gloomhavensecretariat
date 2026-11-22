import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';
import {
  EventCardAttack,
  EventCardCondition,
  EventCardConditionType,
  EventCardEffect,
  EventCardEffectType
} from 'src/app/game/model/data/EventCard';
import { OutpostAttackModel } from 'src/app/game/model/data/OutpostAttack';
import type { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';
import { FavorsComponent } from 'src/app/ui/figures/entities-menu/favors/favors';
import { OutpostAttackComponent } from 'src/app/ui/figures/entities-menu/outpost-attack/outpost-attack';
import { EventCardDeckComponent } from 'src/app/ui/figures/event/deck/event-card-deck';
import {
  CollectiveDistributionEffects,
  EventDistributionDialogComponent
} from 'src/app/ui/figures/event/distribution/event-distribution-dialog';
import { EventCardDrawComponent } from 'src/app/ui/figures/event/draw/event-card-draw';

export class EventHelper {
  eventTypes: string[] = [];

  eventEffectsManual: EventCardEffect[] = [];
  eventOutpostAttackEffects: EventCardEffect[] = [];
  eventConditionManual: EventCardCondition[] = [];
  eventAttack: EventCardAttack | undefined;
  private outpostAttackStarted: boolean = false;
  private manualAttack: { key: string; attack: EventCardAttack | undefined } = { key: '', attack: undefined };

  constructor(private component: EntitiesMenuDialogComponent) {}

  get outpostAttack(): OutpostAttackModel | undefined {
    return gameManager.game.party.outpostAttack;
  }

  get outpostAttackCard(): EventCardAttack | undefined {
    const outpostAttack = this.outpostAttack;
    if (!outpostAttack || outpostAttack.attack) {
      return outpostAttack && outpostAttack.attack;
    }
    const key = [outpostAttack.manualAttackValue, outpostAttack.manualTargetNumber, outpostAttack.soldiers, outpostAttack.attacks].join();
    if (this.manualAttack.key !== key || !this.manualAttack.attack) {
      this.manualAttack = { key, attack: gameManager.outpostAttackManager.attack() };
    }
    return this.manualAttack.attack;
  }

  update() {
    this.eventTypes = Object.keys(gameManager.game.party.eventDecks);
    if (gameManager.game.edition === 'fh') {
      if (Math.max(gameManager.game.party.weeks, 0) % 20 < 10) {
        this.eventTypes = this.eventTypes.filter((type) => !type.startsWith('winter-'));
      } else {
        this.eventTypes = this.eventTypes.filter((type) => !type.startsWith('summer-'));
      }
    }
  }

  close() {
    if (this.outpostAttackStarted) {
      this.cancelOutpostAttack();
    }
  }

  cancelOutpostAttack() {
    if (this.outpostAttack) {
      gameManager.stateManager.before('outpostAttack.cancel');
      gameManager.outpostAttackManager.finish();
      gameManager.stateManager.after();
    }
    this.outpostAttackStarted = false;
  }

  startOutpostAttack(attack: EventCardAttack | undefined, effects: EventCardEffect[] = [], replace: boolean = false) {
    if (this.outpostAttack && !replace) {
      return;
    }
    gameManager.stateManager.before('outpostAttack.start');
    if (this.outpostAttack) {
      gameManager.outpostAttackManager.finish();
    }
    gameManager.outpostAttackManager.start(attack, effects);
    gameManager.stateManager.after();
    this.outpostAttackStarted = true;
  }

  toggleEventMenu(force: boolean = false) {
    this.component.eventMenu = !this.component.eventMenu || force;
    this.component.filter = 'character';
    this.component.forceEventMenu = this.component.eventMenu && force;
    this.component.updateFigures();
  }

  setupEvents(type: string) {
    this.component.dialog.open(EventCardDeckComponent, {
      panelClass: ['dialog'],
      data: {
        type: type,
        edition: gameManager.game.edition || gameManager.currentEdition()
      }
    });
  }

  drawEvent(type: string) {
    this.component.dialog
      .open(EventCardDrawComponent, {
        panelClass: ['dialog'],
        data: {
          edition: gameManager.game.party.edition || gameManager.currentEdition(),
          type: type
        }
      })
      .closed.subscribe({
        next: (results: (EventCardEffect | EventCardCondition)[] | any) => {
          if (settingsManager.settings.eventsApply && results) {
            this.createEventResults(results);
          }
        }
      });
  }

  createEventResults(results: (EventCardEffect | EventCardCondition | EventCardAttack)[]) {
    this.eventEffectsManual = [];
    this.eventOutpostAttackEffects = [];
    this.eventConditionManual = [];
    this.eventAttack = undefined;

    const distributionEffects: EventCardEffect[] = [];

    results.forEach((result) => {
      if ('type' in result && result.type in EventCardEffectType) {
        if (result.type === EventCardEffectType.outpostAttack || result.type === EventCardEffectType.outpostTarget) {
          this.eventOutpostAttackEffects.push(result as EventCardEffect);
        } else if (CollectiveDistributionEffects.includes((result as EventCardEffect).type)) {
          distributionEffects.push(result as EventCardEffect);
        } else {
          this.eventEffectsManual.push(result as EventCardEffect);
        }
      } else if ('type' in result && result.type in EventCardConditionType) {
        this.eventConditionManual.push(result as EventCardCondition);
      } else if (!('type' in result)) {
        this.eventAttack = result as EventCardAttack;
      }
    });

    if (this.eventAttack) {
      this.startOutpostAttack(this.eventAttack, this.eventOutpostAttackEffects, true);
    }

    this.openDistribution(distributionEffects);
  }

  openDistribution(effects: EventCardEffect[]) {
    if (effects.length > 0) {
      this.component.dialog.open(EventDistributionDialogComponent, {
        panelClass: ['dialog'],
        data: { effects: effects }
      });
    }
  }

  openOutpostAttack() {
    this.startOutpostAttack(undefined);
    this.component.dialog
      .open(OutpostAttackComponent, {
        panelClass: ['dialog']
      })
      .closed.subscribe({
        next: (result) => {
          if (result) {
            this.openDistribution(result as EventCardEffect[]);
          }
        }
      });
  }

  openFavors() {
    this.component.dialog.open(FavorsComponent, {
      panelClass: ['dialog']
    });
  }

  toggleImbuement(advanced: boolean = false) {
    const mode = gameManager.imbuementManager.imbuement ? 'disable' : advanced ? 'advanced' : 'enable';
    gameManager.stateManager.before(mode === 'enable' ? 'gh2eImbuement' : 'gh2eImbuement.' + mode);
    gameManager.imbuementManager.setMode(mode);
    gameManager.stateManager.after();
  }
}
