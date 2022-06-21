import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { Action, ActionHex, ActionType, ActionValueType } from 'src/app/game/model/Action';
import { EntityValueFunction } from 'src/app/game/model/Entity';
import { FigureError } from 'src/app/game/model/FigureError';
import { Monster } from 'src/app/game/model/Monster';
import { MonsterEntity } from 'src/app/game/model/MonsterEntity';
import { MonsterStat } from 'src/app/game/model/MonsterStat';
import { MonsterType } from 'src/app/game/model/MonsterType';

@Component({
  selector: 'ghs-actions',
  templateUrl: './actions.html',
  styleUrls: [ './actions.scss' ]
})
export class ActionsComponent {

  @Input() monster!: Monster;
  @Input() actions!: Action[];
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() hexSize!: number;
  ActionType = ActionType;

}

@Component({
  selector: 'ghs-action',
  templateUrl: './action.html',
  styleUrls: [ './action.scss' ]
})
export class ActionComponent {

  @Input() monster!: Monster;
  @Input() action!: Action;
  @Input() relative: boolean = false;
  @Input() inline: boolean = false;
  @Input() right: boolean = false;
  @Input() hexSize!: number;

  ActionType = ActionType;
  ActionValueType = ActionValueType;

  invertIcons: ActionType[] = [ ActionType.attack, ActionType.fly, ActionType.heal, ActionType.jump, ActionType.loot, ActionType.move, ActionType.range, ActionType.retaliate, ActionType.shield, ActionType.target, ActionType.teleport ];

  getNormalValue() {
    if (this.monster.boss) {
      return this.getValue(MonsterType.boss);
    }
    return this.getValue(MonsterType.normal);
  }

  getEliteValue() {
    if (!this.monster.entities.some((monsterEntity: MonsterEntity) => {
      return monsterEntity.type == MonsterType.elite;
    })) {
      return this.getNormalValue();
    }

    return this.getValue(MonsterType.elite);
  }

  getStat(type: MonsterType): MonsterStat {
    const stat = this.monster.stats.find((monsterStat: MonsterStat) => {
      return monsterStat.level == this.monster.level && monsterStat.type == type;
    });
    if (!stat) {
      console.error("Could not find '" + type + "' stats for monster: " + this.monster.name + " level: " + this.monster.level);
      if (this.monster.errors.indexOf(FigureError.stat) == -1) {
        this.monster.errors.push(FigureError.stat);
      }
      return new MonsterStat(type, this.monster.level, 0, 0, 0, 0);
    }
    return stat;
  }

  getConditions(action: Action): string[] {
    if (action.value && typeof action.value === "string") {
      return action.value.split('|');
    }
    return [];
  }

  getSpecial(action: Action): Action[] {
    return this.getStat(MonsterType.boss).special[ (action.value as number) - 1 ];
  }

  getValue(type: MonsterType): number | string {
    const stat = this.getStat(type);
    if (settingsManager.settings.calculate && !this.relative) {
      let statValue: number = 0;
      let sign: boolean = true;
      switch (this.action.type) {
        case ActionType.attack:
          if (typeof stat.attack === "number") {
            statValue = stat.attack;
          } else {
            try {
              statValue = EntityValueFunction(stat.attack);
            } catch {
              sign = false;
            }
          }
          break;
        case ActionType.move:
          statValue = stat.movement;
          break;
        case ActionType.range:
          statValue = stat.range;
          break;
      }

      if (typeof this.action.value === "number" && sign) {
        if (this.action.valueType == ActionValueType.plus) {
          return statValue + this.action.value;
        } else if (this.action.valueType == ActionValueType.minus) {
          return statValue - this.action.value;
        }
      }

    }

    if (this.action.valueType == ActionValueType.plus) {
      return "+ " + this.action.value;
    } else if (this.action.valueType == ActionValueType.minus) {
      return "- " + this.action.value;
    } else {
      return this.action.value;
    }
  }

  isInvertIcon(type: ActionType) {
    return this.invertIcons.indexOf(type) != -1;
  }

}

@Component({
  selector: 'ghs-action-hex',
  template: '<canvas #canvas></canvas>'
})
export class ActionHexComponent implements AfterViewInit, OnChanges {

  @Input() value!: string;
  @Input() size!: number;
  hexes: ActionHex[] = [];
  init: boolean = false;

  @ViewChild('canvas', { read: ElementRef }) canvas!: ElementRef<HTMLCanvasElement>;
  public context: CanvasRenderingContext2D | null = null;

  ngOnChanges(changes: any) {
    this.draw();
  }

  ngAfterViewInit(): void {
    this.init = true;
    this.draw();
  }

  draw() {
    if (this.init) {
      this.hexes = [];
      this.value.split('|').forEach((hexValue: string) => {
        const hex: ActionHex | null = ActionHex.fromString(hexValue);
        if (hex != null) {
          this.hexes.push(hex);
        }
      })
      this.context = this.canvas.nativeElement.getContext('2d');
      if (this.context == null) {
        return;
      }
      let size: number = this.size;
      let mX = 1;
      let mY = 1;

      this.hexes.forEach((hex: ActionHex) => {
        mX = Math.max(mX, hex.x + 1);
        mY = Math.max(mY, hex.y + 1);
      });

      this.canvas.nativeElement.width = size * mX * 2;
      this.canvas.nativeElement.height = size * mY * 2 + (mY == 1 ? size : 0);

      setTimeout(() => {
        this.hexes.forEach((hex: ActionHex) => {
          this.drawHexagon(hex, size);
        });
      }, 1);
    }
  }


  drawHexagon(hex: ActionHex, size: number) {
    if (this.context == null) {
      return;
    }

    const a = Math.PI / 6;
    const m = size * 0.2;
    const h = Math.sin(a) * size;
    const r = Math.cos(a) * size;
    const rH = size + 2 * h;
    const rW = 2 * r;
    const oX = -size / 2;
    const oY = size / 2;

    const x = hex.x * rW + ((hex.y % 2) * r) + oX;
    const y = hex.y * (size + h) + oY;

    this.context.beginPath();
    this.context.moveTo(x + r, y);
    this.context.lineTo(x + rW, y + h);
    this.context.lineTo(x + rW, y + h + size);
    this.context.lineTo(x + r, y + rH);
    this.context.lineTo(x, y + size + h);
    this.context.lineTo(x, y + h);
    this.context.closePath();

    this.context.fillStyle = "#ffffff";
    this.context.stroke();
    this.context.fill();

    this.context.beginPath();
    this.context.moveTo(x + r, y + m);
    this.context.lineTo(x + rW - m, y + h + m / 2);
    this.context.lineTo(x + rW - m, y + h + size - m / 2);
    this.context.lineTo(x + r, y + rH - m);
    this.context.lineTo(x + m, y + size + h - m / 2);
    this.context.lineTo(x + m, y + h + m / 2);
    this.context.closePath();

    this.context.fillStyle = "#333333";
    if (hex.active) {
      this.context.fillStyle = "#ff0000";
    }
    this.context.fill();
  }

}