import { Component, input, InputSignal, signal, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-input',
  imports: [ ReactiveFormsModule, TranslateModule ],
  templateUrl: './input.html',
  styleUrl: './input.css',
})
export class Input {
  controlInput: InputSignal<any> = input(null);
  idInput: InputSignal<string> = input('');
  typeInput: InputSignal<string> = input('text');
  labelInput: InputSignal<string> = input('');
  placeholderInput: InputSignal<string> = input('');

  passwordVisible = signal(false);

  inputType = computed(() => {
    if (this.typeInput() === 'password' && this.passwordVisible()) {
      return 'text';
    }
    return this.typeInput();
  });

  togglePasswordVisibility() {
    this.passwordVisible.update((visible) => !visible);
  }
}
