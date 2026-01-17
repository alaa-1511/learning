
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../core/service/question.service';

import { CourseService, Course } from '../../core/service/course.service';
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
  config?: ExamConfig;
}

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './questions.html',
  styleUrl: './questions.css',
})
export class Questions implements OnInit {
  // State: 'list' | 'exam' | 'result'
  currentView: string = 'list';
  
  exams: Exam[] = [];

  selectedExam: Exam | null = null;
  currentQuestionIndex: number = 0;
  score: number = 0;
  percentage: number = 0;
  passed: boolean = false;

  constructor(
    private questionService: QuestionService, 
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    // 1. Fetch Courses (Exams)
    this.courseService.courses$.subscribe(courses => {
       // Filter for Exam Courses (Testbank)
       const standardCourses = courses.filter(c => c.type === 'exam' && !c.isFreeTrial);
       
       this.exams = standardCourses.map(course => ({
           id: course.id,
           title: course.title,
           category: course.category,
           description: course.description,
           image: course.image,
           part: 'P1', // Default or derived if you add 'part' to Course
           config: this.questionService.getExamConfig(course.id),
           questions: []
       }));

       // 2. Fetch Questions and map to Courses
       this.questionService.questions$.subscribe(questions => {
          const activeQuestions = questions.filter(q => q.status === 'Active') as ExamQuestion[];
          
          this.exams.forEach(exam => {
              // Filter questions that belong to this course
              exam.questions = activeQuestions.filter(q => q.courseId === exam.id);
          });
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

  goToQuestion(index: number) {
    this.currentQuestionIndex = index;
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
