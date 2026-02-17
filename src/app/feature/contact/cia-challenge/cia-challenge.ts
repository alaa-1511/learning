import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cia-challenge',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cia-challenge.html',
})
export class CiaChallenge {}
