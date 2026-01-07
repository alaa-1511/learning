import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-who-are',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './who-are.html',
  styleUrl: './who-are.css',
})
export class WhoAre {

}
