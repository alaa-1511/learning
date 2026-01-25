import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cme',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cme.html',
  styleUrl: './cme.css',
})
export class CME {

}
