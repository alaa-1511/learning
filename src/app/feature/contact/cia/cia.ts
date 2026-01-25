import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cia',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './cia.html',
  styleUrl: './cia.css',
})
export class CIA {

}
