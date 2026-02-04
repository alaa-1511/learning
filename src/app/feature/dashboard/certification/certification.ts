import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CertificationService, Certificate } from '../../../core/service/certification.service';
import { CourseService, Course } from '../../../core/service/course.service';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Button } from "primeng/button";

@Component({
  selector: 'app-certification',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, DialogModule],
  templateUrl: './certification.html',
  styleUrl: './certification.css',
})
export class Certification implements OnInit {
  stats = {
    totalIssued: 0,
    activeTemplates: 0,
    pendingApproval: 0
  };

  certificates: Certificate[] = [];
  courses: Course[] = [];
  
  // Modal State
  issueDialog: boolean = false;
  editingId: string | null = null;
  issueForm: FormGroup;

  constructor(
    private certService: CertificationService,
    private courseService: CourseService,
    private fb: FormBuilder
  ) {
      this.issueForm = this.fb.group({
          studentName: ['', Validators.required],
          courseId: [null, Validators.required],
          issueDate: [new Date().toISOString().split('T')[0], Validators.required]
      });
  }

  ngOnInit() {
      this.certService.certificates$.subscribe(certs => {
          this.certificates = certs;
          this.calculateStats();
      });

      this.courseService.courses$.subscribe(courses => {
          this.courses = courses; // Can optionally filter for specific types if needed
      });
  }

  calculateStats() {
      this.stats.totalIssued = this.certificates.length;
      this.stats.activeTemplates = this.courses.length; // Approximate, or track templates separately
      this.stats.pendingApproval = this.certificates.filter(c => c.status === 'Pending').length;
  }

  openIssueDialog() {
      this.issueDialog = true;
      this.editingId = null;
      this.issueForm.reset({
          issueDate: new Date().toISOString().split('T')[0]
      });
  }

  openEditDialog(cert: Certificate) {
      this.issueDialog = true;
      this.editingId = cert.id;
      this.issueForm.patchValue({
          studentName: cert.studentName,
          courseId: cert.courseId,
          issueDate: new Date(cert.issueDate).toISOString().split('T')[0]
      });
  }

  async saveCertificate() {
      if (this.issueForm.valid) {
          const val = this.issueForm.value;
          const selectedCourse = this.courses.find(c => c.id == val.courseId);
          
          if (this.editingId) {
              // Update
              const existing = this.certificates.find(c => c.id === this.editingId);
              if (existing) {
                  await this.certService.updateCertificate({
                      ...existing,
                      studentName: val.studentName,
                      courseId: Number(val.courseId),
                      courseName: selectedCourse ? selectedCourse.title : 'Unknown Course',
                      issueDate: new Date(val.issueDate)
                  });
              }
          } else {
              // Create
              await this.certService.issueCertificate({
                  studentName: val.studentName,
                  courseId: Number(val.courseId),
                  courseName: selectedCourse ? selectedCourse.title : 'Unknown Course',
                  issueDate: new Date(val.issueDate),
                  expiryDate: undefined 
              });
          }

          this.issueDialog = false;
      }
  }

  // Delete Dialog State
  deleteDialogVisible: boolean = false;
  deleteId: string | null = null;

  deleteDialog(id: string) {
      this.deleteDialogVisible = true;
      this.deleteId = id;
  }

  confirmDelete() {
      if (this.deleteId) {
          this.certService.deleteCertificate(this.deleteId);
          this.deleteDialogVisible = false;
          this.deleteId = null;
      }
  }

  // Helper for UI (Colors/Icons based on course ID or random)
  getCertColor(id: number): string {
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500'];
      return colors[id % colors.length] || 'bg-blue-500';
  }

  getCertIcon(id: number): string {
      const icons = ['pi-verified', 'pi-file', 'pi-star', 'pi-shield', 'pi-bookmark'];
      return icons[id % icons.length] || 'pi-file';
  }

  
}
