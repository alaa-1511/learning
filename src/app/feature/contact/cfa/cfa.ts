import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cfa',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cfa.html',
  styleUrl: './cfa.css',
})
export class CFA {

}
