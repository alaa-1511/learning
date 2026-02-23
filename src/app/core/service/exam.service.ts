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
  order_index?: number;
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
  order_index?: number;
}

export interface ExamSection {
  id: number;
  partId: number;
  title: string;
  description?: string;
  order_index?: number;
  // Computed
  questionCount?: number;
  lessonCount?: number;
}

export interface ExamLesson {
  id: number;
  sectionId: number;
  title: string;
  description?: string;
  order_index?: number;
  // Computed
  questionCount?: number;
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
      .order('order_index', { ascending: true })
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
      order_index: e.order_index,
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
      level: exam.level,
      order_index: exam.order_index || 0
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
      order_index: data.order_index,
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
      level: exam.level,
      order_index: exam.order_index
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
    // 0. Find parts associated with this exam so we can delete their student_assignments
    const { data: partsData } = await this.supabaseService.client
      .from('exam_parts')
      .select('id')
      .eq('exam_id', id);

    if (partsData && partsData.length > 0) {
        const partIds = partsData.map(p => p.id);
        
        // Delete student assignments for all parts in this exam
        const { error: saError } = await this.supabaseService.client
          .from('student_assignments')
          .delete()
          .in('part_id', partIds);

        if (saError) {
             console.error('Error deleting exam student assignments:', saError);
        }
    }

    // 1. Delete associated Questions
    const { error: qError } = await this.supabaseService.client
      .from('questions')
      .delete()
      .eq('exam_id', id);

    if (qError) {
      console.error('Error deleting exam questions:', qError);
      // We might continue or stop? Usually stop if strict.
      // But if questions are protected, we can't proceed.
      // Assuming we want to force delete.
    }

    // 2. Delete associated Parts
    const { error: pError } = await this.supabaseService.client
      .from('exam_parts')
      .delete()
      .eq('exam_id', id);

    if (pError) {
       console.error('Error deleting exam parts:', pError);
    }

    // 3. Delete the Exam itself
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
          level: data.level,
          order_index: data.order_index
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
      duration: part.duration ? Number(part.duration) : null,
      order_index: part.order_index || 0
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
          duration: data.duration ? Number(data.duration) : 0,
          order_index: data.order_index
        };
      }

  async updatePart(part: ExamPart): Promise<void> {
      const dbPart = {
          title: part.title,
          description: part.description,
          image: part.image,
          duration: part.duration ? Number(part.duration) : null,
          order_index: part.order_index
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
      // 1. Delete associated student assignments to avoid FK constraint
      const { error: saError } = await this.supabaseService.client
        .from('student_assignments')
        .delete()
        .eq('part_id', id);

      if (saError) {
          console.error('Error deleting student assignments for part:', saError);
          // If we can't delete assignments, we probably can't delete the part.
          // Decide whether to throw or continue. Throwing is safer to avoid orphaned state.
          // this.toastr.error('Failed to delete associated assignments');
          // throw saError;
      }

      // 2. Delete the part
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

  // --- Section CRUD ---

  async getSections(partId: number): Promise<ExamSection[]> {
    const { data, error } = await this.supabaseService.client
      .from('exam_sections')
      .select('*')
      .eq('part_id', partId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
       console.error('Error loading exam sections:', error);
       this.toastr.error('Failed to load sections');
       return [];
    }

    return data.map((s: any) => ({
      id: s.id,
      partId: s.part_id,
      title: s.title,
      description: s.description,
      order_index: s.order_index
    }));
  }

  async addSection(section: Omit<ExamSection, 'id'>): Promise<ExamSection> {
    const dbSection = {
      part_id: section.partId,
      title: section.title,
      description: section.description,
      order_index: section.order_index || 0
    };

    const { data, error } = await this.supabaseService.client
      .from('exam_sections')
      .insert(dbSection)
      .select()
      .single();

    if (error) {
      console.error('Error adding section:', error);
      this.toastr.error('Failed to add section');
      throw error;
    }

    this.toastr.success('Section added successfully');
    return {
      id: data.id,
      partId: data.part_id,
      title: data.title,
      description: data.description,
      order_index: data.order_index
    };
  }

  async updateSection(section: ExamSection): Promise<void> {
      const dbSection = {
          part_id: section.partId, // allow moving between parts
          title: section.title,
          description: section.description,
          order_index: section.order_index
      };

      const { error } = await this.supabaseService.client
        .from('exam_sections')
        .update(dbSection)
        .eq('id', section.id);

      if (error) {
          console.error('Error updating section:', error);
          this.toastr.error('Failed to update section');
          throw error;
      }
      this.toastr.success('Section updated successfully');
  }

  async deleteSection(id: number): Promise<void> {
      const { error } = await this.supabaseService.client
        .from('exam_sections')
        .delete()
        .eq('id', id);
        
      if (error) {
          console.error('Error deleting section:', error);
          this.toastr.error('Failed to delete section');
          throw error;
      }
      this.toastr.success('Section deleted successfully');
  }

  // --- Lesson CRUD ---

  async getLessons(sectionId: number): Promise<ExamLesson[]> {
    const { data, error } = await this.supabaseService.client
      .from('exam_lessons')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
       console.error('Error loading lessons:', error);
       this.toastr.error('Failed to load lessons');
       return [];
    }

    return data.map((l: any) => ({
      id: l.id,
      sectionId: l.section_id,
      title: l.title,
      description: l.description,
      order_index: l.order_index
    }));
  }

  async addLesson(lesson: Omit<ExamLesson, 'id'>): Promise<ExamLesson> {
    const dbLesson = {
      section_id: lesson.sectionId,
      title: lesson.title,
      description: lesson.description,
      order_index: lesson.order_index || 0
    };

    const { data, error } = await this.supabaseService.client
      .from('exam_lessons')
      .insert(dbLesson)
      .select()
      .single();

    if (error) {
      console.error('Error adding lesson:', error);
      this.toastr.error('Failed to add lesson');
      throw error;
    }

    this.toastr.success('Lesson added successfully');
    return {
      id: data.id,
      sectionId: data.section_id,
      title: data.title,
      description: data.description,
      order_index: data.order_index
    };
  }

  async updateLesson(lesson: ExamLesson): Promise<void> {
      const dbLesson = {
          section_id: lesson.sectionId, // allow moving between sections
          title: lesson.title,
          description: lesson.description,
          order_index: lesson.order_index
      };

      const { error } = await this.supabaseService.client
        .from('exam_lessons')
        .update(dbLesson)
        .eq('id', lesson.id);

      if (error) {
          console.error('Error updating lesson:', error);
          this.toastr.error('Failed to update lesson');
          throw error;
      }
      this.toastr.success('Lesson updated successfully');
  }

  async deleteLesson(id: number): Promise<void> {
      const { error } = await this.supabaseService.client
        .from('exam_lessons')
        .delete()
        .eq('id', id);
        
      if (error) {
          console.error('Error deleting lesson:', error);
          this.toastr.error('Failed to delete lesson');
          throw error;
      }
      this.toastr.success('Lesson deleted successfully');
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
