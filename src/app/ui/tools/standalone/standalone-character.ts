import { Dialog } from '@angular/cdk/dialog';
import { DestroyRef, Directive, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { GameManager } from 'src/app/game/businesslogic/GameManager';
import { GhsManager } from 'src/app/game/businesslogic/GhsManager';
import { gameManager, settingsManager, storageManager } from 'src/app/game/businesslogic/Managers';
import { SettingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Character } from 'src/app/game/model/Character';
import { CharacterSheetDialog } from 'src/app/ui/figures/character/dialogs/character-sheet-dialog';
import { environment } from 'src/environments/environment';

/**
 * Route identifier for a character: the character name, prefixed with the edition if the name is not unique in the current game.
 */
export function ghsCharacterRouteId(character: Character): string {
  const unique = gameManager.game.figures.filter((figure) => figure instanceof Character && figure.name === character.name).length < 2;
  return unique ? character.name : character.edition + '-' + character.name;
}

export function ghsFindCharacterByRouteId(id: string): Character | undefined {
  const characters = gameManager.game.figures.filter((figure) => figure instanceof Character) as Character[];
  return (
    characters.find((character) => character.edition + '-' + character.name === id) || characters.find((character) => character.name === id)
  );
}

/**
 * Base for standalone views of a single character (`/<path>` and `/<path>/:character`).
 * Without route parameter, a character chooser is shown (single click selects, double click opens the character route).
 * With route parameter, the chooser is hidden and the view is fixed to that character.
 */
@Directive()
export abstract class StandaloneCharacterBase implements OnInit {
  protected dialog = inject(Dialog);
  protected ghsManager = inject(GhsManager);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;

  /** route path of the view without parameter */
  abstract readonly path: string;

  initialized: boolean = false;
  characters: Character[] = [];
  character: Character | undefined;
  characterParam: string | undefined;

  constructor() {
    this.ghsManager.uiChangeEffect(() => this.update());
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.characterParam = params.get('character') || undefined;
      this.update();
    });
  }

  /** character is fixed by route parameter, so hide the character chooser */
  get fixed(): boolean {
    return !!this.characterParam && !!this.character;
  }

  /** route parameter is given, but character is not part of the game */
  get notFound(): boolean {
    return this.initialized && !!this.characterParam && !this.character;
  }

  async ngOnInit() {
    // already initialized, e.g. when navigating from main view
    if (!gameManager.stateManager.ready) {
      try {
        await storageManager.init();
      } catch {
        // continue
      }
      await settingsManager.init(!environment.production);
      await gameManager.stateManager.init(true);
    }
    this.initialized = true;
    this.update();
    this.ghsManager.triggerUiChange();

    const onFocus = () => {
      if (settingsManager.settings.serverAutoconnect && gameManager.serverSyncManager.wsState() !== WebSocket.OPEN) {
        gameManager.serverSyncManager.connect();
      }
    };
    window.addEventListener('focus', onFocus);
    this.destroyRef.onDestroy(() => window.removeEventListener('focus', onFocus));
  }

  update() {
    this.characters = gameManager.game.figures.filter((figure) => figure instanceof Character) as Character[];
    if (this.characterParam) {
      this.character = ghsFindCharacterByRouteId(this.characterParam);
    } else {
      this.character = this.characters.find((character) => character.fullview) || this.characters[0] || undefined;
    }
  }

  vertical(): boolean {
    return window.innerWidth < 800;
  }

  /** single click: select character, if already selected open character sheet */
  selectCharacter(character: Character) {
    if (this.character === character) {
      this.openCharacterSheet();
    } else {
      this.characters.forEach((char) => (char.fullview = false));
      this.character = character;
      this.character.fullview = true;
      gameManager.stateManager.saveLocal();
      this.ghsManager.triggerUiChange();
    }
  }

  openCharacterSheet(): void {
    if (this.character) {
      gameManager.stateManager.updatePermissions();
      this.dialog.open(CharacterSheetDialog, {
        panelClass: ['dialog-invert'],
        data: { character: this.character }
      });
    }
  }

  /** double click: follow character route, which hides the character chooser */
  openCharacter(character: Character) {
    this.router.navigate(['/' + this.path, ghsCharacterRouteId(character)]);
  }
}
