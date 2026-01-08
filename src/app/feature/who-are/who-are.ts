import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-who-are',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './who-are.html',
  styleUrl: './who-are.css',
})
export class WhoAre {

}
