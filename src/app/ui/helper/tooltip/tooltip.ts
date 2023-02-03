import { animate, style, transition, trigger } from "@angular/animations";
import { Overlay, OverlayPositionBuilder, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { ChangeDetectionStrategy, Component, ComponentRef, Directive, ElementRef, HostListener, Input, OnInit } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";
import { ghsDefaultDialogPositions } from "../Static";

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
export class GhsTooltipComponent implements OnInit {

    @Input() label = '';
    @Input('i18n-args') args: string[] = [];
    html: SafeHtml = "";

    constructor(private sanitizer: DomSanitizer) { }

    ngOnInit(): void {
        this.html = this.sanitizer.bypassSecurityTrustHtml(settingsManager.getLabel(this.label, this.args));
    }
}

@Directive({ selector: '[ghsTooltip]' })
export class GhsTooltipDirective implements OnInit {

    @Input('ghsTooltip') label = '';
    @Input('i18n-args') args: string[] = [];
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
        const tooltipRef: ComponentRef<GhsTooltipComponent>
            = this.overlayRef.attach(new ComponentPortal(GhsTooltipComponent));
        tooltipRef.instance.label = this.label;
        tooltipRef.instance.args = this.args;
    }

    @HostListener('mouseout')
    hide() {
        this.overlayRef.detach();
    }
}