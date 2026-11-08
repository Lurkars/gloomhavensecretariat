import { Directive, input, output } from '@angular/core';
import { PartySheetSection } from 'src/app/ui/figures/party/sheet/section';

@Directive()
export abstract class PartySheetLayout extends PartySheetSection {
  readonly disableShortcuts = input<boolean>(false);
  readonly openCampaign = output<void>();
}
