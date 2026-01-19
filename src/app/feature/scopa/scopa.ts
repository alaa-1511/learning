import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { CertificationsComponent } from "../certifications/certifications";

@Component({
  selector: 'app-scopa',
  imports: [CommonModule, RouterLink, CertificationsComponent],
  templateUrl: './scopa.html',
  styleUrl: './scopa.css',
})
export class Scopa {

}
