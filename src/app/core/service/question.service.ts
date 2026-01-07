import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: number;
  // New/Updated fields
  ciaPart: 'P1' | 'P2' | 'P3';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Active' | 'Draft' | 'Archived';
  examId?: number; // Keeping for compatibility but might removing later
  category?: string; // Keeping for compatibility
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
        examId: 2
    }
  ];

  constructor() {
    this.loadFromStorage();
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
    // else: keep default mockedQuestions
    this.questionsSubject.next(this.mockedQuestions);
  }
}
