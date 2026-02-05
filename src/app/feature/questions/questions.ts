import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../core/service/question.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SupabaseService } from '../../core/service/supabase.service'; // Added import

import { ExamService, ExamPart, Exam } from '../../core/service/exam.service';
import { Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';

interface ExamQuestion extends Question {
  selectedAnswer?: number; // User's selected option index
  studentAnswer?: string; // For Essay questions
}


@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule, DialogModule],
  templateUrl: './questions.html',
  styleUrl: './questions.css',
})
export class Questions implements OnInit {
  // State: 'categories' | 'list' | 'parts' | 'exam' | 'result'
  currentView: 'categories' | 'list' | 'parts' | 'exam' | 'result' = 'list';
    @Input() mini: boolean = false;

  exams: Exam[] = [];
  filteredExams: Exam[] = []; // Exams filtered by category
  parts: ExamPart[] = [];
  categories: { name: string, image: string, count: number, description?: string }[] = [];

  selectedCategory: string | null = null;
  selectedExam: Exam | null = null;
  selectedPart: ExamPart | null = null;

  filteredQuestions: ExamQuestion[] = []; // Questions for the selected part

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

  // User Data
  currentUser: any = null;
  userAssignments: any[] = [];

  constructor(
    private questionService: QuestionService, 
    private examService: ExamService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private supabaseService: SupabaseService // Injected service
  ) {}

  safeHtml(content: string | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content || '');
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
      // 1. Get Current User (Local Session is faster/no spinner)
      const { data: { session } } = await this.supabaseService.client.auth.getSession();
      this.currentUser = session?.user || null;

      // 2. Fetch assignments if user exists
      if (this.currentUser && this.currentUser.email) {
          // Check if we already have assignments loaded? For now, fetch fresh to be safe but maybe we can optimize later.
          // Still, getSession() saved one fetch.
          const assignments = await this.examService.getStudentAssignments(this.currentUser.email);
          this.userAssignments = assignments || [];
          console.log('User Assignments:', this.userAssignments);
      }

