import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
    selector: 'ghs-number-input',
    styleUrls: ['./number-input.scss'],
    templateUrl: './number-input.html'
})
export class GhsNumberInput {

    @Input()
    model: number = 0;
    @Output()
    modelChange = new EventEmitter<number>();

    @Input()
    steps: number[] = [1, 2];

    @Input()
    negative: boolean = true;

    @Input()
    min: number | undefined = 0;

    @Input()
    max: number | undefined = undefined;

    @Input()
    relative: boolean = false;

    change(value: number) {
        this.modelChange.emit(this.model + value);
    }
}