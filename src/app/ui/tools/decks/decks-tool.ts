import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { DeckData } from 'src/app/game/model/data/DeckData';
import { MonsterType } from 'src/app/game/model/data/MonsterType';
import { Monster } from 'src/app/game/model/Monster';
import { AbilityComponent } from 'src/app/ui/figures/ability/ability';
import { HeaderComponent } from 'src/app/ui/header/header';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

@Component({
  imports: [NgClass, FormsModule, AbilityComponent, HeaderComponent, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-decks-tool',
  templateUrl: './decks-tool.html',
  styleUrls: ['./decks-tool.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DecksToolComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ghsManager = inject(GhsManager);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  edition: string | undefined;
  monsters: Monster[] = [];
  characters: Character[] = [];
  character: boolean = false;
  entity: boolean = true;
  elite: boolean = true;
  level: number = 1;

  private destroyRef = inject(DestroyRef);

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.edition = gameManager.editions(true)[0];
    this.update();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (queryParams) => {
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(!true).includes(this.edition)) {
            this.edition = undefined;
          }
          this.update();
        }
      }
    });
  }

  update() {
    this.monsters = [];
    this.characters = [];
    if (!this.character) {
      const monsterData = gameManager.editionData
        .filter((editionData) => editionData.edition === this.edition)
        .map((editionData) => editionData.monsters)
        .flat()
        .filter(
          (monsterData, index, monsters) =>
            monsterData.replace ||
            (!monsterData.replace &&
              !monsters.find(
                (monsterDataReplacement) =>
                  monsterDataReplacement.replace &&
                  monsterDataReplacement.name === monsterData.name &&
                  monsterDataReplacement.edition === monsterData.edition
              ))
        );

      this.monsters = monsterData
        .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
        .map((monsterData) => {
          const monster = new Monster(monsterData, this.level);

          if (monster.boss && this.entity) {
            gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.boss);
          }

          if (!monster.boss && this.elite) {
            gameManager.monsterManager.addMonsterEntity(monster, 1, MonsterType.elite);
          }
          if (!monster.boss && this.entity) {
            gameManager.monsterManager.addMonsterEntity(monster, 2, MonsterType.normal);
          }

          return monster;
        });
    } else {
      const characterData = gameManager.editionData
        .filter((editionData) => editionData.edition === this.edition)
        .map((editionData) => editionData.characters)
        .flat()
        .filter((characterData) =>
          gameManager.decksData().some((deckData) => deckData.name === characterData.deck || deckData.name === characterData.name)
        );

      this.characters = characterData
        .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1))
        .map((characterData) => {
          return new Character(characterData, this.level);
        });
    }

    this.ghsManager.triggerUiChange();
  }

  deck(figure: Monster | Character): DeckData {
    return gameManager.deckData(figure);
  }

  updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edition: this.edition || undefined },
      queryParamsHandling: 'merge'
    });
  }
}
