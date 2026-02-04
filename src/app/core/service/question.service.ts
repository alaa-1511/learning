import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SupabaseService } from './supabase.service';

export interface Question {
  id: number;
  text: string; 
  type: 'multiple-choice' | 'true-false' | 'essay';
  options: string[];
  correctAnswer: number; 
  answerExplanation?: string; 
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Draft' | 'Archived';
  // New Exam Entity Links
  examId?: number; 
  partId?: number; 
  
  targetPage?: 'testbank' | 'free-trial';
  
  // Legacy / Optional
  courseId?: number; 
  ciaPart?: 'P1' | 'P2' | 'P3';
}

export interface ExamConfig {
  examId: number; // Linked to Exam, not course
  durationMinutes: number;
  questionCount: number; 
  passingScore: number;
  randomize: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private questionsSubject = new BehaviorSubject<Question[]>([]);
  public questions$ = this.questionsSubject.asObservable();

  // Exam Config Management
  private examConfigs: Record<string, ExamConfig> = {};

  constructor(
    private supabaseService: SupabaseService,
    private toastr: ToastrService
  ) {
    this.loadQuestions();
    const storedConfigs = localStorage.getItem('examConfigs');
    if (storedConfigs) {
      this.examConfigs = JSON.parse(storedConfigs);
    }
  }

  private async loadQuestions() {
    const { data, error } = await this.supabaseService.client
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading questions:', error);
      this.toastr.error('Failed to load questions');
      return;
    }

    // Map snake_case to camelCase
    const mappedQuestions: Question[] = data.map((q: any) => ({
      ...q,
      correctAnswer: q.correct_answer,
      answerExplanation: q.answer_explanation,
      ciaPart: q.cia_part, // if column exists, or ignore
      courseId: q.course_id,
      examId: q.exam_id, // New
      partId: q.part_id, 
      targetPage: q.target_page,
      // options comes as JSON array, automatically parsed by Supabase JS client usually
      options: q.options || [] 
    }));

    this.questionsSubject.next(mappedQuestions);
  }

  getQuestions(): Observable<Question[]> {
    return this.questions$;
  }

  async addQuestion(question: Omit<Question, 'id'>) {
    const dbQuestion = {
      text: question.text,
      type: question.type,
      options: question.options,
      correct_answer: question.correctAnswer,
      answer_explanation: question.answerExplanation,
      topic: question.topic,
      difficulty: question.difficulty,
      status: question.status,
      // Link to Exam
      exam_id: question.examId,
      part_id: question.partId,
      
      target_page: question.targetPage,
      // Legacy or Optional
      course_id: question.courseId,
      // cia_part: question.ciaPart // Add column if needed in schema
    };

    const { data, error } = await this.supabaseService.client
      .from('questions')
      .insert(dbQuestion)
      .select()
      .single();

    if (error) {
        console.error('Error adding question:', error);
        this.toastr.error('Failed to add question');
        return;
    }

    const newQuestion: Question = {
        ...data,
        correctAnswer: data.correct_answer,
        answerExplanation: data.answer_explanation,
        examId: data.exam_id,
        partId: data.part_id,
        courseId: data.course_id,
        targetPage: data.target_page,
        options: data.options
    };

    const current = this.questionsSubject.value;
    this.questionsSubject.next([newQuestion, ...current]);
    this.toastr.success('Question added successfully');
  }

  async updateQuestion(updatedQuestion: Question) {
    const dbQuestion = {
      text: updatedQuestion.text,
      type: updatedQuestion.type,
      options: updatedQuestion.options,
      correct_answer: updatedQuestion.correctAnswer,
      answer_explanation: updatedQuestion.answerExplanation,
      topic: updatedQuestion.topic,
      difficulty: updatedQuestion.difficulty,
      status: updatedQuestion.status,
      exam_id: updatedQuestion.examId,
      part_id: updatedQuestion.partId,
      course_id: updatedQuestion.courseId,
      target_page: updatedQuestion.targetPage
    };

    const { error } = await this.supabaseService.client
      .from('questions')
      .update(dbQuestion)
      .eq('id', updatedQuestion.id);

    if (error) {
        console.error('Error updating question:', error);
        this.toastr.error('Failed to update question');
        return;
    }

    const current = this.questionsSubject.value;
    const index = current.findIndex(q => q.id === updatedQuestion.id);
    if (index !== -1) {
        current[index] = updatedQuestion;
        this.questionsSubject.next([...current]);
    }
    this.toastr.success('Question updated successfully');
  }

  async deleteQuestion(id: number) {
    const { error } = await this.supabaseService.client
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
        console.error('Error deleting question:', error);
        this.toastr.error('Failed to delete question');
        return;
    }

    const current = this.questionsSubject.value;
    this.questionsSubject.next(current.filter(q => q.id !== id));
    this.toastr.success('Question deleted successfully');
  }

  saveExamConfig(config: ExamConfig) {
      if (!config.examId) return;
      this.examConfigs[config.examId] = config;
      localStorage.setItem('examConfigs', JSON.stringify(this.examConfigs));
  }

  getExamConfig(examId: number): ExamConfig {
      return this.examConfigs[examId] || {
          examId,
          durationMinutes: 120,
          questionCount: 100,
          passingScore: 75,
          randomize: true
      };
  }
}
