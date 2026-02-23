import { Component, OnInit, ChangeDetectorRef, Input, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../core/service/question.service';
import { ExamService, ExamPart, Exam, ExamSection, ExamLesson } from '../../core/service/exam.service';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  changeDetection: ChangeDetectionStrategy.OnPush
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

  // Loaded hierarchy for selected exam
  allSections: ExamSection[] = [];
  allLessons: ExamLesson[] = [];

  // Practice Mode Config State
  configView: boolean = false;
  availableTopics: any[] = [];
  selectedTopics: Set<string> = new Set();
  configQuestionCount: number = 10;
  maxQuestionsAvailable: number = 0;
  configTimerEnabled: boolean = false;
  configMode: 'tutor' | 'exam' = 'exam';
  tutorMode: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private questionService: QuestionService, 
    private examService: ExamService,
    private router: Router,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private cd: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  safeHtml(content: string | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content || '');
  }

  ngOnInit() {
    combineLatest([
      this.questionService.questions$,
      this.examService.exams$,
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([questions, exams, params]) => {
       if (!questions || !exams) return;

       const freeQuestions = questions.filter(q => q.targetPage === 'free-trial').map(q => ({
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
           questions: freeQuestions.filter(q => q.examId === exam.id),
           partCount: new Set(freeQuestions.filter(q => q.examId === exam.id).map(q => q.partId || 'orphan')).size
       }));
       
       this.exams = this.exams.filter(e => (e.questions?.length || 0) > 0);
       
       this.extractCategories();
       this.filteredExams = this.exams;
       this.currentView = 'list';

       // Handle Query Params
       const categoryParam = params['category'];
       if (categoryParam) {
           const paramLower = categoryParam.toLowerCase();

           // 1. Try exact Title match
           const exactTitleMatch = this.exams.find(e => e.title.toLowerCase() === paramLower);
           if (exactTitleMatch) {
               this.selectExam(exactTitleMatch);
               this.cd.markForCheck(); // Force update
               return;
           }

           // 2. Try Category match
           const categoryExams = this.exams.filter(e => e.category?.toLowerCase() === paramLower);
           if (categoryExams.length > 0) {
               if (categoryExams.length === 1) {
                   // Only one exam in this category, go directly
                   this.selectExam(categoryExams[0]);
               } else {
                   // Multiple exams, show filter list
                   this.selectCategory(categoryExams[0].category!);
               }
               this.cd.markForCheck(); // Force update
               return;
           }
       }
       this.cd.markForCheck(); // Force update for list view
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
      this.destroy$.next();
      this.destroy$.complete();
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

    // Fetch all sections and lessons for the parts
    this.allSections = [];
    this.allLessons = [];
    for (const part of this.parts) {
        if (part.id !== -1) {
             const sections = await this.examService.getSections(part.id);
             this.allSections.push(...sections);
             for (const section of sections) {
                 const lessons = await this.examService.getLessons(section.id);
                 this.allLessons.push(...lessons);
             }
        }
    }
    
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

  proceedToConfig() {
      if(this.selectedParts.size === 0) {
          this.showAlert('Please select at least one part to start.', 'Selection Required');
          return;
      }
      
      const examQuestions = this.selectedExam?.questions || [];
      this.filteredQuestions = examQuestions.filter(q => {
          const pId = q.partId || -1; 
          const effectivePartId = q.partId ? q.partId : -1; 
          return this.selectedParts.has(effectivePartId);
      });

      if (this.filteredQuestions.length === 0) {
          this.showAlert('No questions available in the selected parts.', 'Empty Selection');
          return;
      }

      this.extractTopics();
      this.configView = true;
      this.currentView = 'parts';
      this.maxQuestionsAvailable = this.filteredQuestions.length;
      this.configQuestionCount = Math.min(10, this.maxQuestionsAvailable);
      this.selectAllTopics();
  }

  isPartSelected(part: any): boolean {
      if (!part.sections || part.sections.length === 0) return false;
      return part.sections.every((s: any) => this.isSectionSelected(s));
  }

  isPartIndeterminate(part: any): boolean {
      if (!part.sections || part.sections.length === 0) return false;
      const allTopics = part.sections.flatMap((s: any) => s.topics);
      const selectedCount = allTopics.filter((t: any) => this.selectedTopics.has(t.key)).length;
      return selectedCount > 0 && selectedCount < allTopics.length;
  }

  togglePart(part: any) {
      if (this.isPartSelected(part)) {
          part.sections.forEach((s: any) => {
              s.topics.forEach((t: any) => this.selectedTopics.delete(t.key));
          });
      } else {
          part.sections.forEach((s: any) => {
              s.topics.forEach((t: any) => this.selectedTopics.add(t.key));
          });
      }
      this.updateMaxQuestions();
  }

  isSectionSelected(section: any): boolean {
      if (!section.topics || section.topics.length === 0) return false;
      return section.topics.every((t: any) => this.selectedTopics.has(t.key));
  }

  isSectionIndeterminate(section: any): boolean {
      if (!section.topics || section.topics.length === 0) return false;
      const selectedCount = section.topics.filter((t: any) => this.selectedTopics.has(t.key)).length;
      return selectedCount > 0 && selectedCount < section.topics.length;
  }

  toggleSection(section: any) {
      if (this.isSectionSelected(section)) {
          section.topics.forEach((t: any) => this.selectedTopics.delete(t.key));
      } else {
          section.topics.forEach((t: any) => this.selectedTopics.add(t.key));
      }
      this.updateMaxQuestions();
  }

  extractTopics() {
      const hierarchy = new Map<string, Map<string, Map<string, string>>>();
      
      this.filteredQuestions.forEach(q => {
          let partName = 'General';
          let sectionName = 'Other';
          let topicKey = 'General';
          let topicLabel = 'General Review';
          
          const effectivePartId = q.partId ? q.partId : -1;
          const part = this.parts.find(p => p.id === effectivePartId);
          if (part) partName = part.title;

          if (q.lessonId) {
             const lesson = this.allLessons.find(l => l.id === q.lessonId);
             if (lesson) {
                 topicKey = `lesson_${lesson.id}`;
                 topicLabel = lesson.title;
                 const section = this.allSections.find(s => s.id === lesson.sectionId);
                 if (section) sectionName = section.title;
             }
          } else if (q.topic) {
             topicKey = q.topic;
             topicLabel = q.topic;
          }
          
          Object.assign(q, { computedTopicKey: topicKey });
          
          if (!hierarchy.has(partName)) hierarchy.set(partName, new Map());
          const partMap = hierarchy.get(partName)!;
          
          if (!partMap.has(sectionName)) partMap.set(sectionName, new Map());
          partMap.get(sectionName)!.set(topicKey, topicLabel);
      });
      
      this.availableTopics = Array.from(hierarchy.entries()).map(([partName, sectionsMap]) => ({
          partName,
          sections: Array.from(sectionsMap.entries()).map(([sectionName, topicsMap]) => ({
              sectionName,
              topics: Array.from(topicsMap.entries()).map(([key, label]) => ({ key, label }))
          }))
      })); 
  }

  toggleTopic(topicObj: any) {
      const key = topicObj.key || topicObj;
      if (this.selectedTopics.has(key)) {
          this.selectedTopics.delete(key);
      } else {
          this.selectedTopics.add(key);
      }
      this.updateMaxQuestions();
  }

  selectAllTopics() {
      const allKeys: string[] = [];
      for (const part of this.availableTopics) {
          for (const section of part.sections) {
              for (const t of section.topics) {
                  allKeys.push(t.key);
              }
          }
      }
      this.selectedTopics = new Set(allKeys);
      this.updateMaxQuestions();
  }

  updateMaxQuestions() {
      const count = this.filteredQuestions.filter((q: any) => this.selectedTopics.has(q.computedTopicKey || 'General')).length;
      this.maxQuestionsAvailable = count;
      if (this.configQuestionCount > count) {
          this.configQuestionCount = count;
      }
  }

  startCustomPractice() {
      if (this.selectedTopics.size === 0) {
          this.showAlert('Please select at least one topic/lesson.');
          return;
      }

      if (this.configQuestionCount < 1) {
          this.showAlert('Please select at least one question.');
          return;
      }

      let sessionQuestions = this.filteredQuestions.filter((q: any) => this.selectedTopics.has(q.computedTopicKey || 'General'));
      sessionQuestions = sessionQuestions.sort(() => Math.random() - 0.5);
      sessionQuestions = sessionQuestions.slice(0, this.configQuestionCount);

      this.configView = false;
      this.tutorMode = this.configMode === 'tutor';
      this.startExam(sessionQuestions);
  }

  cancelConfig() {
      this.configView = false;
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
  
      if (this.configTimerEnabled) {
          let totalDuration = 0;
          this.selectedParts.forEach(partId => {
              const part = this.parts.find(p => p.id === partId);
              if (part && part.duration && part.duration > 0) {
                  totalDuration += Number(part.duration);
              } else {
                  const pCount = this.parts.find(p => p.id === partId)?.questionCount || 0;
                  totalDuration += Math.ceil(pCount * 1.5);
              }
          });
          this.remainingTime = totalDuration * 60;
          this.startTimer();
      } else {
          this.stopTimer();
          this.remainingTime = 0;
      }
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
      if (this.tutorMode && this.filteredQuestions[this.currentQuestionIndex].selectedAnswer !== undefined) {
         return; // Lock answer in tutor mode
      }
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
