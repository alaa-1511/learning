import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cert-ia',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cert-ia.html',
  styleUrl: './cert-ia.css',
})
export class CertIA {

}
