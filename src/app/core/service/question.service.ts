import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  private mockedQuestions: Question[] = [
    {
      id: 1,
      text: 'What is the primary purpose of internal auditing?',
      type: 'multiple-choice',
      options: ['To detect fraud', 'To evaluate internal controls', 'To prepare financial statements', 'To assist management'],
      correctAnswer: 3,
      category: 'Internal Audit',
      ciaPart: 'P1',
      topic: 'Essentials of Internal Auditing',
      difficulty: 'Easy',
      status: 'Active',
      examId: 1
    },
    {
      id: 2,
      text: 'Which framework is commonly used for...',
      type: 'true-false',
      options: ['True', 'False'],
      correctAnswer: 0,
       category: 'Programming',
       ciaPart: 'P1',
       topic: 'Governance',
       difficulty: 'Medium',
       status: 'Active',
       examId: 2
    },
    {
        id: 3,
        text: 'Risk management is the responsibility of...',
        type: 'multiple-choice',
        options: ['Internal Audit', 'Management', 'Board', 'External Audit'],
        correctAnswer: 1,
        category: 'Programming',
        ciaPart: 'P2',
        topic: 'Risk Management',
        difficulty: 'Hard',
        status: 'Active',
        examId: 2,
        answerExplanation: 'Management is responsible for risk management processes. Internal audit provides assurance on them.'
    }
  ];

  // Exam Config Management
  private examConfigs: Record<string, ExamConfig> = {};

  getExamConfig(courseId: number): ExamConfig {
    return this.examConfigs[courseId] || {
        courseId: courseId,
        durationMinutes: 120,
        questionCount: 100,
        passingScore: 75,
        randomize: true,
        ciaPart: 'P1' // Fallback/Legacy
    }; 
  }

  saveExamConfig(config: ExamConfig) {
    this.examConfigs[config.courseId] = config;
    localStorage.setItem('examConfigs', JSON.stringify(this.examConfigs));
  }

  constructor() {
    this.loadFromStorage();
    const storedConfigs = localStorage.getItem('examConfigs');
    if (storedConfigs) {
      this.examConfigs = JSON.parse(storedConfigs);
    }
  }

  getQuestions(): Observable<Question[]> {
    return this.questions$;
  }

  addQuestion(question: Omit<Question, 'id'>) {
    const newQuestion = {
      ...question,
      id: this.generateId()
    };
    this.mockedQuestions = [...this.mockedQuestions, newQuestion];
    this.updateState();
  }

  updateQuestion(updatedQuestion: Question) {
    this.mockedQuestions = this.mockedQuestions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    this.updateState();
  }

  deleteQuestion(id: number) {
    this.mockedQuestions = this.mockedQuestions.filter(q => q.id !== id);
    this.updateState();
  }

  private generateId(): number {
    return this.mockedQuestions.length > 0 
      ? Math.max(...this.mockedQuestions.map(q => q.id)) + 1 
      : 1;
  }

  private updateState() {
    this.questionsSubject.next(this.mockedQuestions);
    this.saveToStorage();
  }

  private saveToStorage() {
    localStorage.setItem('questions', JSON.stringify(this.mockedQuestions));
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('questions');
    if (stored) {
      this.mockedQuestions = JSON.parse(stored);
    }
    this.questionsSubject.next(this.mockedQuestions);
  }
}
