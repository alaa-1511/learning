import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

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
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  courses$ = this.coursesSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.loadCourses();
  }

  private async loadCourses() {
    const { data, error } = await this.supabaseService.client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading courses:', error);
      return;
    }

    // Map snake_case from DB to camelCase for App
    const mappedCourses: Course[] = data.map((c: any) => ({
      ...c,
      isFreeTrial: c.is_free_trial
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
      throw error;
    }

    const newCourse: Course = {
      ...data,
      isFreeTrial: data.is_free_trial
    };

    const currentCourses = this.coursesSubject.value;
    this.coursesSubject.next([newCourse, ...currentCourses]);
    
    return newCourse.id;
  }

  async updateCourse(updatedCourse: Course) {
    const dbCourse = {
       title: updatedCourse.title,
       category: updatedCourse.category,
       level: updatedCourse.level,
       image: updatedCourse.image,
       description: updatedCourse.description,
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
      return;
    }

    const currentCourses = this.coursesSubject.value;
    const index = currentCourses.findIndex(c => c.id === updatedCourse.id);
    if (index !== -1) {
      currentCourses[index] = updatedCourse;
      this.coursesSubject.next([...currentCourses]);
    }
  }

  async deleteCourse(id: number) {
    const { error } = await this.supabaseService.client
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
       console.error('Error deleting course:', error);
       return;
    }

    const currentCourses = this.coursesSubject.value;
    const updatedCourses = currentCourses.filter(c => c.id !== id);
    this.coursesSubject.next(updatedCourses);
  }
}
