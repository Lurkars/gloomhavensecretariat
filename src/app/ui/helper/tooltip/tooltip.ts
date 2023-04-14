import { animate, style, transition, trigger } from "@angular/animations";
import { Overlay, OverlayPositionBuilder, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ChangeDetectionStrategy, Component, ComponentRef, Directive, ElementRef, HostListener, Input, OnDestroy, OnInit } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Component({
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
    @Input('i18n-args') args: string[] = [];
    @Input('i18n-arg-label') argLabel: boolean = true;
    @Input('fh-force') fhForce: boolean = false;
    @Input() relative: boolean = false;
    @Input() size: 'small' | 'large' | undefined;
    @Input() hint: boolean = false;
}

@Directive({ selector: '[ghsTooltip]' })
export class GhsTooltipDirective implements OnInit, OnDestroy {

    @Input('ghsTooltip') value = '';
    @Input('i18n-args') args: string[] = [];
    @Input('i18n-arg-label') argLabel: boolean = true;
    @Input('fh-force') fhForce: boolean = false;
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
    @Input() delay: number = 500;
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
                overlayX: this.overlayX || 'start',
                overlayY: this.overlayY || 'top',
                offsetX: this.offsetX,
                offsetY: this.offsetY
            }]);

        this.overlayRef = this.overlay.create({ positionStrategy });
        this.timeout = null;
    }

    @HostListener('mouseover')
    show() {
        if ((settingsManager.settings.tooltips || !this.toggable) && this.value && !this.overlayRef.hasAttached() && !this.timeout) {
            this.timeout = setTimeout(() => {
                const tooltipRef: ComponentRef<GhsTooltipComponent>
                    = this.overlayRef.attach(new ComponentPortal(GhsTooltipComponent));
                tooltipRef.instance.value = this.value;
                tooltipRef.instance.args = this.args;
                tooltipRef.instance.argLabel = this.argLabel;
                tooltipRef.instance.fhForce = this.fhForce;
                tooltipRef.instance.relative = this.relative;
                tooltipRef.instance.size = this.size;
                tooltipRef.instance.hint = this.hint;
            }, this.delay)
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
    }
}