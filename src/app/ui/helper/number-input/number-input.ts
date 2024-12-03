import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
	standalone: false,
    selector: 'ghs-number-input',
    styleUrls: ['./number-input.scss'],
    templateUrl: './number-input.html'
})
export class GhsNumberInput implements OnInit {

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

    stepsNegative: number[] = this.steps.map((value) => value).reverse();

    ngOnInit(): void {
        this.stepsNegative = this.steps.map((value) => value).reverse();
    }

    change(value: number) {
        this.modelChange.emit(this.model + value);
    }
}