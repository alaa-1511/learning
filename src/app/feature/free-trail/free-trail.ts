import { Component, OnInit, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../core/service/question.service';
import { ExamService, ExamPart, Exam } from '../../core/service/exam.service';
import { Router, RouterLink } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface ExamQuestion extends Question {
  selectedAnswer?: number;
  studentAnswer?: string;
}

@Component({
  selector: 'app-free-trail',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, DialogModule ,RouterLink],
  templateUrl: './free-trail.html',
  styleUrl: './free-trail.css',
})
export class FreeTrail implements OnInit, OnDestroy {
   @Input() minii: boolean = false;
  // State: 'categories' | 'list' | 'parts' | 'exam' | 'result'
  currentView: 'categories' | 'list' | 'parts' | 'exam' | 'result' = 'list';
  
  exams: Exam[] = [];
  filteredExams: Exam[] = [];
  parts: ExamPart[] = [];
  categories: { name: string, image: string, count: number, description?: string }[] = [];

  selectedCategory: string | null = null;
  selectedExam: Exam | null = null;
  selectedPart: ExamPart | null = null;

  // Multi-selection support for Parts
  selectedParts: Set<number> = new Set();
  
  filteredQuestions: ExamQuestion[] = [];

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
    private examService: ExamService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  safeHtml(content: string | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content || '');
  }

  ngOnInit() {
    this.questionService.questions$.subscribe(questions => {
       const freeQuestions = questions.filter(q => q.status === 'Active' && q.targetPage === 'free-trial').map(q => ({
           ...q,
           type: q.type.toLowerCase() as any
       })) as ExamQuestion[];

       this.examService.exams$.subscribe(exams => {
           this.exams = exams.map(exam => ({
               id: exam.id,
               title: exam.title,
               category: exam.level || 'General', 
               description: exam.description || '',
               image: exam.image || '',
               part: 'All Parts', 
               config: this.questionService.getExamConfig(exam.id),
               questions: freeQuestions.filter(q => q.examId === exam.id),
               partCount: new Set(freeQuestions.filter(q => q.examId === exam.id).map(q => q.partId || 'orphan')).size
           }));
           
           this.exams = this.exams.filter(e => (e.questions?.length || 0) > 0);
           
           this.extractCategories();
           this.filteredExams = this.exams;
           this.currentView = 'list';
       });
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
          description: `Access ${count} free trials in ${name}`
      }));
  }
  
  getCategoryImage(category: string): string {
      switch(category.toLowerCase()) {
          case 'math': return 'assets/images/categories/math.png';
          case 'science': return 'assets/images/categories/science.png';
          default: return '';
      }
  }

  ngOnDestroy() {
      this.stopTimer();
  }

  enroll(exam: Exam) {
      this.router.navigate(['/free-trial']);
  }
  
  selectCategory(categoryName: string) {
      this.selectedCategory = categoryName;
      this.filteredExams = this.exams.filter(e => e.category === categoryName);
      this.currentView = 'list';
      window.scrollTo(0, 0);
  }

  backToCategories() {
      this.selectedCategory = null;
      this.currentView = 'categories';
  }

  async selectExam(exam: Exam) {
    if (this.minii) {
        this.router.navigate(['/free-trial']);
        return;
    }

    if (!exam.questions || exam.questions.length === 0) {
        this.showAlert('No questions available for this exam yet.', 'Notice');
        return;
    }
    
    this.selectedExam = exam;
    this.selectedParts.clear(); // Clear previous selections
    this.parts = await this.examService.getParts(exam.id);
    
    const currentQuestions = exam.questions || [];
    const orphans = currentQuestions.filter((q: any) => !q.partId);
    
    if (orphans.length > 0) {
        this.parts.push({
            id: -1,
            examId: exam.id,
            title: 'General Review',
            description: 'Questions applicable to the entire exam.',
            image: '' 
        });
    }

    this.parts.forEach(p => {
        let count = 0;
        if (p.id === -1) {
            count = orphans.length;
        } else {
            count = currentQuestions.filter((q: any) => q.partId === p.id).length;
        }
        p.questionCount = count;
        // Logic similar to Questions component
        p.durationLabel = (p.duration && p.duration > 0) ? p.duration + ' Mins' : Math.ceil(count * 1.5) + ' Mins';
    });

    if (this.parts.length === 0 && orphans.length === 0) {
         this.showAlert('No parts or questions defined for this exam yet.', 'Notice');
         return;
    }

    this.currentView = 'parts';
    window.scrollTo(0, 0);
  }

  togglePartSelection(part: ExamPart) {
      if (this.selectedParts.has(part.id)) {
          this.selectedParts.delete(part.id);
      } else {
          this.selectedParts.add(part.id);
      }
  }

  toggleAllParts() {
      if (this.selectedParts.size === this.parts.length) {
          this.selectedParts.clear();
      } else {
          this.parts.forEach(p => this.selectedParts.add(p.id));
      }
  }

  proceedToExam() {
      if(this.selectedParts.size === 0) {
          this.showAlert('Please select at least one part to start.', 'Selection Required');
          return;
      }
      
      const allSelectedQuestions: ExamQuestion[] = [];
      const examQuestions = this.selectedExam?.questions || [];

      this.selectedParts.forEach(partId => {
          let questionsForPart = [];
          if(partId === -1) {
               questionsForPart = examQuestions.filter((q: any) => !q.partId);
          } else {
               questionsForPart = examQuestions.filter((q: any) => q.partId === partId);
          }
          allSelectedQuestions.push(...questionsForPart);
      });
      
      this.startExam(allSelectedQuestions);
  }

  // Legacy support if selectPart is called directly from template (though updated template should use toggle)
  selectPart(part: ExamPart) {
      this.togglePartSelection(part);
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

  showAlert(message: string, header: string = 'Notification') {
      this.alertMessage = message;
      this.alertHeader = header;
      this.alertDialogVisible = true;
  }

  startExam(questions: ExamQuestion[]) {
      this.currentView = 'exam';
      this.currentQuestionIndex = 0;
      this.reviewMode = false;
      this.filteredQuestions = questions;
      
      this.filteredQuestions.forEach(q => q.selectedAnswer = undefined);
  
      // Calculate total duration based on selected parts
      let totalDuration = 0;

      this.selectedParts.forEach(partId => {
          const part = this.parts.find(p => p.id === partId);
          if (part && part.duration && part.duration > 0) {
              totalDuration += Number(part.duration);
          } else {
              // Fallback per part question count if no duration set on that part
              const pCount = this.parts.find(p => p.id === partId)?.questionCount || 0;
              totalDuration += Math.ceil(pCount * 1.5);
          }
      });

      this.remainingTime = totalDuration * 60;
      this.startTimer();
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
      if (this.reviewMode) {
          this.currentQuestionIndex = index;
          return;
      }

      // Strict Mode Logic
      let firstUnanswered = this.filteredQuestions.findIndex(q => q.selectedAnswer === undefined);
      if (firstUnanswered === -1) firstUnanswered = this.filteredQuestions.length - 1;

      if (index <= firstUnanswered) {
           this.currentQuestionIndex = index;
      } else {
           this.showAlert('You must answer previous questions before proceeding.', 'Navigation Locked');
      }
  }

  nextQuestion() {
    const currentQ = this.filteredQuestions[this.currentQuestionIndex];
    if (currentQ.selectedAnswer === undefined && !this.reviewMode) {
        this.showAlert('Please select an answer before proceeding.', 'Answer Required');
        return;
    }

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
    if (!timeUp && !this.reviewMode) {
        const currentQ = this.filteredQuestions[this.currentQuestionIndex];
        if (currentQ.selectedAnswer === undefined) {
             this.showAlert('Please answer the last question before submitting.', 'Answer Required');
             return;
        }
    }

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
    this.stopTimer();
    this.selectedPart = null;
    this.selectedParts.clear();
    this.backToParts();
  }
}
