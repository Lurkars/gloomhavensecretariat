import { animate, style, transition, trigger } from "@angular/animations";
import { Overlay, OverlayPositionBuilder, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ChangeDetectionStrategy, Component, ComponentRef, Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
	standalone: false,
    selector: 'ghs-tooltip',
    styleUrls: ['./tooltip.scss'],
    templateUrl: './tooltip.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('tooltip', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate(300, style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate(300, style({ opacity: 0 })),
            ]),
        ]),
    ],
})
export class GhsTooltipComponent {

    @Input() value = '';
    @Input('ghs-label-args') args: string[] = [];
    @Input('ghs-label-args-replace') argLabel: boolean = true;
    @Input('style') style: 'gh' | 'fh' | false = false;
    @Input() relative: boolean = false;
    @Input() size: 'small' | 'large' | undefined;
    @Input() hint: boolean = false;
}

@Directive({
	standalone: false, selector: '[ghs-tooltip]' })
export class GhsTooltipDirective implements OnInit, OnDestroy {

    @Input('ghs-tooltip') value = '';
    @Input('ghs-label-args') args: (string | number | boolean)[] = [];
    @Input('ghs-label-args-replace') argLabel: boolean = true;
    @Input('style') style: 'gh' | 'fh' | false = false;
    @Input() relative: boolean = false;
    @Input() size: 'small' | 'large' | undefined;
    @Input() hint: boolean = false;
    @Input() toggable: boolean = true;
    @Input() originX: 'start' | 'center' | 'end' | undefined;
    @Input() originY: 'top' | 'center' | 'bottom' | undefined;
    @Input() overlayX: 'start' | 'center' | 'end' | undefined;
    @Input() overlayY: 'top' | 'center' | 'bottom' | undefined;
    @Input() offsetX: number = 0;
    @Input() offsetY: number = 0;
    @Input() delay: number = 0;
    @Input() disabled: boolean = false;
    private overlayRef!: OverlayRef;
    private timeout: any;

    constructor(private overlay: Overlay,
        private overlayPositionBuilder: OverlayPositionBuilder,
        private elementRef: ElementRef) {
    }

    ngOnInit(): void {
        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.elementRef)
            .withPositions([{
                originX: this.originX || 'start',
                originY: this.originY || 'bottom',
                overlayX: this.overlayX || (this.hint ? 'center' : 'start'),
                overlayY: this.overlayY || 'top',
                offsetX: this.offsetX,
                offsetY: this.offsetY
            }]);

        this.overlayRef = this.overlay.create({ positionStrategy });
        this.overlayRef.hostElement.style.zIndex = "3000";
        this.timeout = null;
    }

    @HostListener('mouseover')
    show() {
        if (!this.disabled && (settingsManager.settings.tooltips || !this.toggable) && this.value && !this.overlayRef.hasAttached() && !this.timeout) {
            this.timeout = setTimeout(() => {
                const tooltipRef: ComponentRef<GhsTooltipComponent>
                    = this.overlayRef.attach(new ComponentPortal(GhsTooltipComponent));
                tooltipRef.instance.value = this.value;
                tooltipRef.instance.args = this.args.map((arg) => '' + arg);
                tooltipRef.instance.argLabel = this.argLabel;
                tooltipRef.instance.style = this.style;
                tooltipRef.instance.relative = this.relative;
                tooltipRef.instance.size = this.size;
                tooltipRef.instance.hint = this.hint;
            }, this.delay || !this.hint && 500 || 1)
        };
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

    ngOnDestroy(): void {
        this.hide();
        this.overlayRef.dispose();
    }
}