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
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private initialCourses: Course[] = [
    {
      id: 1,
      title: 'COURSES.LIST.COURSE1_TITLE',
      category: 'COURSES.CATEGORIES.ACCOUNTING',
      level: 'COURSES.LEVELS.INTERMEDIATE',
      image: '/courses/img mealify1.jfif', 
      description: 'COURSES.LIST.COURSE1_DESC',
      rating: 4.9,
      students: 2300,
      price: 199,
      isFreeTrial: true
    },
    {
      id: 2,
      title: 'COURSES.LIST.COURSE2_TITLE',
      category: 'COURSES.CATEGORIES.ACCOUNTING',
      level: 'COURSES.LEVELS.ADVANCED',
      image: '/courses/img mealify2.jfif',
      description: 'COURSES.LIST.COURSE2_DESC',
      rating: 4.8,
      students: 1850,
      price: 249,
      isFreeTrial: true
    },
    {
      id: 3,
      title: 'COURSES.LIST.COURSE3_TITLE',
      category: 'COURSES.CATEGORIES.ACCOUNTING',
      level: 'COURSES.LEVELS.INTERMEDIATE',
      image: '/courses/img mealify3.jfif',
      description: 'COURSES.LIST.COURSE3_DESC',
      rating: 4.7,
      students: 1200,
      price: 149,
      isFreeTrial: false
    },
    {
      id: 4,
      title: 'COURSES.LIST.COURSE4_TITLE',
      category: 'COURSES.CATEGORIES.ACCOUNTING',
      level: 'COURSES.LEVELS.ADVANCED',
      image: '/courses/img mealify4.jfif',
      description: 'COURSES.LIST.COURSE4_DESC',
      rating: 4.9,
      students: 1540,
      price: 299,
      isFreeTrial: false
    },
    {
      id: 5,
      title: 'COURSES.LIST.COURSE5_TITLE',
      category: 'COURSES.CATEGORIES.TAXATION',
      level: 'COURSES.LEVELS.BEGINNER',
      image: '/courses/img mealify5.jfif',
      description: 'COURSES.LIST.COURSE5_DESC',
      rating: 4.6,
      students: 980,
      price: 129,
      isFreeTrial: true
    },
    {
      id: 6,
      title: 'COURSES.LIST.COURSE6_TITLE',
      category: 'COURSES.CATEGORIES.FINANCE',
      level: 'COURSES.LEVELS.ADVANCED',
      image: '/courses/img mealify1.jfif',
      description: 'COURSES.LIST.COURSE6_DESC',
      rating: 4.8,
      students: 3100,
      price: 179,
      isFreeTrial: true
    }
  ];

  private coursesSubject = new BehaviorSubject<Course[]>(this.initialCourses);
  courses$ = this.coursesSubject.asObservable();

  constructor() { }

  getCourses(): Observable<Course[]> {
    return this.courses$;
  }

  addCourse(course: Course) {
    const currentCourses = this.coursesSubject.value;
    // Generate new ID if not provided or 0
    if (!course.id) {
       course.id = Math.max(...currentCourses.map(c => c.id), 0) + 1;
    }
    this.coursesSubject.next([...currentCourses, course]);
  }

  updateCourse(updatedCourse: Course) {
    const currentCourses = this.coursesSubject.value;
    const index = currentCourses.findIndex(c => c.id === updatedCourse.id);
    if (index !== -1) {
      currentCourses[index] = updatedCourse;
      this.coursesSubject.next([...currentCourses]);
    }
  }

  deleteCourse(id: number) {
    const currentCourses = this.coursesSubject.value;
    this.coursesSubject.next(currentCourses.filter(c => c.id !== id));
  }
}
