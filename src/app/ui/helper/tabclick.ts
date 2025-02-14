import { Directive, HostListener } from "@angular/core";
import { settingsManager } from "src/app/game/businesslogic/SettingsManager";

@Directive({
    standalone: false,
    selector: '[tabclick]',
    host: {
        "tabindex": "0",
        "role": "button"
    }
})
export class TabClickDirective {

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (settingsManager.settings.keyboardShortcuts && (event.key === 'Enter' || event.key === ' ') && !event.shiftKey && !event.altKey && event.target instanceof HTMLElement) {
            const disabled = event.target.getAttribute('disabled') || event.target.classList.contains('disabled') || event.target.parentElement && (event.target.parentElement.getAttribute('disabled') || event.target.parentElement.classList.contains('disabled'));
            event.preventDefault();
            event.stopPropagation();
            if (!disabled) {
                event.target.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
                event.target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                event.target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            }
        }
    }
}