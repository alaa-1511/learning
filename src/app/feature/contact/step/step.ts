import { Component } from '@angular/core';
import { CertificateLayoutComponent } from '../shared/certificate-layout/certificate-layout.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-step',
  standalone: true,
  imports: [CertificateLayoutComponent, TranslateModule],
  templateUrl: './step.html',
  styleUrl: './step.css',
})
export class STEP {

}
