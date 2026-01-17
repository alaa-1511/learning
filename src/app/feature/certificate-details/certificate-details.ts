import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-certificate-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './certificate-details.html',
  styleUrl: './certificate-details.css'
})
export class CertificateDetails implements OnInit {
  private route = inject(ActivatedRoute);
  
  certificateId = signal<string>('');
  certificateTitle = signal<string>('');
  certificateDescription = signal<string>('');

  private readonly certificationData: Record<string, { title: string, description: string }> = {
    'cpa': {
      title: 'Certified Public Accountant (CPA)',
      description: 'The CPA designation is the gold standard in accounting. It proves your expertise in forensic accounting, tax, compliance, and risk management.'
    },
    'cma': {
      title: 'Certified Management Accountant (CMA)',
      description: 'The CMA certification signifies expertise in financial planning, analysis, control, decision support, and professional ethics.'
    },
    'cia': {
      title: 'Certified Internal Auditor (CIA)',
      description: 'The CIA is the only globally recognized certification for internal auditors, demonstrating competence in internal auditing and risk management.'
    },
    'cfa': {
      title: 'Chartered Financial Analyst (CFA)',
      description: 'The CFA charter is a professional designation given by the CFA Institute that measures the competence and integrity of financial analysts.'
    },
    'socpa': {
      title: 'SOCPA Fellowship',
      description: 'The SOCPA fellowship is a prestigious certification in Saudi Arabia for accounting and auditing professionals.'
    },
    'cat': {
      title: 'Certified Accounting Technician (CAT)',
      description: 'The CAT qualification is designed to equip you with all the necessary technical skills and knowledge required to fulfill an accounting support role.'
    },
    'dipifrs': {
      title: 'Diploma in International Financial Reporting (DipIFR)',
      description: 'DipIFR provides qualified accountants or graduates with a working knowledge of IFRS.'
    },
    'certifr': {
      title: 'Certificate in International Financial Reporting (CertIFR)',
      description: 'CertIFR offers a broad introduction to International Financial Reporting Standards.'
    },
    'certia': {
      title: 'Certificate in International Auditing (CertIA)',
      description: 'CertIA covers the principles of International Standards on Auditing.'
    },
    'step': {
      title: 'Society of Trust and Estate Practitioners (STEP)',
      description: 'STEP involves advising families across generations on inheritance and succession planning.'
    },
    'cme': {
      title: 'Capital Market Examination (CME)',
      description: 'CME 1, 2, & 3 cover the regulations and technical skills required for capital market professionals.'
    }
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && this.certificationData[id]) {
        this.certificateId.set(id);
        this.certificateTitle.set(this.certificationData[id].title);
        this.certificateDescription.set(this.certificationData[id].description);
      } else if (id) {
          // Fallback
        this.certificateId.set(id);
        this.certificateTitle.set(id.toUpperCase());
        this.certificateDescription.set('Description for ' + id.toUpperCase() + ' coming soon.');
      }
    });
  }
}
