import { Component, Input } from "@angular/core";
import { Entity, EntityValueFunction } from "src/app/game/model/Entity";

@Component({
  selector: 'ghs-healthbar',
  templateUrl: './healthbar.html',
  styleUrls: [ './healthbar.scss' ]
})
export class HealthbarComponent {

  @Input() entity!: Entity;


  maxHealth(): number {
    return EntityValueFunction("" + this.entity.maxHealth);
  }

}