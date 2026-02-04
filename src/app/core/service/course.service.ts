import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SupabaseService } from './supabase.service';

export interface Course {
  id: number;
  title: string;
  category: string;
  level: string;
  image: string;
  description: string;
  details?: string;
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
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  courses$ = this.coursesSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private toastr: ToastrService
  ) {
    this.loadCourses();
    this.loadCourses2();
  }


  private async loadCourses() {
    const { data, error } = await this.supabaseService.client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading courses:', error);
      this.toastr.error('Failed to load courses');
      return;
    }

    // Map snake_case from DB to camelCase for App
    const mappedCourses: Course[] = data.map((c: any) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      level: c.level,
      image: c.image,
      description: c.description,
      details: c.details,
      rating: c.rating,
      students: c.students,
      price: c.price,
      isFreeTrial: c.is_free_trial,
      type: c.type
    }));

    this.coursesSubject.next(mappedCourses);
  }

  async addCourse(course: Course): Promise<number> {
    // Map camelCase to snake_case for DB
    const dbCourse = {
      title: course.title,
      category: course.category,
      level: course.level,
      image: course.image,
      description: course.description,
      details: course.details,
      rating: course.rating,
      students: course.students,
      price: course.price,
      is_free_trial: course.isFreeTrial,
      type: course.type
    };

    const { data, error } = await this.supabaseService.client
      .from('courses')
      .insert(dbCourse)
      .select()
      .single();

    if (error) {
      console.error('Error adding course:', error);
      this.toastr.error('Failed to add course');
      throw error;
    }

    const newCourse: Course = {
      id: data.id,
      title: data.title,
      category: data.category,
      level: data.level,
      image: data.image,
      description: data.description,
      details: data.details,
      rating: data.rating,
      students: data.students,
      price: data.price,
      isFreeTrial: data.is_free_trial,
      type: data.type
    };

    const currentCourses = this.coursesSubject.value;
    this.coursesSubject.next([newCourse, ...currentCourses]);
    
    this.toastr.success('Course added successfully');
    return newCourse.id;
  }

  async updateCourse(updatedCourse: Course) {
    const dbCourse = {
       title: updatedCourse.title,
       category: updatedCourse.category,
       level: updatedCourse.level,
       image: updatedCourse.image,
       description: updatedCourse.description,
       details: updatedCourse.details,
       rating: updatedCourse.rating,
       students: updatedCourse.students,
       price: updatedCourse.price,
       is_free_trial: updatedCourse.isFreeTrial,
       type: updatedCourse.type
    };

    const { error } = await this.supabaseService.client
      .from('courses')
      .update(dbCourse)
      .eq('id', updatedCourse.id);

    if (error) {
      console.error('Error updating course:', error);
      this.toastr.error('Failed to update course');
      throw error;
    }

    const currentCourses = this.coursesSubject.value;
    const index = currentCourses.findIndex(c => c.id === updatedCourse.id);
    if (index !== -1) {
      currentCourses[index] = updatedCourse;
      this.coursesSubject.next([...currentCourses]);
    }
    this.toastr.success('Course updated successfully');
  }

  async deleteCourse(id: number) {
    const { error } = await this.supabaseService.client
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
       console.error('Error deleting course:', error);
       this.toastr.error('Failed to delete course');
       throw error;
    }

    const currentCourses = this.coursesSubject.value;
    const updatedCourses = currentCourses.filter(c => c.id !== id);
    this.coursesSubject.next(updatedCourses);
    this.toastr.success('Course deleted successfully');
  }
  // Courses 2 Support
  private courses2Subject = new BehaviorSubject<Course[]>([]);
  courses2$ = this.courses2Subject.asObservable();


  // ... Existing loadCourses ...

  private async loadCourses2() {
    const { data, error } = await this.supabaseService.client
      .from('courses_2')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading courses 2:', error);
      this.toastr.error('Failed to load courses 2');
      return;
    }

    const mappedCourses: Course[] = data.map((c: any) => ({
      ...c,
      isFreeTrial: false // defaulting as not present in schema
    }));

    this.courses2Subject.next(mappedCourses);
  }

  async addCourse2(course: Course): Promise<number> {
    const dbCourse = {
      title: course.title,
      category: course.category,
      level: course.level,
      image: course.image,
      description: course.description,
      details: course.details,
      price: course.price
    };

    const { data, error } = await this.supabaseService.client
      .from('courses_2')
      .insert(dbCourse)
      .select()
      .single();

    if (error) {
      console.error('Error adding course 2:', error);
      this.toastr.error('Failed to add course 2');
      throw error;
    }

    const newCourse: Course = { ...data };
    const current = this.courses2Subject.value;
    this.courses2Subject.next([newCourse, ...current]);
    this.toastr.success('Course 2 added successfully');
    return newCourse.id;
  }

  async updateCourse2(course: Course) {
    const dbCourse = {
       title: course.title,
       category: course.category,
       level: course.level,
       image: course.image,
       description: course.description,
       details: course.details,
       price: course.price
    };

    const { error } = await this.supabaseService.client
      .from('courses_2')
      .update(dbCourse)
      .eq('id', course.id);

    if (error) {
      console.error('Error updating course 2:', error);
      this.toastr.error('Failed to update course 2');
      throw error;
    }

    const current = this.courses2Subject.value;
    const index = current.findIndex(c => c.id === course.id);
    if (index !== -1) {
      current[index] = course;
      this.courses2Subject.next([...current]);
    }
    this.toastr.success('Course 2 updated successfully');
  }

  async deleteCourse2(id: number) {
    const { error } = await this.supabaseService.client
      .from('courses_2')
      .delete()
      .eq('id', id);

    if (error) {
       console.error('Error deleting course 2:', error);
       this.toastr.error('Failed to delete course 2');
       throw error;
    }

    const current = this.courses2Subject.value;
    this.courses2Subject.next(current.filter(c => c.id !== id));
    this.toastr.success('Course 2 deleted successfully');
  }

  async getCourseById(id: number): Promise<Course | null> {
    const { data, error } = await this.supabaseService.client
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading course by id:', error);
      return null;
    }
    return { ...data, isFreeTrial: data.is_free_trial };
  }

  async getCourse2ById(id: number): Promise<Course | null> {
    const { data, error } = await this.supabaseService.client
      .from('courses_2')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading course 2 by id:', error);
      return null;
    }
    return { ...data, isFreeTrial: false };
  }

  getCourseByIdSync(id: number): Course | undefined {
    return this.coursesSubject.value.find(c => c.id === id);
  }

  getCourse2ByIdSync(id: number): Course | undefined {
      return this.courses2Subject.value.find(c => c.id === id);
  }
}

