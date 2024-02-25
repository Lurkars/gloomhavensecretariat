import { Dialog } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { Objective } from "src/app/game/model/Objective";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { CharacterInitiativeDialogComponent } from "./initiative-dialog";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";


@Component({
  selector: 'ghs-character-initiative',
  templateUrl: 'initiative.html',
  styleUrls: ['./initiative.scss']
})
export class CharacterInitiativeComponent implements OnInit, AfterViewInit {

  @Input() figure!: Character | Objective | ObjectiveContainer;
  @ViewChild('initativeInput', { static: false }) initiativeInput!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  character: Character | undefined;
  objective: Objective | undefined;
  objectiveContainer: ObjectiveContainer | undefined;

  constructor(private dialog: Dialog, private overlay: Overlay, public elementRef: ElementRef) { };

  ngOnInit(): void {
    if (this.figure instanceof Character) {
      this.character = this.figure;
    } else if (this.figure instanceof Objective) {
      this.objective = this.figure;
    } else if (this.figure instanceof ObjectiveContainer) {
      this.objectiveContainer = this.figure;
    }
  }

  ngAfterViewInit(): void {
    if (this.initiativeInput) {
      this.initiativeInput.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
        const tabindex = this.tabindex();
        if (event.key === 'Tab' && gameManager.game.state == GameState.draw) {
          const availableCharacters = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent) as Character[];
          const indexedCharacters = availableCharacters.map((c, i) => ({character: c, index: i}));

          // Build a list of ordered characters to test.
          // indexedCharacters:      a b c d e f g
          //                               ^ this element
          // without event.shiftKey: e f g a b c d
          // with event.shiftKey:    c b a g f e d
          // these are reversed:     ~~~~~~~~~~~
          // 'this' is always last:              ~
          let orderedCharacters = [
            ...indexedCharacters.slice(tabindex + 1), // everything after this element
            ...indexedCharacters.slice(0, tabindex), // everything before this element
          ];
          // Reverse the order if we're going backwards.
          if (event.shiftKey) { orderedCharacters.reverse(); }
          orderedCharacters.push(indexedCharacters[tabindex]);

          // Look for the first unexhausted character in the ordered list of characters.
          let next: HTMLElement | null = null;
          for (const {character, index} of orderedCharacters) {
            if (character.exhausted) { continue; }
            next = document.getElementById('initiative-input-' + index);
            if (next) { break; }
          }

          // Try the first element as a fallback if nothing was found.
          if (!next) {
            next = document.getElementById('initiative-input-0');
          }

          if (next) {
            next.focus();
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (event.key === 'Escape') {
          const current = document.getElementById('initiative-input-' + tabindex);
          if (current && document.activeElement == current) {
            current.blur();
            event.preventDefault();
            event.stopPropagation();
          }
        }
      })
    }
  }

  initiativeHidden(): boolean {
    return gameManager.game.state == GameState.draw && this.figure instanceof Character && !this.figure.initiativeVisible;
  }

  updateInitiative(event: any) {
    const initiative: number = isNaN(+event.target.value) ? 0 : +event.target.value;
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100) {
      this.setInitiative(initiative);
    } else {
      event.target.value = (this.figure.initiative < 10 ? '0' : '') + this.figure.initiative;
    }
  }

  setInitiative(initiative: number) {
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100 && initiative != this.figure.initiative) {
      if (this.character) {
        gameManager.stateManager.before("setInitiative", gameManager.characterManager.characterName(this.character), "" + initiative);
        this.character.initiativeVisible = true;
        this.character.longRest = false;
        if (initiative == 99) {
          this.character.longRest = true;
        }
      } else if (this.objective) {
        gameManager.stateManager.before("setInitiative", "data.objective." + this.figure.name, "" + initiative);
      }
      this.figure.initiative = initiative;
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures(this.character);
      }
      gameManager.stateManager.after();
    }
  }

  longRestOff(event: any) {
    if (this.character && this.character.longRest) {
      gameManager.stateManager.before("characterLongRestOff", gameManager.characterManager.characterName(this.character));
      this.character.longRest = false;
      if (gameManager.game.state == GameState.next) {
        gameManager.sortFigures(this.character);
      }
      gameManager.stateManager.after();
      event.preventDefault();
    }
  }

  open(event: any) {
    this.dialog.open(CharacterInitiativeDialogComponent, {
      panelClass: ['dialog'],
      data: this.figure,
      positionStrategy: this.overlay.position().flexibleConnectedTo(this.elementRef).withPositions(ghsDefaultDialogPositions())
    });
  }

  tabindex(): number {
    return gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent).indexOf(this.figure);
  }

  focusNext(event: KeyboardEvent) {
  }

}

