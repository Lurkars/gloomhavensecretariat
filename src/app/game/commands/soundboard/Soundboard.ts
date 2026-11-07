import { soundboardManager } from 'src/app/game/businesslogic/SoundboardManager';
import { CommandImpl } from 'src/app/game/commands/Command';

export class SoundboardCommand extends CommandImpl {
  id: string = 'soundboard.play';
  requiredParameters: number = 1;
  override stateless: boolean = true;

  validParameters(index: number): boolean {
    return typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < soundboardManager.sounds.length;
  }

  executeWithParameters(index: number) {
    soundboardManager.play(index);
  }
}
