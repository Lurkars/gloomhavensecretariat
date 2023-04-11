import { animate, style, transition, trigger } from "@angular/animations";
import { Overlay, OverlayPositionBuilder, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ChangeDetectionStrategy, Component, ComponentRef, Directive, ElementRef, HostListener, Input, OnInit } from "@angular/core";
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
    @Input('relative') relative: boolean = false;
    @Input('fh-force') fhForce: boolean = false;
    @Input('size') size: 'small' | 'large' | undefined;
}

@Directive({ selector: '[ghsTooltip]' })
export class GhsTooltipDirective implements OnInit {

    @Input('ghsTooltip') value = '';
    @Input('i18n-args') args: string[] = [];
    @Input('i18n-arg-label') argLabel: boolean = true;
    @Input('relative') relative: boolean = false;
    @Input('fh-force') fhForce: boolean = false;
    @Input('size') size: 'small' | 'large' | undefined;
    private overlayRef!: OverlayRef;

    constructor(private overlay: Overlay,
        private overlayPositionBuilder: OverlayPositionBuilder,
        private elementRef: ElementRef) {
    }

    ngOnInit(): void {
        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.elementRef)
            .withPositions([{
                originX: 'center',
                originY: 'top',
                overlayX: 'center',
                overlayY: 'bottom',
                offsetY: -8,
            }]);

        this.overlayRef = this.overlay.create({ positionStrategy });
    }

    @HostListener('mouseenter')
    show() {
        if (settingsManager.settings.tooltips) {
            const tooltipRef: ComponentRef<GhsTooltipComponent>
                = this.overlayRef.attach(new ComponentPortal(GhsTooltipComponent));
            tooltipRef.instance.value = this.value;
            tooltipRef.instance.args = this.args;
            tooltipRef.instance.argLabel = this.argLabel;
            tooltipRef.instance.relative = this.relative;
            tooltipRef.instance.fhForce = this.fhForce;
            tooltipRef.instance.size = this.size;
        }
    }

    @HostListener('mouseout')
    hide() {
        if (this.overlayRef.hasAttached()) {
            this.overlayRef.detach();
        }
    }
}