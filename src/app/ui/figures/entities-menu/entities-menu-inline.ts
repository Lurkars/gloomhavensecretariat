import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  effect,
  inject,
  input,
  untracked
} from '@angular/core';
import { Subject } from 'rxjs';
import { gameManager } from 'src/app/game/businesslogic/Managers';
import { Entity } from 'src/app/game/model/Entity';
import { Figure } from 'src/app/game/model/Figure';
import { EntitiesMenuDialogComponent } from 'src/app/ui/figures/entities-menu/entities-menu-dialog';

/** minimal DialogRef replacement, closing applies the buffered changes of the entities menu */
class InlineDialogRef {
  readonly closed = new Subject<any>();
  readonly overlayRef = { overlayElement: undefined, hostElement: undefined, backdropElement: undefined };

  constructor(private onClose: () => void) {}

  close(result: any = undefined) {
    this.closed.next(result);
    this.closed.complete();
    this.onClose();
  }
}

/**
 * Embeds the entities menu (normally a dialog) inline.
 * The entities menu buffers all changes and applies them on close, so changes are applied after a short delay
 * without interaction (or when leaving the view) and the menu is recreated afterwards.
 * External changes recreate the menu as well, as long as no own changes are pending.
 */
@Component({
  imports: [NgComponentOutlet],
  selector: 'ghs-entities-menu-inline',
  template: `<div class="dialog">
    <div class="dialog-container">
      @for (k of [key]; track k) {
        <ng-container *ngComponentOutlet="component; injector: injector"></ng-container>
      }
    </div>
  </div>`,
  styles: [
    ':host { display: block; max-width: 100%; }',
    '.dialog { margin: calc(var(--ghs-unit) * 1); }',
    '.dialog-container { max-width: 100%; }'
  ]
})
export class EntitiesMenuInlineComponent implements OnDestroy {
  private parentInjector = inject(Injector);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);

  readonly figure = input.required<Figure>();
  readonly entity = input<Entity>();
  readonly applyDelay = input<number>(1500);

  component = EntitiesMenuDialogComponent;
  injector: Injector = this.parentInjector;
  key: number = 0;

  private dialogRef: InlineDialogRef | undefined;
  private timeout: any;
  private destroyed: boolean = false;

  constructor() {
    effect(() => {
      const figure = this.figure();
      const entity = this.entity();
      untracked(() => this.create(figure, entity));
    });

    // recreate on external changes (e.g. on the character board or from server), unless own changes are pending
    let initial = true;
    effect(() => {
      gameManager.uiChangeSignal();
      if (initial) {
        initial = false;
        return;
      }
      untracked(() => {
        if (!this.timeout && !this.destroyed) {
          this.create();
        }
      });
    });
  }

  private create(figure: Figure = this.figure(), entity: Entity | undefined = this.entity()) {
    this.clearTimeout();
    const dialogRef = new InlineDialogRef(() => {
      if (!this.destroyed && this.dialogRef === dialogRef) {
        this.create();
      }
    });
    this.dialogRef = dialogRef;
    this.injector = Injector.create({
      providers: [
        { provide: DIALOG_DATA, useValue: { figure: figure, entity: entity, positionElement: this.elementRef } },
        { provide: DialogRef, useValue: dialogRef }
      ],
      parent: this.parentInjector
    });
    this.key++;
    this.cdr.markForCheck();
  }

  @HostListener('pointerup')
  @HostListener('document:keyup')
  scheduleApply() {
    this.clearTimeout();
    this.timeout = setTimeout(() => this.apply(), this.applyDelay());
  }

  apply() {
    this.clearTimeout();
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  private clearTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.timeout) {
      this.apply();
    }
  }
}
