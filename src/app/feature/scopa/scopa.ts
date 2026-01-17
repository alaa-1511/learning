import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-scopa',
  imports: [CommonModule, RouterLink],
  templateUrl: './scopa.html',
  styleUrl: './scopa.css',
})
export class Scopa {
  certifications = [
    { id: 'cpa', name: 'CPA', image: 'assets/images/cpa.png' },
    { id: 'cma', name: 'CMA', image: 'assets/images/cma.png' },
    { id: 'cia', name: 'CIA', image: 'assets/images/cia.png' },
    { id: 'cfa', name: 'CFA', image: 'assets/images/cfa.png' },
    { id: 'socpa', name: 'SOCPA', image: 'assets/images/socpa.png' },
    { id: 'cat', name: 'CAT', image: 'assets/images/cat.png' },
    { id: 'dipifrs', name: 'DipIFR', image: 'assets/images/dipifrs.png' },
    { id: 'certifr', name: 'CertIFR', image: 'assets/images/certifr.png' },
    { id: 'certia', name: 'CertIA', image: 'assets/images/certia.png' },
    { id: 'step', name: 'STEP', image: 'assets/images/step.png' },
    { id: 'cme', name: 'CME', image: 'assets/images/cme.png' }
  ];
}
