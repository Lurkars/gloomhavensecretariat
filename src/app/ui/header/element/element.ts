import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { gameManager, GameManager } from "src/app/game/businesslogic/GameManager";
import { Element } from "src/app/game/model/Element";
import { GameState } from "src/app/game/model/Game";
import { GhsSvgComponent } from "../../helper/svg/svg";

@Component({
  selector: 'ghs-element-icon',
  templateUrl: './element.html', encapsulation: ViewEncapsulation.None,
  styleUrls: [ './element.scss' ]
})
export class ElementIconComponent extends GhsSvgComponent {

  @Input() element!: Element;
  gameManager: GameManager = gameManager;
  GameState = GameState;

  override ngOnInit(): void {
    this.src = './assets/images/element/' + this.element + '.svg';
    super.ngOnInit();
  }


  toggleElement(): void {
    gameManager.stateManager.before();
    gameManager.toggleElement(this.element);
    gameManager.stateManager.after();
  }

}