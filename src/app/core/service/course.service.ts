import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Course {
  id: number;
  title: string;
  category: string;
  level: string;
  image: string;
  description: string;
  rating: number;
  students: number;
  price: number;
  isFreeTrial?: boolean;
  type?: 'standard' | 'exam';
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly STORAGE_KEY = 'courses';
  // Initial courses removed per user request
  private initialCourses: Course[] = [];

  private coursesSubject = new BehaviorSubject<Course[]>([]);
  courses$ = this.coursesSubject.asObservable();

  constructor() {
    this.loadCourses();
  }

  private loadCourses() {
    const savedCourses = localStorage.getItem(this.STORAGE_KEY);
    if (savedCourses) {
      this.coursesSubject.next(JSON.parse(savedCourses));
    } else {
      this.coursesSubject.next(this.initialCourses);
      this.saveCourses(this.initialCourses);
    }
  }

  private saveCourses(courses: Course[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(courses));
    this.coursesSubject.next(courses);
  }

  getCourses(): Observable<Course[]> {
    return this.courses$;
  }

  addCourse(course: Course) {
    const currentCourses = this.coursesSubject.value;
    // Generate new ID if not provided or 0
    if (!course.id) {
       course.id = Math.max(...currentCourses.map(c => c.id), 0) + 1;
    }
    const updatedCourses = [...currentCourses, course];
    this.saveCourses(updatedCourses);
  }

  updateCourse(updatedCourse: Course) {
    const currentCourses = this.coursesSubject.value;
    const index = currentCourses.findIndex(c => c.id === updatedCourse.id);
    if (index !== -1) {
      currentCourses[index] = updatedCourse;
      this.saveCourses([...currentCourses]);
    }
  }

  deleteCourse(id: number) {
    const currentCourses = this.coursesSubject.value;
    const updatedCourses = currentCourses.filter(c => c.id !== id);
    this.saveCourses(updatedCourses);
  }
}
