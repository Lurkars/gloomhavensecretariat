import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager, gameManager } from 'src/app/game/businesslogic/GameManager';
import { SettingsManager, settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { AttackModifier, defaultAttackModifier } from 'src/app/game/model/data/AttackModifier';
import { PerkType } from 'src/app/game/model/data/Perks';
import { AttackModifierComponent } from 'src/app/ui/figures/attackmodifier/attackmodifier';
import { HeaderComponent } from 'src/app/ui/header/header';
import { GhsLabelDirective } from 'src/app/ui/helper/label';
import { TrackUUIDPipe } from 'src/app/ui/helper/trackUUID';
import { environment } from 'src/environments/environment';

@Component({
  imports: [FormsModule, AttackModifierComponent, HeaderComponent, GhsLabelDirective, TrackUUIDPipe],
  selector: 'ghs-attackmodifier-tool',
  templateUrl: './attackmodifier-tool.html',
  styleUrls: ['./attackmodifier-tool.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttackModifierToolComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  characterName: string[] = [];
  characters: Character[] = [];
  filteredCharacters: Character[] = [];
  edition: string | undefined;

  private destroyRef = inject(DestroyRef);

  async ngOnInit() {
    await settingsManager.init(!environment.production);
    gameManager.stateManager.init(true);
    this.edition = gameManager.editions(true)[0];
    this.update();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (queryParams) => {
        let update = false;
        if (queryParams['edition']) {
          this.edition = queryParams['edition'];
          if (this.edition && gameManager.editions(!true).includes(this.edition)) {
            this.edition = undefined;
          }
          update = true;
        }
        if (queryParams['characters']) {
          this.characterName = typeof queryParams['characters'] === 'string' ? [queryParams['characters']] : queryParams['characters'];
          update = true;
        }
        if (update) {
          this.update();
        }
      }
    });
  }

  update() {
    this.characters = [];
    gameManager.charactersData(this.edition).forEach((characterData) => {
      const character = new Character(characterData, 0);

      character.attackModifierDeck.cards = [];

      let perkId = 0;
      character.perks.forEach((perk) => {
        if (perk.cards) {
          perk.cards.forEach((card, index) => {
            if (perk.type === PerkType.add || perk.type === PerkType.replace) {
              const am = Object.assign(new AttackModifier(card.attackModifier.type), card.attackModifier);
              am.id = 'perk' + perkId;
              if (
                !gameManager.attackModifierManager.findByAttackModifier(defaultAttackModifier, am) ||
                perk.type === PerkType.add ||
                index > 0
              ) {
                am.character = true;
              }
              if (am.character) {
                if (!gameManager.attackModifierManager.findByAttackModifier(character.attackModifierDeck.cards, am)) {
                  perkId++;
                }
                for (let i = 0; i < card.count * perk.count; i++) {
                  character.attackModifierDeck.cards = [
                    ...character.attackModifierDeck.cards,
                    Object.assign(new AttackModifier(card.attackModifier.type), am)
                  ];
                }
              }
            }
          });
        }
      });

      this.characters.push(character);
    });
    this.characters.sort((a, b) => {
      if (a.edition !== b.edition) {
        return a.edition < b.edition ? -1 : 1;
      } else {
        const aName = settingsManager.getLabel('data.character.' + a.edition + '.' + a.name).toLowerCase();
        const bName = settingsManager.getLabel('data.character.' + b.edition + '.' + b.name).toLowerCase();
        return aName < bName ? -1 : 1;
      }
    });

    this.filteredCharacters = [];
    this.characterName.forEach((name) => {
      const character = this.characters.find((character) => character.name === name);
      if (character) {
        this.filteredCharacters.push(character);
      }
    });
  }

  updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { edition: this.edition || undefined, characters: this.characterName || undefined },
      queryParamsHandling: 'merge'
    });
  }
}
