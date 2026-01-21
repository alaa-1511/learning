import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule } from '@ngx-translate/core';
import { EditorModule } from 'primeng/editor';
import { CourseService, Course } from '../../../core/service/course.service';

@Component({
  selector: 'app-dashboard-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule,
    EditorModule
  ],
  templateUrl: './courses.html',
  styleUrls: ['./courses.css']
})
export class CoursesManagement implements OnInit {
  courses: Course[] = [];
  courses2: Course[] = []; // New list
  filteredCourses: Course[] = [];
  activeTab: 'courses' | 'courses_2' = 'courses'; // Tab State
  
  // Modals
  courseDialog: boolean = false;
  deleteDialog: boolean = false;
  courseToDelete: Course | null = null;
  
  courseForm: FormGroup;
  submitted: boolean = false;
  isEditMode: boolean = false;
  currentCourseId: number | null = null;
  imagePreview: string |  ArrayBuffer | null = null;
  isLoading: boolean = false;
  
  // Pagination
  p: number = 1;
  currentSearch: string = '';

  constructor(
    private courseService: CourseService,
    private fb: FormBuilder
  ) {
    this.courseForm = this.fb.group({
      title: ['', Validators.required],
      price: [0, Validators.required],
      category: ['COURSES.CATEGORIES.ACCOUNTING', Validators.required],
      level: ['COURSES.LEVELS.BEGINNER', Validators.required],
      description: ['', Validators.required],
      details: [''], // Rich text details
      image: ['/courses/img mealify1.jfif', Validators.required]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 500KB for Base64 performance)
      if (file.size > 500 * 1024) {
        alert('Image is too large! Please choose an image under 500KB to ensure fast saving.');
        event.target.value = ''; // Clear input
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
        this.courseForm.patchValue({ image: this.imagePreview });
      };
      reader.readAsDataURL(file);
    }
  }

  ngOnInit() {
    this.courseService.courses$.subscribe(data => {
      this.courses = data.filter(c => c.type !== 'exam');
      if (this.activeTab === 'courses') this.applyFilters();
    });

    this.courseService.courses2$.subscribe(data => {
        this.courses2 = data;
        if (this.activeTab === 'courses_2') this.applyFilters();
    });
  }

  onSearch(event: any) {
    this.currentSearch = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    const list = this.activeTab === 'courses' ? this.courses : this.courses2;
    this.filteredCourses = list.filter(c => 
        !this.currentSearch || c.title.toLowerCase().includes(this.currentSearch)
    );
    this.p = 1; 
  }

  setTab(tab: 'courses' | 'courses_2') {
    this.activeTab = tab;
    this.applyFilters();
  }

  openNew() {
    this.courseForm.reset({
      title: '',
      price: 0,
      category: 'COURSES.CATEGORIES.ACCOUNTING',
      level: 'COURSES.LEVELS.BEGINNER',
      description: '',
      details: '',
      image: 'assets/images/default-course.jpg' // Default image if needed, or empty
    });
    this.imagePreview = null;
    this.submitted = false;
    this.isEditMode = false;
    this.courseDialog = true;
  }

  editCourse(course: Course) {
    this.courseForm.patchValue({
        title: course.title,
        price: course.price,
        category: course.category,
        level: course.level,
        description: course.description,
        details: course.details || '', // Handle potential undefined
        image: course.image
    });
    this.imagePreview = course.image;
    this.currentCourseId = course.id;
    this.isEditMode = true;
    this.courseDialog = true;
  }

  deleteCourse(course: Course) {
    this.courseToDelete = course;
    this.deleteDialog = true;
  }

  async confirmDelete() {
    if (this.courseToDelete) {
        
        // OPTIMISTIC UI: Close the dialog IMMEDIATELY
        this.deleteDialog = false;

        this.isLoading = true;
        try {
            // Timeout protection
            const timeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Delete request timed out')), 15000)
            );

            const deleteOperation = (async () => {
                if (this.activeTab === 'courses') {
                    await this.courseService.deleteCourse(this.courseToDelete!.id);
                } else {
                    await this.courseService.deleteCourse2(this.courseToDelete!.id);
                }
            })();

            await Promise.race([deleteOperation, timeout]);

            this.courseToDelete = null;

        } catch (error) {
            console.error('Error deleting course:', error);
            // Only alert on error, not success
            alert('Failed to delete course (check network).');
        } finally {
            this.isLoading = false;
        }
    }
  }

  async saveCourse() {
    this.submitted = true;
    if (this.courseForm.invalid) {
        alert('Please fill in all required fields marked with *');
        return;
    }

    // Protection: Check if "Details" (Rich Text) is too large (e.g. pasted images)
    const detailsContent = this.courseForm.get('details')?.value || '';
    if (detailsContent.length > 300000) { // ~300KB limit for text
        alert('The "Details" content is too large! DO NOT paste images directly into the text editor. Use the Image URL field instead.');
        return;
    }

    const formVal = this.courseForm.value;
    const courseData: Course = {
        id: this.isEditMode ? (this.currentCourseId as number) : 0,
        ...formVal,
        rating: 4.5,
        students: 0,
        isFreeTrial: false,
        type: 'standard' 
    };

    // OPTIMISTIC UI: Close the dialog IMMEDIATELY
    this.courseDialog = false;

    // Start background process (don't await in UI thread blocking way)
    this.isLoading = true;
    
    try {
        // Create a timeout promise to prevent hanging
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out (Network is slow or file is too big)')), 15000)
        );

        const saveOperation = (async () => {
            if (this.activeTab === 'courses') {
                if (this.isEditMode) {
                    await this.courseService.updateCourse(courseData);
                } else {
                    await this.courseService.addCourse(courseData);
                }
            } else {
                 if (this.isEditMode) {
                    await this.courseService.updateCourse2(courseData);
                } else {
                    await this.courseService.addCourse2(courseData);
                }
            }
        })();

        // Race between save and timeout
        await Promise.race([saveOperation, timeout]);
        
        // Success: Do nothing (Modal is already closed)

    } catch (error: any) {
        console.error('Error saving course:', error);
        
        // Error: Show alert since we optimistically closed the modal
        const msg = error.message || error.error_description || error.details || JSON.stringify(error);
        alert('Failed to save course (check network): ' + msg);
        
        // Re-open modal so they can fix/retry?
        // this.courseDialog = true; // Optional: Decide if we want to re-open
    } finally {
        this.isLoading = false;
    }
  }

  hideDialog() {
    this.courseDialog = false;
  }
}
