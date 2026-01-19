
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../core/service/question.service';

import { CourseService, Course } from '../../core/service/course.service';
import { Router, RouterModule } from '@angular/router';

interface ExamQuestion extends Question {
  selectedAnswer?: number; // User's selected option index
  studentAnswer?: string; // For Essay questions
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
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule],
  templateUrl: './questions.html',
  styleUrl: './questions.css',
})
export class Questions implements OnInit {
  // State: 'list' | 'exam' | 'result'
  currentView: string = 'list';
    @Input() mini: boolean = false;

  exams: Exam[] = [];

  selectedExam: Exam | null = null;
  currentQuestionIndex: number = 0;
  score: number = 0;
  percentage: number = 0;
  passed: boolean = false;
  reviewMode: boolean = false;

  constructor(
    private questionService: QuestionService, 
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.questionService.questions$.subscribe(questions => {
       // Filter for Active, Testbank Questions (Default targetPage is 'testbank' if undefined?)
       // We assume strict 'testbank' or undefined/null defaults to testbank? 
       // Based on form, it's required 'testbank' or 'free-trial'.
       const testbankQuestions = questions.filter(q => q.status === 'Active' && q.targetPage !== 'free-trial').map(q => ({
           ...q,
           type: q.type.toLowerCase() as any
       })) as ExamQuestion[];

       const testbankCourseIds = new Set(testbankQuestions.map(q => q.courseId));

       this.courseService.courses$.subscribe(courses => {
           // Show course if it is standard exam (not free trial flag) OR has testbank questions
           const visibleCourses = courses.filter(c => c.type === 'exam' && (!c.isFreeTrial || testbankCourseIds.has(c.id)));
           
           this.exams = visibleCourses.map(course => ({
               id: course.id,
               title: course.title,
               category: course.category,
               description: course.description,
               image: course.image,
               part: 'P1',
               config: this.questionService.getExamConfig(course.id),
               questions: testbankQuestions.filter(q => q.courseId === course.id)
           }));
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
    this.passed = this.percentage >= 70; // 70% passing grade
    this.currentView = 'result';
  }

  startReview() {
    this.currentView = 'exam';
    this.reviewMode = true;
    this.currentQuestionIndex = 0;
  }

  reset() {
    this.selectedExam = null;
    this.currentView = 'list';
    this.score = 0;
    this.score = 0;
    this.percentage = 0;
    this.reviewMode = false;
  }
}
