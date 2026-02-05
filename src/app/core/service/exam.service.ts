import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export interface Exam {
  id: number;
  title: string;
  description?: string;
  image?: string;
  level?: string;
  created_at?: string;
  // View/Computed Properties
  partCount?: number;
  questions?: any[];
  config?: any;
  category?: string;
  part?: string;
}

export interface ExamPart {
  id: number;
  examId: number;
  title: string;
  description?: string;
  image?: string;
  questionCount?: number;
  durationLabel?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private examsSubject = new BehaviorSubject<Exam[]>([]);
  public exams$ = this.examsSubject.asObservable();

  constructor(
    private supabaseService: SupabaseService,
    private toastr: ToastrService
  ) {
    this.loadExams();
  }

  private async loadExams() {
    const { data, error } = await this.supabaseService.client
      .from('exams')
      .select('*, exam_parts(count)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading exams:', error);
      this.toastr.error('Failed to load exams');
      return;
    }

    const mappedExams: Exam[] = data.map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      image: e.image,
      level: e.level,
      created_at: e.created_at,
      partCount: e.exam_parts ? e.exam_parts[0]?.count : 0
    }));

    this.examsSubject.next(mappedExams);
  }

  // --- Exam CRUD ---

  async addExam(exam: Omit<Exam, 'id'>): Promise<number> {
    const dbExam = {
      title: exam.title,
      description: exam.description,
      image: exam.image,
      level: exam.level
    };

    const { data, error } = await this.supabaseService.client
      .from('exams')
      .insert(dbExam)
      .select()
      .single();

    if (error) {
      console.error('Error adding exam:', error);
      this.toastr.error('Failed to add exam');
      throw error;
    }

    const newExam: Exam = {
      id: data.id,
      title: data.title,
      description: data.description,
      image: data.image,
      level: data.level,
      created_at: data.created_at
    };

    const currentExams = this.examsSubject.value;
    this.examsSubject.next([newExam, ...currentExams]);
    this.toastr.success('Exam added successfully');
    return newExam.id;
  }

  async updateExam(exam: Exam): Promise<void> {
    const dbExam = {
      title: exam.title,
      description: exam.description,
      image: exam.image,
      level: exam.level
    };

    const { error } = await this.supabaseService.client
      .from('exams')
      .update(dbExam)
      .eq('id', exam.id);

    if (error) {
      console.error('Error updating exam:', error);
      this.toastr.error('Failed to update exam');
      throw error;
    }

    const currentExams = this.examsSubject.value;
    const index = currentExams.findIndex(e => e.id === exam.id);
    if (index !== -1) {
      currentExams[index] = exam;
      this.examsSubject.next([...currentExams]);
    }
    this.toastr.success('Exam updated successfully');
  }

  async deleteExam(id: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting exam:', error);
      this.toastr.error('Failed to delete exam');
      throw error;
    }

    const currentExams = this.examsSubject.value;
    this.examsSubject.next(currentExams.filter(e => e.id !== id));
    this.toastr.success('Exam deleted successfully');
  }

  async getExamById(id: number): Promise<Exam | null> {
      // Check local first
      const local = this.examsSubject.value.find(e => e.id === id);
      if (local) return local;

      const { data, error } = await this.supabaseService.client
        .from('exams')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      
      return {
          id: data.id,
          title: data.title,
          description: data.description,
          image: data.image,
          level: data.level
      };
  }

  // --- Part CRUD ---

  async getParts(examId: number): Promise<ExamPart[]> {
    const { data, error } = await this.supabaseService.client
      .from('exam_parts')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });

    if (error) {
       // Table might not exist if user didn't run SQL yet
       console.error('Error loading exam parts:', error);
       this.toastr.error('Failed to load exam parts');
       return [];
    }
    
    console.log('Raw DB Parts:', data); // DEBUG

    return data.map((p: any) => ({
      id: p.id,
      examId: p.exam_id,
      title: p.title,
      description: p.description,
      image: p.image,
      duration: p.duration ? Number(p.duration) : 0
    }));
  }

  async addPart(part: Omit<ExamPart, 'id'>): Promise<ExamPart> {
    const dbPart = {
      exam_id: part.examId,
      title: part.title,
      description: part.description,
      image: part.image,
      duration: part.duration ? Number(part.duration) : null
    };

    const { data, error } = await this.supabaseService.client
      .from('exam_parts')
      .insert(dbPart)
      .select()
      .single();

    if (error) {
      console.error('Error adding exam part:', error);
      this.toastr.error('Failed to add exam part');
      throw error;
    }

    this.toastr.success('Exam part added successfully');

    return {
      id: data.id,
      examId: data.exam_id,
      title: data.title,
      description: data.description,
      image: data.image,
      duration: data.duration ? Number(data.duration) : 0
    };
  }

  async updatePart(part: ExamPart): Promise<void> {
      const dbPart = {
          title: part.title,
          description: part.description,
          image: part.image,
          duration: part.duration ? Number(part.duration) : null
      };

      const { error } = await this.supabaseService.client
        .from('exam_parts')
        .update(dbPart)
        .eq('id', part.id);

      if (error) {
          console.error('Error updating exam part:', error);
          this.toastr.error('Failed to update exam part');
          throw error;
      }
      this.toastr.success('Exam part updated successfully');
  }

  async deletePart(id: number): Promise<void> {
      const { error } = await this.supabaseService.client
        .from('exam_parts')
        .delete()
        .eq('id', id);
        
      if (error) {
          console.error('Error deleting exam part:', error);
          this.toastr.error('Failed to delete exam part');
          throw error;
      }
      this.toastr.success('Exam part deleted successfully');
  }

  // --- Assignments ---

  // Cache for assignments
  private assignmentsCache: Map<string, any[]> = new Map();

  async getStudentAssignments(email: string): Promise<any[]> {
    if (this.assignmentsCache.has(email)) {
        return this.assignmentsCache.get(email) || [];
    }

    const { data, error } = await this.supabaseService.client
        .from('student_assignments')
        .select('*')
        .eq('student_email', email);

    if (error) {
        console.error('Error fetching student assignments:', error);
        return [];
    }
    
    const assignments = data || [];
    this.assignmentsCache.set(email, assignments);
    return assignments;
  }

  clearAssignmentCache() {
      this.assignmentsCache.clear();
  }
}
