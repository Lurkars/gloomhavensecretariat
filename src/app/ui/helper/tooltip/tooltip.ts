import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit
} from '@angular/core';
import { settingsManager } from 'src/app/game/businesslogic/SettingsManager';
import { GhsLabelDirective } from 'src/app/ui/helper/label';

@Component({
  imports: [NgClass, GhsLabelDirective],
  selector: 'ghs-tooltip-component',
  styleUrls: ['./tooltip.scss'],
  templateUrl: './tooltip.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GhsTooltipComponent {
  value = '';
  args: string[] = [];
  argLabel: boolean = true;
  style: 'gh' | 'fh' | false = false;
  relative: boolean = false;
  size: 'small' | 'large' | undefined;
  hint: boolean = false;
}

@Directive({
  selector: '[ghs-tooltip]'
})
export class GhsTooltipDirective implements OnInit {
  private overlay = inject(Overlay);
  private overlayPositionBuilder = inject(OverlayPositionBuilder);
  private elementRef = inject(ElementRef);

  private destroyRef = inject(DestroyRef);

  readonly value = input('', { alias: 'ghs-tooltip' });
  readonly args = input<(string | number | boolean)[]>([], { alias: 'ghs-label-args' });
  readonly argLabel = input<boolean>(true, { alias: 'ghs-label-args-replace' });
  readonly style = input<'gh' | 'fh' | false>(false);
  readonly relative = input<boolean>(false);
  readonly size = input<'small' | 'large'>();
  readonly hint = input<boolean>(false);
  readonly toggable = input<boolean>(true);
  readonly originX = input<'start' | 'center' | 'end'>();
  readonly originY = input<'top' | 'center' | 'bottom'>();
  readonly overlayX = input<'start' | 'center' | 'end'>();
  readonly overlayY = input<'top' | 'center' | 'bottom'>();
  readonly offsetX = input<number>(0);
  readonly offsetY = input<number>(0);
  readonly delay = input<number>(0);
  readonly disabled = input<boolean>(false);
  private overlayRef!: OverlayRef;
  private timeout: any;

  ngOnInit(): void {
    const positionStrategy = this.overlayPositionBuilder.flexibleConnectedTo(this.elementRef).withPositions([
      {
        originX: this.originX() || 'start',
        originY: this.originY() || 'bottom',
        overlayX: this.overlayX() || (this.hint() ? 'center' : 'start'),
        overlayY: this.overlayY() || 'top',
        offsetX: this.offsetX(),
        offsetY: this.offsetY()
      }
    ]);

    this.overlayRef = this.overlay.create({ positionStrategy });
    this.overlayRef.hostElement.style.zIndex = '999';
    this.timeout = null;
    this.destroyRef.onDestroy(() => {
      this.hide();
      this.overlayRef.dispose();
    });
  }

  @HostListener('mouseover')
  show() {
    if (
      !this.disabled() &&
      (settingsManager.settings.tooltips || !this.toggable()) &&
      this.value() &&
      !this.overlayRef.hasAttached() &&
      !this.timeout
    ) {
      this.timeout = setTimeout(
        () => {
          const tooltipRef: ComponentRef<GhsTooltipComponent> = this.overlayRef.attach(new ComponentPortal(GhsTooltipComponent));
          tooltipRef.instance.value = this.value();
          tooltipRef.instance.args = this.args().map((arg) => '' + arg);
          tooltipRef.instance.argLabel = this.argLabel();
          tooltipRef.instance.style = this.style();
          tooltipRef.instance.relative = this.relative();
          tooltipRef.instance.size = this.size();
          tooltipRef.instance.hint = this.hint();
        },
        this.delay() || (!this.hint() && 500) || 1
      );
    }
  }

  @HostListener('mouseleave')
  hide() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }
}
