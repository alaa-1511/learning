import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../core/service/question.service';
import { CourseService, Course } from '../../core/service/course.service';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';

interface ExamQuestion extends Question {
  selectedAnswer?: number;
  studentAnswer?: string;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  category: string;
  questions: ExamQuestion[];
  image: string;
  part: string;
  config?: ExamConfig;
}

@Component({
  selector: 'app-free-trail',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, DialogModule],
  templateUrl: './free-trail.html',
  styleUrl: './free-trail.css',
})
export class FreeTrail implements OnInit {
  currentView: string = 'list';
  exams: Exam[] = [];

  selectedExam: Exam | null = null;
  currentQuestionIndex: number = 0;
  score: number = 0;
  percentage: number = 0;
  passed: boolean = false;
  reviewMode: boolean = false;

  timer: any;
  remainingTime: number = 0;

  // Alert Modal State
  alertDialogVisible: boolean = false;
  alertMessage: string = '';
  alertHeader: string = 'Notification';

  constructor(
    private questionService: QuestionService, 
    private courseService: CourseService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Subscribe to questions first to see which courses have content
    this.questionService.questions$.subscribe(questions => {
       // Filter for Active, Free Trial Questions
       const freeQuestions = questions.filter(q => q.status === 'Active' && q.targetPage === 'free-trial').map(q => ({
           ...q,
           type: q.type.toLowerCase() as any
       })) as ExamQuestion[];

       const freeCourseIds = new Set(freeQuestions.map(q => q.courseId));

       this.courseService.courses$.subscribe(courses => {
           // Show course if it is marked as Free Trial OR if it has Free Trial questions inside it
           const visibleCourses = courses.filter(c => c.type === 'exam' && (c.isFreeTrial || freeCourseIds.has(c.id)));
           
           this.exams = visibleCourses.map(course => ({
               id: course.id,
               title: course.title,
               category: course.category,
               description: course.description,
               image: course.image,
               part: 'P1', 
               config: this.questionService.getExamConfig(course.id),
               questions: freeQuestions.filter(q => q.courseId === course.id)
           }));
       });
    });
  }

  ngOnDestroy() {
      this.stopTimer();
  }

  // Actions
  enroll(exam: Exam) {
    if (exam.questions.length === 0) {
        this.showAlert('No questions available for this exam yet.', 'Notice');
        return;
    }
    this.selectedExam = exam;
    this.currentView = 'exam';
    this.currentQuestionIndex = 0;
    this.reviewMode = false;
    this.selectedExam.questions.forEach(q => q.selectedAnswer = undefined);

    // Initialize Timer
    if (this.selectedExam.config?.durationMinutes) {
        this.remainingTime = Math.floor(Number(this.selectedExam.config.durationMinutes) * 60);
        this.startTimer();
    } else {
        this.remainingTime = 0;
    }
  }

  showAlert(message: string, header: string = 'Notification') {
      this.alertMessage = message;
      this.alertHeader = header;
      this.alertDialogVisible = true;
  }

  startTimer() {
      this.stopTimer();
      this.timer = setInterval(() => {
          if (this.remainingTime > 0) {
              this.remainingTime--;
              this.cd.detectChanges();
          } else {
              this.submitExam(true);
          }
      }, 1000);
  }

  stopTimer() {
      if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
      }
  }

  get formattedTime(): string {
      const minutes: number = Math.floor(this.remainingTime / 60);
      const seconds: number = this.remainingTime % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  selectAnswer(optionIndex: number) {
    if (this.selectedExam && !this.reviewMode) {
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

  submitExam(timeUp: boolean = false) {
    if (!this.selectedExam) return;
    this.stopTimer();

    if (timeUp) {
        this.showAlert('Time is up! Your exam has been submitted automatically.', 'Time Expired');
    }

    let correctCount = 0;
    this.selectedExam.questions.forEach(q => {
      if (q.selectedAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    this.score = correctCount;
    this.percentage = Math.round((correctCount / this.selectedExam.questions.length) * 100);
    this.passed = this.percentage >= 70;
    this.currentView = 'result';
  }

  startReview() {
    this.currentView = 'exam';
    this.reviewMode = true;
    this.currentQuestionIndex = 0;
  }

  reset() {
    this.stopTimer();
    this.selectedExam = null;
    this.currentView = 'list';
    this.score = 0;
    this.percentage = 0;
    this.reviewMode = false;
  }
}
