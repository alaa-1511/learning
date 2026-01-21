import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CertificationService, Certificate } from '../../core/service/certification.service';
import { CourseService, Course } from '../../core/service/course.service';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';


@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslateModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    
],
  templateUrl: './certifications.html'
})
export class CertificationsComponent implements OnInit {
  verificationVisible: boolean = false;
  verificationId: string = '';

  searchId: string = '';
  certificate: Certificate | null = null;
  availableCourses: Course[] = []; // List for public display
  error: string | null = null;
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certService: CertificationService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    // Load all courses for display
    this.courseService.courses$.subscribe(courses => {
        this.availableCourses = courses;
    });

    // Check if ID is in URL query params
    this.route.queryParams.subscribe(params => {
        if (params['id']) {
            this.searchId = params['id'];
            this.verifyCertificate();
        }
    });
  }

  openVerificationDialog() {
      this.verificationVisible = true;
      this.verificationId = '';
  }

  checkVerificationId() {
      if (!this.verificationId.trim()) return;
      
      this.searchId = this.verificationId;
      this.verifyCertificate();
      this.verificationVisible = false;
  }

  async verifyCertificate() {
      if (!this.searchId.trim()) return;
      
      this.loading = true;
      this.error = null;
      this.certificate = null;

      // Simulate network delay for effect
      // setTimeout(async () => {
          const cert = await this.certService.getCertificateById(this.searchId.trim());
          if (cert) {
              this.certificate = cert;
          } else {
              this.error = 'Certificate not found. Please check the ID and try again.';
          }
          this.loading = false;
      // }, 500);
  }

  printCertificate() {
      window.print();
  }

  downloadCertificate() {
    console.log('Download started (html-to-image)');
    const data = document.getElementById('certificate-container');
    if (data) {
        console.log('Element found', data);
        
        toPng(data, { cacheBust: true })
        .then((dataUrl: string) => {
            console.log('PNG generated');
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            
            // Calculate height to maintain aspect ratio, but max out at A4 height
            // We use an actual Image object to get dimensions of the generated PNG
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                 const imgHeight = img.height * imgWidth / img.width;
                 const pdf = new jsPDF('p', 'mm', 'a4');
                 pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
                 pdf.save(`certificate-${this.certificate?.id || 'download'}.pdf`);
                 console.log('PDF saved');
            };
        })
        .catch((err: unknown) => {
            console.error('Error generating image:', err);
            alert('Error generating certificate: ' + err);
        });
    } else {
        console.error('Certificate container not found');
        alert('Error: Certificate element not found');
    }
  }
}
