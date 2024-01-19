import { Directive, HostListener } from "@angular/core";

@Directive({
    selector: '[tabclick]',
    host: {
        "tabindex": "0",
        "role": "button"
    }
})
export class TabClickDirective {

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if ((event.key === 'Enter' || event.key === ' ') && !event.shiftKey && !event.altKey && event.target instanceof HTMLElement) {
            const disabled = event.target.getAttribute('disabled') || event.target.classList.contains('disabled') || event.target.parentElement && (event.target.parentElement.getAttribute('disabled') || event.target.parentElement.classList.contains('disabled'));
            event.preventDefault();
            event.stopPropagation();
            if (!disabled) {
                event.target.click();
            }
        }
    }
}