import { Dialog } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { CharacterManager } from "src/app/game/businesslogic/CharacterManager";
import { GameManager, gameManager } from "src/app/game/businesslogic/GameManager";
import { SettingsManager, settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { Character } from "src/app/game/model/Character";
import { GameState } from "src/app/game/model/Game";
import { ObjectiveContainer } from "src/app/game/model/ObjectiveContainer";
import { ghsDefaultDialogPositions } from "src/app/ui/helper/Static";
import { CharacterInitiativeDialogComponent } from "./initiative-dialog";


@Component({
  standalone: false,
  selector: 'ghs-character-initiative',
  templateUrl: 'initiative.html',
  styleUrls: ['./initiative.scss']
})
export class CharacterInitiativeComponent implements OnInit, AfterViewInit {

  @Input() figure!: Character | ObjectiveContainer;
  @ViewChild('initiativeInput', { static: false }) initiativeInput!: ElementRef;

  characterManager: CharacterManager = gameManager.characterManager;
  gameManager: GameManager = gameManager;
  settingsManager: SettingsManager = settingsManager;
  GameState = GameState;
  character: Character | undefined;
  objectiveContainer: ObjectiveContainer | undefined;
  reveal: number = 0;

  constructor(private dialog: Dialog, private overlay: Overlay, public elementRef: ElementRef) { };

  ngOnInit(): void {
    if (this.figure instanceof Character) {
      this.character = this.figure;
    } else if (this.figure instanceof ObjectiveContainer) {
      this.objectiveContainer = this.figure;
    }
  }

  ngAfterViewInit(): void {
    if (this.initiativeInput) {
      this.initiativeInput.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {

        if (settingsManager.settings.keyboardShortcuts) {
          const tabindex = this.tabindex();
          if (event.key === 'Tab' && gameManager.game.state == GameState.draw) {
            let nextIndex = event.shiftKey ? tabindex - 1 : tabindex + 1;
            let next = document.getElementById('initiative-input-' + nextIndex);
            if (!next && tabindex > 0) {
              next = document.getElementById('initiative-input-0');
            } else if (nextIndex < 0) {
              nextIndex = gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent && (figure.initiativeVisible || !figure.initiative)).length - 1;
              next = document.getElementById('initiative-input-' + nextIndex);
              while (!next && nextIndex > 0) {
                nextIndex--;
                next = document.getElementById('initiative-input-' + nextIndex);
              }
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
          } else if (!event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === 'n') {
            const current = document.getElementById('initiative-input-' + tabindex);
            if (current && document.activeElement == current) {
              current.blur();
            }
          }
        }
      })
    }
  }

  initiativeHidden(): boolean {
    return gameManager.game.state == GameState.draw && this.figure instanceof Character && !this.figure.initiativeVisible;
  }

  updateInitiative(event: any) {
    if (this.reveal) {
      this.disableReveal();
    }
    const initiative: number = isNaN(+event.target.value) ? 0 : +event.target.value;
    if (((gameManager.game.state == GameState.draw || !settingsManager.settings.initiativeRequired) && initiative >= 0 || initiative > 0) && initiative < 100) {
      this.setInitiative(initiative);
    } else {
      event.target.value = (this.figure.initiative < 10 ? '0' : '') + this.figure.initiative;
    }
  }

  enableReveal(event: any) {
    if (this.initiativeInput) {
      this.reveal = this.figure.initiative;
      this.figure.initiative = 0;
      setTimeout(() => {
        this.initiativeInput.nativeElement.focus();
      }, 1);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  disableReveal() {
    if (this.reveal) {
      this.figure.initiative = this.reveal;
      this.reveal = 0;
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
    return gameManager.game.figures.filter((figure) => figure instanceof Character && !figure.absent && !figure.exhausted && (figure.initiativeVisible || !figure.initiative)).indexOf(this.figure);
  }

}

