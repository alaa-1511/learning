import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { QuestionService, Question } from '../../core/service/question.service';
import { Router } from '@angular/router';

interface ExamQuestion extends Question {
  selectedAnswer?: number; // User's selected option index
}

interface Exam {
  id: number;
  title: string;
  description: string;
  category: string;
  questions: ExamQuestion[];
  image: string;
  part: string; // P1, P2, P3
}

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './questions.html',
  styleUrl: './questions.css',
})
export class Questions implements OnInit {
  // State: 'list' | 'exam' | 'result'
  currentView: string = 'list';
  
  // Data
  exams: Exam[] = [
    {
      id: 1,
      title: 'QUESTIONS.EXAMS.EXAM1.TITLE',
      category: 'QUESTIONS.EXAMS.EXAM1.CATEGORY',
      description: 'QUESTIONS.EXAMS.EXAM1.DESC',
      image: '/courses/img mealify1.jfif',
      part: 'P1',
      questions: []
    },
    {
      id: 2,
      title: 'QUESTIONS.EXAMS.EXAM2.TITLE',
      category: 'QUESTIONS.EXAMS.EXAM2.CATEGORY',
      description: 'QUESTIONS.EXAMS.EXAM2.DESC',
      image: '/courses/img mealify2.jfif',
      part: 'P2',
      questions: []
    },
     {
      id: 3,
      title: 'QUESTIONS.EXAMS.EXAM3.TITLE',
      category: 'QUESTIONS.EXAMS.EXAM3.CATEGORY',
      description: 'QUESTIONS.EXAMS.EXAM3.DESC',
      image: '/courses/img mealify2.jfif',
      part: 'P3',
      questions: []
    }
  ];

  selectedExam: Exam | null = null;
  currentQuestionIndex: number = 0;
  score: number = 0;
  percentage: number = 0;
  passed: boolean = false;

  constructor(private questionService: QuestionService, private router: Router) {}

  ngOnInit() {
    this.questionService.questions$.subscribe(questions => {
      // Filter Active questions and distribute them to exams
      // Cast to ExamQuestion[] to include selectedAnswer optional property
      const activeQuestions = questions.filter(q => q.status === 'Active') as ExamQuestion[];
      
      this.exams.forEach(exam => {
        exam.questions = activeQuestions.filter(q => q.ciaPart === exam.part);
      });
    });
  }

  // Actions
  enroll(exam: Exam) {
    if (exam.questions.length === 0) {
        alert('No questions available for this exam yet.');
        return;
    }
    this.selectedExam = exam;
    this.currentView = 'exam';
    this.currentQuestionIndex = 0;
    
    // Reset selections
    this.selectedExam.questions.forEach(q => q.selectedAnswer = undefined);
  }

  selectAnswer(optionIndex: number) {
    if (this.selectedExam) {
      this.selectedExam.questions[this.currentQuestionIndex].selectedAnswer = optionIndex;
    }
  }

  nextQuestion() {
    if (this.selectedExam && this.currentQuestionIndex < this.selectedExam.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitExam() {
    if (!this.selectedExam) return;

    let correctCount = 0;
    this.selectedExam.questions.forEach(q => {
      // Assuming correctAnswer is index based (0-3) as established in service/questions.ts logic
      if (q.selectedAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    this.score = correctCount;
    this.percentage = Math.round((correctCount / this.selectedExam.questions.length) * 100);
    this.passed = this.percentage >= 70; // 70% passing grade
    this.currentView = 'result';
  }

  reset() {
    this.selectedExam = null;
    this.currentView = 'list';
    this.score = 0;
    this.percentage = 0;
  }
}
