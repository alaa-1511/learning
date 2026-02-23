import { Component, Input, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../core/service/question.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SupabaseService } from '../../core/service/supabase.service';

import { ExamService, ExamPart, Exam, ExamSection, ExamLesson } from '../../core/service/exam.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ReportService, StudentReport } from '../../core/service/report.service';
import { ContactService } from '../../core/service/contact';

interface ExamQuestion extends Question {
  selectedAnswer?: number; // User's selected option index
  studentAnswer?: string; // For Essay questions
  computedTopicKey?: string; // Appended for mapping topic to lesson
}


@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule, DialogModule],
  templateUrl: './questions.html',
  styleUrl: './questions.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Questions implements OnInit, OnDestroy {
  // State: 'categories' | 'list' | 'parts' | 'exam' | 'result'
  currentView: 'categories' | 'list' | 'parts' | 'exam' | 'result' = 'list';
    @Input() mini: boolean = false;

  exams: Exam[] = [];
  filteredExams: Exam[] = []; // Exams filtered by category
  parts: ExamPart[] = [];
  categories: { name: string, image: string, count: number, description?: string }[] = [];

  selectedCategory: string | null = null;
  selectedExam: Exam | null = null;
  
  // Multi-select parts
  selectedParts: Set<number> = new Set(); 
  
  // Loaded hierarchy for selected exam
  allSections: ExamSection[] = [];
  allLessons: ExamLesson[] = [];

  filteredQuestions: ExamQuestion[] = []; // Questions for the selected part(s)

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

  // Practice Mode Config State
  configView: boolean = false;
  availableTopics: any[] = [];
  selectedTopics: Set<string> = new Set();
  configQuestionCount: number = 10;
  configTimerEnabled: boolean = false;
  configMode: 'tutor' | 'exam' = 'exam';
  tutorMode: boolean = false;
  maxQuestionsAvailable: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private questionService: QuestionService, 
    private examService: ExamService,
    private router: Router,
    private route: ActivatedRoute, // Re-inject ActivatedRoute
    private cd: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private supabaseService: SupabaseService,
    private reportService: ReportService,
    private contactService: ContactService,
    private translate: TranslateService
  ) {}

  safeHtml(content: string | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content || '');
  }

  ngOnInit() {
    this.loadData();
  }

  expirationTimeouts: any[] = []; // Array to store timeout references
  sessionWarningsShown: Set<number> = new Set(); // Prevent spamming alerts in one session

  async loadData() {
      this.clearExpirationTimeouts(); // Clear old timeouts before reloading

      // 1. Get Current User (Local Session is faster/no spinner)
      const { data: { session } } = await this.supabaseService.client.auth.getSession();
      this.currentUser = session?.user || null;

      // 2. Fetch assignments if user exists
      if (this.currentUser && this.currentUser.email) {
          const assignments = await this.examService.getStudentAssignments(this.currentUser.email);
          this.userAssignments = assignments || [];
          
          this.setupRealtimeSubscription(this.currentUser.email);
      }

      // 3. Combine Streams
      combineLatest([
        this.questionService.questions$,
        this.examService.exams$,
        this.route.queryParams 
      ]).pipe(
        takeUntil(this.destroy$)
      ).subscribe(([questions, exams, params]) => {
          if (!questions || !exams) return;

          // Filter for Active, Testbank Questions
          const testbankQuestions = (questions as any[])
            .filter(q => q.status === 'Active' && (!q.targetPage || q.targetPage === 'testbank'))
            .map(q => ({
                ...q,
                type: q.type.toLowerCase() as any
            })) as ExamQuestion[];

          this.exams = (exams as any[]).map(exam => ({
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
          
          this.exams = this.exams.filter(e => (e.questions?.length || 0) > 0);
          
          this.processAssignmentsAndFilterExams();

           // Handle Query Params (Deep Linking)
           const categoryParam = (params as any)['category'];
           if (categoryParam) {
               const paramLower = categoryParam.toLowerCase();

               // 1. Try exact Title match
               const exactTitleMatch = this.exams.find(e => e.title.toLowerCase() === paramLower);
               if (exactTitleMatch) {
                   this.selectExam(exactTitleMatch); // Removed await
                   this.cd.markForCheck(); // Force update
                   return;
               }

               // 2. Try Category match
               const categoryExams = this.exams.filter(e => e.category?.toLowerCase() === paramLower);
               if (categoryExams.length > 0) {
                   if (categoryExams.length === 1) {
                       // Only one exam in this category, go directly
                       this.selectExam(categoryExams[0]); // Removed await
                   } else {
                       // Multiple exams (e.g. Parts), show the list filtered by category
                       this.selectCategory(categoryExams[0].category!);
                   }
                   this.cd.markForCheck(); // Force update
                   return;
               }
           }
           
           this.cd.markForCheck(); // Force update for list view
      });
  }

  private processAssignmentsAndFilterExams() {
      // Filter Exams: Show assigned ones if user has assignments
      let visibleExams = this.exams;
      if (this.currentUser && this.userAssignments.length > 0) {
          const now = new Date();
          
          this.clearExpirationTimeouts(); // Clear before setting new ones
          
          // Filter out expired assignments and set timeouts for upcoming expirations
          this.userAssignments = this.userAssignments.filter(a => {
              if (!a.expires_at) return true;
              
              const expirationDate = new Date(a.expires_at);
              if (expirationDate > now) {
                  const msUntilExpiration = expirationDate.getTime() - now.getTime();
                  const daysUntilExpiration = msUntilExpiration / (1000 * 60 * 60 * 24);

                  // Set a timeout to instantly hide this when time rests
                  // Only set timeout if it's within the maximum integer size for setTimeout (~24.8 days)
                  if (msUntilExpiration <= 2147483647) {
                       const timeout = setTimeout(() => {
                           console.log(`Assignment expired locally: Course ${a.course_id}`);
                           // Re-evaluate assignments after one expires
                           // Invalidate this particular assignment locally
                           this.userAssignments = this.userAssignments.filter(ua => ua.id !== a.id);
                           this.processAssignmentsAndFilterExams(); 
                       }, msUntilExpiration);
                       this.expirationTimeouts.push(timeout);
                  }

                  // 7-day warning logic
                  if (daysUntilExpiration <= 7) {
                      const courseName = this.exams.find(e => Number(e.id) === Number(a.course_id))?.title || a.course_id;
                      
                      // 1. Show Website Alert once per session for expiring
                      if (!this.sessionWarningsShown.has(a.id)) {
                          const msg = this.translate.instant('QUESTIONS.ALERTS.EXPIRING_SOON_MSG', { courseName: courseName });
                          const title = this.translate.instant('QUESTIONS.ALERTS.EXPIRING_SOON_TITLE');
                          this.showAlert(msg, title);
                          this.sessionWarningsShown.add(a.id);
                      }

                      // 2. Send Email Warning (Only if not already sent in DB)
                      if (!a.warning_email_sent) {
                          this.sendExpirationEmailWarning(a, courseName);
                      }
                  }

                  return true; 
              }
              return false; // Expired
          });

          const assignedCourseIds = new Set(this.userAssignments.map(a => a.course_id));
          visibleExams = this.exams.filter(e => assignedCourseIds.has(e.id));
          
          // If User is currently viewing a specific category/list, we should also check if the selected
          // course or parts suddenly became unavailable.
          if (this.selectedExam && !assignedCourseIds.has(this.selectedExam.id)) {
              this.showAlert(this.translate.instant('QUESTIONS.ALERTS.EXPIRED_MSG'), this.translate.instant('QUESTIONS.ALERTS.EXPIRED_TITLE'));
              this.backToExams();
          }
      } else if (this.currentUser) {
           // Logged in but no assignments
           visibleExams = [];
           if (this.currentView === 'parts' || this.currentView === 'exam') {
               this.showAlert(this.translate.instant('QUESTIONS.ALERTS.EXPIRED_MSG'), this.translate.instant('QUESTIONS.ALERTS.EXPIRED_TITLE'));
               this.backToExams();
           }
      }
      this.filteredExams = visibleExams;
      this.extractCategories();
      
      // Keep category filter active if assigned
      if (this.selectedCategory) {
          this.filteredExams = this.filteredExams.filter(e => e.category === this.selectedCategory);
      }

      this.cd.detectChanges();
  }

  private setupRealtimeSubscription(email: string) {
       // Subscribe to inserts and deletes on 'student_assignments' for this user
       this.supabaseService.client
         .channel('public:student_assignments')
         .on(
           'postgres_changes',
           { event: '*', schema: 'public', table: 'student_assignments', filter: `student_email=eq.${email}` },
           async (payload) => {
               console.log('Realtime assignment change received:', payload);
               this.examService.clearAssignmentCache(); // MUST call to get fresh data
               // Re-fetch everything safely
               const assignments = await this.examService.getStudentAssignments(email);
               this.userAssignments = assignments || [];
               // Re-process view
               this.processAssignmentsAndFilterExams();
           }
         )
         .subscribe();
  }

  private async sendExpirationEmailWarning(assignment: any, courseName: string) {
      if (!this.currentUser || !this.currentUser.email) return;

      const templateParams = {
          to_name: this.currentUser.user_metadata?.full_name || 'طالبنا العزيز',
          to_email: this.currentUser.email,
          course_id: courseName, // Pass the course name using the course_id field or rename later if needed
          message: this.translate.instant('QUESTIONS.ALERTS.WARNING_EMAIL_MSG')
      };

      try {
          // 1. Send Email using Contact Service with the specific student template
          await this.contactService.sendEmail(templateParams, 'template_tvbr4vz');
          
          // 2. Mark as sent in DB to prevent duplicate emails
          const { error } = await this.supabaseService.client
              .from('student_assignments')
              .update({ warning_email_sent: true })
              .eq('id', assignment.id);
              
          if (error) {
              console.error('Failed to update warning_email_sent flag in Supabase:', error);
          } else {
              // Update local state so it doesn't trigger again before refresh
              assignment.warning_email_sent = true;
          }
      } catch (err) {
          console.error('Failed to send expiration warning email:', err);
      }
  }

  private clearExpirationTimeouts() {
      this.expirationTimeouts.forEach(t => clearTimeout(t));
      this.expirationTimeouts = [];
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
      switch(category.toLowerCase()) {
          case 'math': return 'assets/images/categories/math.png';
          case 'science': return 'assets/images/categories/science.png';
          default: return '';
      }
  }

  ngOnDestroy() {
      this.stopTimer();
      this.clearExpirationTimeouts();
      // Supabase channels clean themselves up generally on reload, but good practice
      this.supabaseService.client.removeAllChannels(); 
      this.destroy$.next();
      this.destroy$.complete();
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
    this.selectedParts.clear(); // Reset selection

    // Filter Parts based on assignments (Using cached data from init)
    if (this.currentUser) {
        if (this.userAssignments.length > 0) {
            const assignedPartIds = new Set(
                this.userAssignments
                    .filter(a => Number(a.course_id) === Number(exam.id)) 
                    .map(a => Number(a.part_id))
            );
            
            if (assignedPartIds.size > 0) {
                this.parts = this.parts.filter(p => assignedPartIds.has(Number(p.id)));
            } else {
                this.parts = [];
            }
        } else {
            this.parts = [];
        }
    }
    
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
    
    // Check for orphaned questions (no part) in this exam
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
        p.durationLabel = (p.duration && p.duration > 0) ? p.duration + ' Mins' : Math.ceil(count * 1.5) + ' Mins';
    });

    if (this.parts.length === 0 && orphans.length === 0) {
         this.showAlert('No parts or questions defined for this course yet.', 'Notice');
         return;
    }

    this.currentView = 'parts';
    window.scrollTo(0,0);
  }

  // Toggle selection of a part
  togglePartSelection(part: ExamPart) {
      if (this.selectedParts.has(part.id)) {
          this.selectedParts.delete(part.id);
      } else {
          this.selectedParts.add(part.id);
      }
  }

  // Select all or deselect all
  toggleAllParts() {
      if (this.selectedParts.size === this.parts.length) {
          this.selectedParts.clear();
      } else {
          this.parts.forEach(p => this.selectedParts.add(p.id));
      }
  }

  // Proceed to configuration with selected parts
  proceedToConfig() {
      if (this.selectedParts.size === 0) {
          this.showAlert('Please select at least one part to proceed.', 'Selection Required');
          return;
      }
      
      // Determine Questions from Selected Parts
      const allQuestions = this.selectedExam?.questions || [];
      this.filteredQuestions = allQuestions.filter(q => {
          const pId = q.partId || -1; // Handle orphans map to -1
          // If partId is missing (undefined/null), treat as -1 for comparison if our orphan part is -1
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
          
          q['computedTopicKey'] = topicKey; // Store for filtering later
          
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
      })) as any; 
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
      for (const part of this.availableTopics as any[]) {
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
      const count = this.filteredQuestions.filter(q => this.selectedTopics.has(q.computedTopicKey || 'General')).length;
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

      // Filter by Topic/Lesson Key
      let sessionQuestions = this.filteredQuestions.filter(q => this.selectedTopics.has(q.computedTopicKey || 'General'));

      // Shuffle (Simple Fisher-Yates or Sort)
      sessionQuestions = sessionQuestions.sort(() => Math.random() - 0.5);

      // Slice to count
      sessionQuestions = sessionQuestions.slice(0, this.configQuestionCount);

      this.configView = false;
      this.tutorMode = this.configMode === 'tutor';
      this.startExam(sessionQuestions);
  }

  cancelConfig() {
      this.configView = false;
      // Don't clear selectedParts so user can adjust config without re-selecting
  }

  backToExams() {
      this.selectedExam = null;
      this.parts = [];
      this.selectedParts.clear();
      this.currentView = 'list';
      this.stopTimer();
  }

  backToParts() {
      // this.selectedPart = null; // No longer primary driver
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

    this.filteredQuestions = questions; // Ensure filteredQuestions is the active set

    // Initialize Timer
    if (this.configTimerEnabled) {
         // Calculate duration based on aggregated parts or default
         // If multiple parts, sum up their durations? Or just use question count rule?
         // Simplest: 1.5 mins per question
         const calculatedMinutes = Math.ceil(questions.length * 1.5);
         this.remainingTime = calculatedMinutes * 60;
         this.startTimer();
    } else {
        this.stopTimer();
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

      // Strict Mode: Can only go back or to the immediately next question if current is answered
      // Better yet: Allow navigation to any *already visited/answered* question OR the first unanswered one.
      
      let firstUnanswered = this.filteredQuestions.findIndex(q => q.selectedAnswer === undefined);
      if (firstUnanswered === -1) firstUnanswered = this.filteredQuestions.length - 1;

      if (index <= firstUnanswered) {
           this.currentQuestionIndex = index;
      } else {
           this.showAlert('You must answer previous questions before proceeding.', 'Navigation Locked');
      }
  }

  nextQuestion() {
    // STRICT MODE: Block if no answer selected
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
    // Final check for last question if manual submit
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
    
    // Save Report to Database
    this.saveReport();
  }

  saveReport() {
    if (!this.currentUser) return; // Only save if user is logged in

    // Build the string of parts practiced
    let practicedPartsDetails = 'All Parts';
    if (this.selectedParts.size > 0 && this.selectedParts.size !== this.parts.length) {
        const practicedTitles = this.parts
            .filter(p => this.selectedParts.has(p.id))
            .map(p => p.title);
        practicedPartsDetails = practicedTitles.join(', ');
    } else if (this.selectedTopics.size > 0 && this.selectedTopics.size !== this.availableTopics.length) {
        practicedPartsDetails = `Filtered Topics: ${Array.from(this.selectedTopics).join(', ')}`;
    }

    const report: StudentReport = {
      student_email: this.currentUser.email,
      student_name: this.currentUser.user_metadata?.full_name || this.currentUser.email.split('@')[0],
      exam_title: this.selectedExam?.title || 'Unknown Exam',
      parts_practiced: practicedPartsDetails,
      questions_solved: this.filteredQuestions.length,
      score: this.score,
      percentage: this.percentage,
      practice_mode: this.reviewMode ? 'Review' : (this.tutorMode ? 'Tutor' : 'Exam')
    };

    this.reportService.saveReport(report);
  }

  startReview() {
    this.currentView = 'exam';
    this.reviewMode = true;
    this.currentQuestionIndex = 0;
  }

  reset() {
    this.selectedParts.clear();
    this.backToParts();
  }
}
