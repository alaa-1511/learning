import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Question {
  id: number;
  text: string; 
  type: 'multiple-choice' | 'true-false' | 'essay';
  options: string[];
  correctAnswer: number; 
  answerExplanation?: string; 
  ciaPart?: 'P1' | 'P2' | 'P3';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Draft' | 'Archived';
  examId?: number; 
  category?: string;
  courseId?: number;
  targetPage?: 'testbank' | 'free-trial';
}

export interface ExamConfig {
  courseId: number;
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

  // Exam Config Management (kept in LocalStorage for simplicity as per current scope)
  private examConfigs: Record<string, ExamConfig> = {};

  constructor(private supabaseService: SupabaseService) {
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
      return;
    }

    // Map snake_case to camelCase
    const mappedQuestions: Question[] = data.map((q: any) => ({
      ...q,
      correctAnswer: q.correct_answer,
      answerExplanation: q.answer_explanation,
      ciaPart: q.cia_part, // if column exists, or ignore
      courseId: q.course_id,
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
      course_id: question.courseId,
      target_page: question.targetPage,
      // cia_part: question.ciaPart // Add column if needed in schema
    };

    const { data, error } = await this.supabaseService.client
      .from('questions')
      .insert(dbQuestion)
      .select()
      .single();

    if (error) {
        console.error('Error adding question:', error);
        return;
    }

    const newQuestion: Question = {
        ...data,
        correctAnswer: data.correct_answer,
        answerExplanation: data.answer_explanation,
        courseId: data.course_id,
        targetPage: data.target_page,
        options: data.options
    };

    const current = this.questionsSubject.value;
    this.questionsSubject.next([newQuestion, ...current]);
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
      course_id: updatedQuestion.courseId,
      target_page: updatedQuestion.targetPage
    };

    const { error } = await this.supabaseService.client
      .from('questions')
      .update(dbQuestion)
      .eq('id', updatedQuestion.id);

    if (error) {
        console.error('Error updating question:', error);
        return;
    }

    const current = this.questionsSubject.value;
    const index = current.findIndex(q => q.id === updatedQuestion.id);
    if (index !== -1) {
        current[index] = updatedQuestion;
        this.questionsSubject.next([...current]);
    }
  }

  async deleteQuestion(id: number) {
    const { error } = await this.supabaseService.client
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
        console.error('Error deleting question:', error);
        return;
    }

    const current = this.questionsSubject.value;
    this.questionsSubject.next(current.filter(q => q.id !== id));
  }

  getExamConfig(courseId: number): ExamConfig {
    return this.examConfigs[courseId] || {
        courseId: courseId,
        durationMinutes: 120,
        questionCount: 100,
        passingScore: 75,
        randomize: true,
        // ciaPart: 'P1' 
    }; 
  }

  saveExamConfig(config: ExamConfig) {
    this.examConfigs[config.courseId] = config;
    localStorage.setItem('examConfigs', JSON.stringify(this.examConfigs));
  }
}
