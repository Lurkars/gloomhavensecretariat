import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { storageManager } from 'src/app/game/businesslogic/StorageManager';
import { GameState } from 'src/app/game/model/Game';
import { LootDeckChange, LootDeckComponent } from 'src/app/ui/figures/loot/loot-deck';
import { HeaderComponent } from 'src/app/ui/header/header';
import { KeyboardShortcuts } from 'src/app/ui/helper/keyboard-shortcuts';
import { environment } from 'src/environments/environment';

@Component({
  imports: [NgClass, LootDeckComponent, HeaderComponent, KeyboardShortcuts],
  selector: 'ghs-loot-deck-standalone',
  templateUrl: './loot-deck-standalone.html',
  styleUrls: ['./loot-deck-standalone.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LootDeckStandaloneComponent implements OnInit {
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  configuration: boolean = false;

  async ngOnInit() {
    try {
      await storageManager.init();
    } catch {
      // continue
    }
    await settingsManager.init(!environment.production);
    await gameManager.stateManager.init(true);
    this.ghsManager.triggerUiChange();
    if (gameManager.game.state != GameState.next) {
      gameManager.roundManager.nextGameState(true);
    }

    if (gameManager.game.lootDeck.cards.length == 0) {
      this.configuration = true;
    }
  }

  vertical(): boolean {
    return window.innerWidth < 800;
  }

  beforeLootDeck(change: LootDeckChange) {
    gameManager.stateManager.before(change.type, ...change.values);
  }

  afterLootDeck(change: LootDeckChange) {
    gameManager.game.lootDeck = change.deck;
    gameManager.stateManager.after();
  }
}
