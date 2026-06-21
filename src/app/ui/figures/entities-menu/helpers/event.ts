import { gameManager } from 'src/app/game/businesslogic/GameManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import {
  EventCardAttack,
  EventCardCondition,
  EventCardConditionType,
  EventCardEffect,
  EventCardEffectType
} from 'src/app/game/model/data/EventCard';
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

  constructor(private component: EntitiesMenuDialogComponent) {}

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

  close() {}

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

    if (distributionEffects.length > 0) {
      this.component.dialog.open(EventDistributionDialogComponent, {
        panelClass: ['dialog'],
        data: { effects: distributionEffects }
      });
    }
  }

  openOutpostAttack() {
    this.component.dialog
      .open(OutpostAttackComponent, {
        panelClass: ['dialog'],
        data: {
          attack: this.eventAttack,
          effects: this.eventOutpostAttackEffects
        }
      })
      .closed.subscribe({
        next: (result) => {
          if (result) {
            this.eventAttack = undefined;
            this.eventOutpostAttackEffects = [];
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
    if (gameManager.imbuementManager.imbuement) {
      gameManager.stateManager.before('gh2eImbuement.disable');
      gameManager.imbuementManager.disable(gameManager.game.monsterAttackModifierDeck);
    } else if (advanced) {
      gameManager.stateManager.before('gh2eImbuement.advanced');
      gameManager.imbuementManager.advanced(gameManager.game.monsterAttackModifierDeck);
    } else {
      gameManager.stateManager.before('gh2eImbuement');
      gameManager.imbuementManager.enable(gameManager.game.monsterAttackModifierDeck);
    }
    gameManager.stateManager.after();
  }
}
