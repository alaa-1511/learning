import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-socpa',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './socpa.html',
  styleUrl: './socpa.css',
})
export class SOCPACE {

}
