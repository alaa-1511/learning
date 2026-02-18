import { Component, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CertificationService, Certificate } from '../../../core/service/certification.service';
import { CourseService, Course } from '../../../core/service/course.service';
import { ExamService, Exam } from '../../../core/service/exam.service';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Button } from "primeng/button";
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-certification',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, DialogModule],
  templateUrl: './certification.html',
  styleUrl: './certification.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Certification implements OnInit, OnDestroy {
  stats = {
    totalIssued: 0,
    activeTemplates: 0,
    pendingApproval: 0
  };

  certificates: Certificate[] = [];
  courses: any[] = []; // Combined list of Courses and Exams
  rawCourses: Course[] = []; // Keep track of standard courses
  rawExams: Exam[] = []; // Keep track of exams
  
  // Modal State
  issueDialog: boolean = false;
  editingId: string | null = null;
  issueForm: FormGroup;
  
  private destroy$ = new Subject<void>();

  constructor(
    private certService: CertificationService,
    private courseService: CourseService,
    private examService: ExamService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {
      this.issueForm = this.fb.group({
          studentName: ['', Validators.required],
          courseId: [null, Validators.required],
          issueDate: [new Date().toISOString().split('T')[0], Validators.required]
      });
  }

  ngOnInit() {
      combineLatest([
        this.certService.certificates$,
        this.courseService.courses$,
        this.examService.exams$
      ]).pipe(
        takeUntil(this.destroy$)
      ).subscribe(([certs, courses, exams]) => {
          this.certificates = certs;
          this.rawCourses = courses;
          this.rawExams = exams;
          
          this.calculateStats();
          this.combineResources();
          this.cd.markForCheck();
      });
  }

  ngOnDestroy() {
      this.destroy$.next();
      this.destroy$.complete();
  }

  combineResources() {
      // Create unified list for dropdown
      // We use a composite value 'type-id' to handle ID collisions between Courses and Exams
      const courseOptions = this.rawCourses.map(c => ({ 
          id: c.id, 
          title: c.title, 
          type: 'Course',
          value: `course-${c.id}`
      }));
      
      const examOptions = this.rawExams.map(e => ({ 
          id: e.id, 
          title: e.title , 
          type: 'Exam',
          value: `exam-${e.id}`
      }));

      // Merge
      this.courses = [...courseOptions, ...examOptions];
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
          issueDate: new Date().toISOString().split('T')[0],
          courseId: null // Reset to null or appropriate default
      });
  }

  openEditDialog(cert: Certificate) {
      this.issueDialog = true;
      this.editingId = cert.id;
      
      // We need to try to reconstruct the selection. 
      // Since we only stored numeric ID, we might not know if it was a Course or Exam.
      // We can try to guess by name, or if ambiguous, default to Course?
      // For now, let's try to find a matching ID. If collision, we might default to Course.
      // A better way would be if `certificates` stored type, but it doesn't seem to.
      // We will search for a course with this ID first, then exam.
      
      let matchedValue = null;
      
      // Try finding by ID and maybe Name?
      // Since we don't have type in Certificate, we just rely on ID.
      // Ideally we should match name too?
      const matchByName = this.courses.find(c => c.id === cert.courseId && (c.title === cert.courseName || c.title + ' (Test Bank)' === cert.courseName));
       if (matchByName) {
          matchedValue = matchByName.value;
      } else {
          // Fallback to ID match (Course preference)
           const match = this.courses.find(c => c.id === cert.courseId);
           if (match) matchedValue = match.value;
      }

      this.issueForm.patchValue({
          studentName: cert.studentName,
          courseId: matchedValue,
          issueDate: new Date(cert.issueDate).toISOString().split('T')[0]
      });
  }

  async saveCertificate() {
      if (this.issueForm.valid) {
          try {
              const val = this.issueForm.value;
              // Close dialog immediately for better UX
              this.issueDialog = false;

              // Find by the unique value
              const selectedOption = this.courses.find(c => c.value === val.courseId);
              
              const numericId = selectedOption ? selectedOption.id : 0;
              const name = selectedOption ? selectedOption.title : 'Unknown Course';
              const type = selectedOption ? selectedOption.type : 'Course'; // 'Course' or 'Exam'
              
              const certPayload: any = {
                  studentName: val.studentName,
                  courseName: name,
                  issueDate: new Date(val.issueDate),
                  expiryDate: undefined,
                  courseId: type === 'Course' ? numericId : undefined,
                  examId: type === 'Exam' ? numericId : undefined
              };

              if (this.editingId) {
                  // Update
                  const existing = this.certificates.find(c => c.id === this.editingId);
                  if (existing) {
                      await this.certService.updateCertificate({
                          ...existing,
                          ...certPayload
                      });
                  }
              } else {
                  // Create
                  await this.certService.issueCertificate(certPayload);
              }
          } catch (error) {
              // If error, maybe reopen? For now, we rely on Toastr in service
          }
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
  getCertColor(id: number | undefined): string {
      const safeId = id || 0;
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500'];
      return colors[safeId % colors.length] || 'bg-blue-500';
  }

  getCertIcon(id: number | undefined): string {
      const safeId = id || 0;
      const icons = ['pi-verified', 'pi-file', 'pi-star', 'pi-shield', 'pi-bookmark'];
      return icons[safeId % icons.length] || 'pi-file';
  }

  
}
