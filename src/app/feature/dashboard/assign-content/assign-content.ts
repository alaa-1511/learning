
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ExamService, Exam, ExamPart } from '../../../core/service/exam.service';
import { SupabaseService } from '../../../core/service/supabase.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-assign-content',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SelectModule],
  templateUrl: './assign-content.html',
  styleUrl: './assign-content.css'
})
export class AssignContentComponent implements OnInit {
    private examService = inject(ExamService);
    private supabaseService = inject(SupabaseService);
    private toastr = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);
    private translate = inject(TranslateService);

    students: any[] = [];
    courses: Exam[] = [];
    selectedStudents: any[] = [];
    selectedStudentToAdd: any = null;
    
    // Multi-selection support
    selectedCourses: Exam[] = [];
    partsByCourse: Record<number, ExamPart[]> = {}; 
    selectedParts: number[] = []; // IDs of selected parts
    
    constructor() {}

    ngOnInit(): void {
        this.loadStudents();
        this.loadCourses();
    }

    async loadStudents() {
        try {
            const { data, error } = await this.supabaseService.client
                .from('profiles')
                .select('*')
                .range(0, 1000); 
            
            if (error) {
                console.error('Error fetching profiles:', error);
                this.toastr.error(this.translate.instant('ASSIGN_CONTENT.MESSAGES.LOAD_ERROR'));
                return;
            }

            if (data && data.length > 0) {
                this.students = data.map((s: any) => {
                    // Resolve subscription status (internal logic preserved if needed later, but not shown)
                    const isSubscribed = s.is_subscribed === true || 
                                       s.isSubscribed === true || 
                                       s.raw_user_meta_data?.isSubscribed === true ||
                                       s.raw_user_meta_data?.is_subscribed === true;
                    
                    // Pre-calculate display name to avoid function calls in template
                    let name = 'Unknown';
                    if (s.firstName && s.lastName) {
                        name = `${s.firstName} ${s.lastName}`;
                    } else if (s.first_name && s.last_name) {
                        name = `${s.first_name} ${s.last_name}`;
                    } else if (s.full_name) {
                        name = s.full_name;
                    } else if (s.name) {
                        name = s.name;
                    } else if (s.raw_user_meta_data) {
                        const meta = s.raw_user_meta_data;
                        if (meta.firstName && meta.lastName) {
                            name = `${meta.firstName} ${meta.lastName}`;
                        } else if (meta.first_name && meta.last_name) {
                            name = `${meta.first_name} ${meta.last_name}`;
                        } else if (meta.full_name) {
                            name = meta.full_name;
                        } else if (meta.name) {
                            name = meta.name; 
                        }
                    }

                    // Format: "Name (Email)" - Removed checkmarks/crosses as requested
                    const displayName = `${name} (${s.email})`;

                    return { 
                        ...s, 
                        _is_subscribed_resolved: isSubscribed,
                        displayName: displayName 
                    };
                });
                
                if (this.students.length === 0) {
                    this.toastr.info(this.translate.instant('ASSIGN_CONTENT.MESSAGES.NO_STUDENTS'));
                }
            } else {
                 this.toastr.info(this.translate.instant('ASSIGN_CONTENT.MESSAGES.NO_PROFILES'));
            }
        } catch (e) {
            console.error('Unexpected error in loadStudents:', e);
            this.toastr.error(this.translate.instant('ASSIGN_CONTENT.MESSAGES.LOAD_ERROR'));
        }
    }

    loadCourses() {
        this.examService.exams$.subscribe(exams => {
            this.courses = exams;
        });
    }
    
    isCourseSelected(courseId: number): boolean {
        return this.selectedCourses.some(c => c.id === courseId);
    }

    async onCourseSelect(course: Exam) {
        if (!course.id) return;

        const index = this.selectedCourses.findIndex(c => c.id === course.id);
        
        if (index > -1) {
            // Deselect
            this.selectedCourses.splice(index, 1);
            delete this.partsByCourse[course.id];
        } else {
            // Select
            this.selectedCourses.push(course);
            this.loadPartsForCourse(course.id);
        }
    }
    
    async loadPartsForCourse(courseId: number) {
        try {
            const fetchedParts = await this.examService.getParts(courseId);
            this.partsByCourse[courseId] = fetchedParts;
            this.cdr.detectChanges(); 
        } catch (err) {
            console.error('Error fetching parts:', err);
            this.toastr.error(this.translate.instant('ASSIGN_CONTENT.MESSAGES.PARTS_ERROR'));
        }
    }

    togglePartSelection(partId: number) {
        const index = this.selectedParts.indexOf(partId);
        if (index > -1) {
            this.selectedParts.splice(index, 1);
        } else {
            this.selectedParts.push(partId);
        }
    }

    addStudent(student: any) {
        if (!student) return;
        // Check if already selected
        if (!this.selectedStudents.some(s => s.id === student.id)) {
            this.selectedStudents.push(student);
        }
    }

    removeStudent(student: any) {
        this.selectedStudents = this.selectedStudents.filter(s => s.id !== student.id);
    }

    async assignContent() {
        if (this.selectedStudents.length === 0 || this.selectedCourses.length === 0 || this.selectedParts.length === 0) {
            this.toastr.warning(this.translate.instant('ASSIGN_CONTENT.MESSAGES.SELECT_WARNING'));
            return;
        }

        const assignments: any[] = [];
        
        // Iterate over ALL selected students
        for (const student of this.selectedStudents) {
             // Iterate through loaded parts by course to build assignments
             for (const [courseIdStr, parts] of Object.entries(this.partsByCourse)) {
                 const courseId = Number(courseIdStr);
                 // Find parts that are selected
                 const partsToAssign = parts.filter(p => this.selectedParts.includes(p.id));
                 
                 for (const part of partsToAssign) {
                     assignments.push({
                         student_email: student.email,
                         course_id: courseId,
                         part_id: part.id,
                         assigned_at: new Date()
                     });
                 }
             }
        }
        
        if (assignments.length === 0) {
             this.toastr.error(this.translate.instant('ASSIGN_CONTENT.MESSAGES.NO_VALID_PARTS'));
             return;
        }

        const { error } = await this.supabaseService.client
            .from('student_assignments')
            .insert(assignments);

        if (error) {
            console.error('Assignment failed', error);
            if (error.code === '42P01') { 
                this.toastr.error(this.translate.instant('ASSIGN_CONTENT.MESSAGES.SYSTEM_ERROR'));
            } else {
                this.toastr.error(this.translate.instant('ASSIGN_CONTENT.MESSAGES.ASSIGN_ERROR'));
            }
        } else {
            this.toastr.success(this.translate.instant('ASSIGN_CONTENT.MESSAGES.SUCCESS', { count: assignments.length }));
            this.resetSelection();
        }
    }

    resetSelection() {
        this.selectedCourses = [];
        this.partsByCourse = {};
        this.selectedParts = [];
        this.selectedStudents = [];
    }
}
