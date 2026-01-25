import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cert-ifr',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cert-ifr.html',
  styleUrl: './cert-ifr.css',
})
export class CertIFR {

}
