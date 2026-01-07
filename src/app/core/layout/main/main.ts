import { Component } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-main',
  imports: [ Navbar ,RouterOutlet ,Footer],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {

}
