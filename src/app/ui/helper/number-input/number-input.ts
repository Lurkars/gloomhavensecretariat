import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { GhsValueSignPipe } from 'src/app/ui/helper/Pipes';
import { TabClickDirective } from 'src/app/ui/helper/tabclick';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TabClickDirective, GhsValueSignPipe],
  selector: 'ghs-number-input',
  styleUrls: ['./number-input.scss'],
  templateUrl: './number-input.html'
})
export class GhsNumberInput {
  modelNumber = model<number>(0, { alias: 'model' });

  readonly steps = input<number[]>([1, 2]);

  readonly negative = input<boolean>(true);

  readonly min = input<number>(0);

  readonly max = input<number>(0);

  readonly relative = input<boolean>(false);

  readonly stepsNegative = computed(() => [...this.steps()].reverse());

  change(value: number) {
    this.modelNumber.set(this.modelNumber() + value);
  }
}
