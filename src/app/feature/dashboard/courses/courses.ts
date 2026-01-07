import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule } from '@ngx-translate/core';
import { CourseService, Course } from '../../../core/service/course.service';

@Component({
  selector: 'app-dashboard-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule
  ],
  templateUrl: './courses.html',
  styleUrls: ['./courses.css']
})
export class CoursesManagement implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  
  // Modals
  courseDialog: boolean = false;
  deleteDialog: boolean = false;
  courseToDelete: Course | null = null;
  
  courseForm: FormGroup;
  submitted: boolean = false;
  isEditMode: boolean = false;
  currentCourseId: number | null = null;
  imagePreview: string |  ArrayBuffer | null = null;
  
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
      image: ['/courses/img mealify1.jfif', Validators.required]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
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
      this.courses = data;
      this.applyFilters();
    });
  }

  onSearch(event: any) {
    this.currentSearch = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredCourses = this.courses.filter(c => 
        !this.currentSearch || c.title.toLowerCase().includes(this.currentSearch)
    );
    this.p = 1; 
  }

  openNew() {
    this.courseForm.reset({
      title: '',
      price: 0,
      category: 'COURSES.CATEGORIES.ACCOUNTING',
      level: 'COURSES.LEVELS.BEGINNER',
      description: '',
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

  confirmDelete() {
    if (this.courseToDelete) {
        this.courseService.deleteCourse(this.courseToDelete.id);
        this.courseToDelete = null;
        this.deleteDialog = false;
    }
  }

  saveCourse() {
    this.submitted = true;
    if (this.courseForm.invalid) return;

    const formVal = this.courseForm.value;
    const courseData: Course = {
        id: this.isEditMode ? (this.currentCourseId as number) : 0,
        ...formVal,
        rating: 4.5, // Default for new
        students: 0, // Default for new
        isFreeTrial: false 
    };

    if (this.isEditMode) {
        this.courseService.updateCourse(courseData);
    } else {
        this.courseService.addCourse(courseData);
    }
    this.courseDialog = false;
  }

  hideDialog() {
    this.courseDialog = false;
  }
}
