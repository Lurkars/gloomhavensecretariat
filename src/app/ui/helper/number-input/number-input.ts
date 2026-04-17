import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GhsValueSignPipe } from 'src/app/ui/helper/Pipes';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TabClickDirective, GhsValueSignPipe],
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
