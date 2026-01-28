import { Component, OnInit, ViewChild, ElementRef, NgZone, ChangeDetectorRef } from '@angular/core';
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
  @ViewChild('searchInput') searchInput!: ElementRef;

  verificationVisible: boolean = false;
  verificationId: string = '';

  searchId: string = '';
  certificate: Certificate | null = null;
  availableCourses: Course[] = []; // List for public display
  error: string | null = null;
  loading: boolean = false;

  // Alert Modal State
  alertDialogVisible: boolean = false;
  alertMessage: string = '';
  alertHeader: string = 'Notification';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certService: CertificationService,
    private courseService: CourseService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  showAlert(message: string, header: string = 'Notification') {
      this.alertMessage = message;
      this.alertHeader = header;
      this.alertDialogVisible = true;
  }

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

  async verifyCertificate(id: string | null = null) {
      // Prioritize explicit ID, then ViewChild value, then ngModel
      let searchKey = id;
      if (searchKey === null && this.searchInput && this.searchInput.nativeElement) {
          searchKey = this.searchInput.nativeElement.value;
      }
      if (searchKey === null) {
          searchKey = this.searchId;
      }
      
      if (!searchKey?.trim()) return;
      
      this.ngZone.run(() => {
          this.searchId = searchKey!;
          this.loading = true;
          this.error = null;
          this.certificate = null;
      });

      try {
          const cert = await this.certService.getCertificateById(searchKey.trim());

          this.ngZone.run(() => {
              if (cert) {
                  this.certificate = cert;
                  // Auto-scroll to certificate after a brief moment for rendering
                  setTimeout(() => {
                      const element = document.getElementById('certificate-paper');
                      if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                  }, 100);
              } else {
                  this.error = 'Certificate not found. Please check the ID and try again.';
              }
              this.loading = false;
              this.cd.detectChanges(); // Force UI update
          });
      } catch (err) {
          console.error(err);
          this.ngZone.run(() => {
              this.error = 'An error occurred while verifying the certificate.';
              this.loading = false;
              this.cd.detectChanges(); // Force UI update
          });
      }
  }

  printCertificate() {
      window.print();
  }

  downloadCertificate() {
    this.loading = true; // Use loading state to show feedback during generation
    const data = document.getElementById('certificate-paper');
    
    if (data) {
        
        toPng(data, { 
            cacheBust: true,
            pixelRatio: 2 // Higher resolution
        })
        .then((dataUrl: string) => {
            
            // A4 Landscape dimensions in mm
            const pdfWidth = 297; 
            const pdfHeight = 210;
            
            const pdf = new jsPDF('l', 'mm', 'a4');
            
            // Add image filling the PDF completely
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Certificate_${this.certificate?.studentName.replace(/\s+/g, '_')}_${this.certificate?.id}.pdf`);
            
            this.loading = false;
        })
        .catch((err: unknown) => {
            console.error('Error generating image:', err);
            this.showAlert('Error generating certificate: ' + err, 'Error');
            this.loading = false;
        });
    } else {
        console.error('Certificate container not found');
        this.showAlert('Error: Certificate element not found', 'Error');
        this.loading = false;
    }
  }
}
