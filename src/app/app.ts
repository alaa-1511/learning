import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Translate } from './core/service/translate';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly translate = inject(Translate);
  protected readonly title = signal('E-learning');
}
