import { ChangeDetectorRef, Directive, ElementRef, inject } from '@angular/core';
import { gameManager, settingsManager } from 'src/app/game/businesslogic/Managers';

@Directive()
export abstract class DeckDrawDirective {
  protected element = inject(ElementRef);
  protected cdr = inject(ChangeDetectorRef);

  current: number = -1;
  drawing: boolean = false;
  drawTimeout: any = null;
  queue: number = 0;
  queueTimeout: any = null;
  init: boolean = false;
  initServer: boolean = false;

  protected abstract drawingClass: string;
  protected serverAware: boolean = true;

  protected abstract deckCurrent(): number;

  protected drawDuration(): number {
    return 1050;
  }

  protected drawAll(): boolean {
    return false;
  }

  protected synced() {}

  protected setDrawing(drawing: boolean) {
    this.drawing = drawing;
  }

  protected drawn?(index: number, fromServer: boolean): number;

  protected queueFinished() {}

  protected clickThrough(className: string = this.drawingClass) {
    this.element.nativeElement.addEventListener('pointerdown', (event: PointerEvent) => {
      const elements = document.elementsFromPoint(event.clientX, event.clientY);
      if (elements[0] && elements[0].classList.contains(className) && elements.length > 2) {
        (elements[2] as HTMLElement).click();
      }
    });
  }

  protected initQueue(initTimeout: number) {
    this.syncCurrent();
    if (!this.init) {
      this.drawTimeout = setTimeout(
        () => {
          this.syncCurrent();
          this.drawTimeout = null;
          this.init = true;
          this.cdr.markForCheck();
        },
        settingsManager.settings.animations ? initTimeout * settingsManager.settings.animationSpeed : 0
      );
    }
  }

  protected delayedDraw(draw: () => void) {
    this.drawTimeout = setTimeout(
      () => {
        draw();
        this.drawTimeout = null;
      },
      settingsManager.settings.animations ? 150 * settingsManager.settings.animationSpeed : 0
    );
  }

  protected updateQueue(active: boolean, fromServer: boolean) {
    const deckCurrent = this.deckCurrent();
    if (this.serverAware && this.initServer && gameManager.stateManager.wsState() !== WebSocket.OPEN) {
      this.initServer = false;
    }

    if (!active) {
      this.resetQueue();
      this.initServer = gameManager.stateManager.wsState() === WebSocket.OPEN;
    } else if (this.init && (!fromServer || this.initServer || !this.serverAware)) {
      if (this.current < deckCurrent) {
        const delta = deckCurrent - this.current;
        if (!fromServer && this.current === -1 && delta > 1) {
          this.syncCurrent();
        } else {
          this.queue = Math.max(0, delta);
          if (!this.queueTimeout) {
            if (this.drawAll()) {
              this.queue = 0;
              this.current = deckCurrent;
            } else {
              this.queue--;
              this.current++;
            }
            this.synced();
            this.nextDraw(fromServer);
          }
        }
      } else if (!this.queueTimeout || deckCurrent < this.current + this.queue) {
        this.resetQueue();
      }
    } else {
      this.syncCurrent();
      if (fromServer && !this.initServer) {
        this.initServer = true;
      }
    }
  }

  protected resetQueue() {
    if (this.queueTimeout) {
      clearTimeout(this.queueTimeout);
      this.queueTimeout = null;
    }
    this.queue = 0;
    this.setDrawing(false);
    this.syncCurrent();
  }

  private syncCurrent() {
    this.current = this.deckCurrent();
    this.synced();
  }

  private drawingElement(): HTMLElement | undefined {
    return this.element.nativeElement.getElementsByClassName(this.drawingClass)[0];
  }

  private nextDraw(fromServer: boolean) {
    this.setDrawing(true);
    this.drawingElement()?.classList.add('drawing');
    this.queueTimeout = setTimeout(
      () => {
        this.setDrawing(false);
        this.queueTimeout = null;
        const delay = this.drawn ? this.drawn(this.current, fromServer) : 0;
        if (delay > 0) {
          this.queueTimeout = setTimeout(() => this.continueQueue(fromServer), delay);
        } else {
          this.continueQueue(fromServer);
        }
        this.cdr.markForCheck();
      },
      settingsManager.settings.animations ? this.drawDuration() * settingsManager.settings.animationSpeed : 0
    );
  }

  private continueQueue(fromServer: boolean) {
    this.queueTimeout = null;
    if (this.queue > 0) {
      this.queue--;
      this.current++;
      this.nextDraw(fromServer);
    } else {
      this.drawingElement()?.classList.remove('drawing');
      if (this.queue < 0) {
        this.queue = 0;
      }
      this.queueFinished();
    }
    this.cdr.markForCheck();
  }
}