      // 3. Combine Streams
      combineLatest([
        this.questionService.questions$,
        this.examService.exams$
      ]).subscribe(([questions, exams]) => {
          // Filter for Active, Testbank Questions
          const testbankQuestions = questions
            .filter(q => q.status === 'Active' && (!q.targetPage || q.targetPage === 'testbank'))
            .map(q => ({
                ...q,
                type: q.type.toLowerCase() as any
            })) as ExamQuestion[];

          this.exams = exams.map(exam => ({
               id: exam.id,
               title: exam.title,
               category: exam.level || 'General',
               description: exam.description || '',
               image: exam.image || '',
               part: 'All Parts', 
               config: this.questionService.getExamConfig(exam.id),
               questions: testbankQuestions.filter(q => q.examId === exam.id),
               partCount: new Set(testbankQuestions.filter(q => q.examId === exam.id).map(q => q.partId || 'orphan')).size
           }));

           // Filter Exams: Show assigned ones if user has assignments
           let visibleExams = this.exams;
           if (this.currentUser && this.userAssignments.length > 0) {
               const assignedCourseIds = new Set(this.userAssignments.map(a => a.course_id));
               visibleExams = this.exams.filter(e => assignedCourseIds.has(e.id));
           }
           this.exams = visibleExams;
           
           this.extractCategories();
           
           this.filteredExams = this.exams;
           this.currentView = 'list';
      });
  }
  
  extractCategories() {
      const catMap = new Map<string, number>();
      this.exams.forEach(e => {
          const cat = e.category || 'General';
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
      });

      this.categories = Array.from(catMap.entries()).map(([name, count]) => ({
          name,
          count,
          image: this.getCategoryImage(name),
          description: `Explore ${count} courses in ${name}`
      }));
  }

  getCategoryImage(category: string): string {
      // Return a default image or map specific names if you have assets
      // For now, consistent placeholders
      switch(category.toLowerCase()) {
          case 'math': return 'assets/images/categories/math.png'; // Example
          case 'science': return 'assets/images/categories/science.png';
          default: return ''; // Will allow fallback in template
      }
  }

  ngOnDestroy() {
      this.stopTimer();
  }

  // Navigation Logic
  
  selectCategory(categoryName: string) {
      this.selectedCategory = categoryName;
      this.filteredExams = this.exams.filter(e => e.category === categoryName);
      this.currentView = 'list';
      window.scrollTo(0,0);
  }

  backToCategories() {
      this.selectedCategory = null;
      this.currentView = 'categories';
  }

  async selectExam(exam: Exam) {
    if (this.mini) {
        this.router.navigate(['/questions']);
        return;
    }

    if (!exam.questions || exam.questions.length === 0) {
        this.showAlert('No questions available for this course yet.', 'Coming Soon');
         return;
    }
    
    this.selectedExam = exam;
    this.parts = await this.examService.getParts(exam.id);

    // Filter Parts based on assignments (Using cached data from init)
    if (this.currentUser) {
        if (this.userAssignments.length > 0) {
            // Filter parts that are in the assignment list for this course
            // ID Comparison: Ensure types match (db might be string/number)
            const assignedPartIds = new Set(
                this.userAssignments
                    .filter(a => Number(a.course_id) === Number(exam.id)) 
                    .map(a => Number(a.part_id))
            );
            
            if (assignedPartIds.size > 0) {
                // Also use Number for filtering parts
                this.parts = this.parts.filter(p => assignedPartIds.has(Number(p.id)));
            } else {
                this.parts = [];
            }
        } else {
            // Logged in but no assignments at all
            this.parts = [];
        }
    }
    
    // Check for orphaned questions (no part) in this exam
    // Use fallback to empty array safely
    const currentQuestions = exam.questions || [];
    const orphans = currentQuestions.filter((q: any) => !q.partId);
    
    if (orphans.length > 0) {
        this.parts.push({
            id: -1,
            examId: exam.id,
            title: 'General Review',
            description: 'Comprehensive questions for this course.',
            image: '' 
        });
    }

    // Calculate metadata for parts
    this.parts.forEach(p => {
        let count = 0;
        if (p.id === -1) {
            count = orphans.length;
        } else {
            count = currentQuestions.filter((q: any) => q.partId === p.id).length;
        }
        p.questionCount = count;
        // Strict Priority: Use manual duration if set (>0), otherwise fallback
        p.durationLabel = (p.duration && p.duration > 0) ? p.duration + ' Mins' : Math.ceil(count * 1.5) + ' Mins';
    });

    if (this.parts.length === 0 && orphans.length === 0) {
         this.showAlert('No parts or questions defined for this course yet.', 'Notice');
         return;
    }

    this.currentView = 'parts';
    window.scrollTo(0,0);
  }

  selectPart(part: ExamPart) {
    this.selectedPart = part;
    // Safely access questions
    const allQuestions = this.selectedExam?.questions || [];
    
    if (part.id === -1) {
        // Orphans
        this.filteredQuestions = allQuestions.filter((q: any) => !q.partId);
    } else {
        this.filteredQuestions = allQuestions.filter((q: any) => q.partId === part.id);
    }

      if (this.filteredQuestions.length === 0) {
          this.showAlert('No questions in this part.', 'Notice');
          return;
      }
      
      this.startExam(this.filteredQuestions);
  }

  backToExams() {
      this.selectedExam = null;
      this.parts = [];
      this.currentView = 'list';
      this.stopTimer();
  }

  backToParts() {
      this.selectedPart = null;
      this.currentView = 'parts';
      this.stopTimer();
      this.reviewMode = false;
  }

  startExam(questions: ExamQuestion[]) {
    this.currentView = 'exam';
    this.currentQuestionIndex = 0;
    this.reviewMode = false;
    
    // Reset answers
    questions.forEach(q => q.selectedAnswer = undefined);

    // Initialize Timer
    if (this.selectedPart && this.selectedPart.duration && this.selectedPart.duration > 0) {
        // defined part duration
        this.remainingTime = Math.floor(Number(this.selectedPart.duration) * 60);
        this.startTimer();
    } else {
        // Fallback: 1.5 mins per question
        const calculatedMinutes = Math.ceil(questions.length * 1.5);
        this.remainingTime = calculatedMinutes * 60;
        this.startTimer();
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
    if (!this.reviewMode && this.filteredQuestions.length > 0) {
      this.filteredQuestions[this.currentQuestionIndex].selectedAnswer = optionIndex;
    }
  }

  goToQuestion(index: number) {
    this.currentQuestionIndex = index;
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.filteredQuestions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  submitExam(timeUp: boolean = false) {
    this.stopTimer();

    if (timeUp) {
        this.showAlert('Time is up! Your exam has been submitted automatically.', 'Time Expired');
    }

    let correctCount = 0;
    this.filteredQuestions.forEach(q => {
      if (q.selectedAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    this.score = correctCount;
    this.percentage = Math.round((correctCount / this.filteredQuestions.length) * 100);
    this.passed = this.percentage >= 70; 
    this.currentView = 'result';
  }

  startReview() {
    this.currentView = 'exam';
    this.reviewMode = true;
    this.currentQuestionIndex = 0;
  }

  reset() {
    this.selectedPart = null;
    // Go back to Parts view logic or stay in parts?
    // Let's go back to parts selection
    this.backToParts();
  }
}
