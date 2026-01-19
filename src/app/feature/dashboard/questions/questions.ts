
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../../core/service/question.service';
import { CourseService, Course } from '../../../core/service/course.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule } from '@ngx-translate/core';
import { EditorModule } from 'primeng/editor';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-dashboard-questions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule,
    EditorModule,
    DialogModule
  ],
  templateUrl: './questions.html',
  styleUrls: ['./questions.css']
})
export class QuestionsManagement implements OnInit {
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  courses: Course[] = [];
  
  // View State
  viewMode: 'courses' | 'questions' = 'courses';
  selectedCourse: Course | null = null;

  // Modals state
  questionDialog: boolean = false;
  deleteDialog: boolean = false;
  examSettingsDialog: boolean = false;
  deleteCourseDialog: boolean = false;

  questionToDelete: Question | null = null;
  
  questionForm: FormGroup;
  examSettingsForm: FormGroup;

  submitted: boolean = false;
  isEditMode: boolean = false;
  currentQuestionId: number | null = null;
  
  // Pagination
  p: number = 1;

  // Filter State
  currentCourseFilter: number | null = null;
  currentDiffFilter: string | null = null;
  currentSearch: string = '';

  // Course & Page Logic
  isCreatingCourse: boolean = false;
  imagePreview: string | ArrayBuffer | null = null;
  
  // Options for Dropdowns
  pageOptions = [
      { label: 'Page Question (Testbank)', value: 'testbank' },
      { label: 'Page Free Trial', value: 'free-trial' }
  ];

  formParts = [
      { label: 'CIA Part 1', value: 'P1' },
      { label: 'CIA Part 2', value: 'P2' },
      { label: 'CIA Part 3', value: 'P3' }
  ];

  formDifficulties = [
      { label: 'Easy', value: 'Easy' },
      { label: 'Medium', value: 'Medium' },
      { label: 'Hard', value: 'Hard' }
  ];

  formStatuses = [
      { label: 'Active', value: 'Active' },
      { label: 'Draft', value: 'Draft' },
      { label: 'Archived', value: 'Archived' }
  ];

  constructor(
    private questionService: QuestionService,
    private courseService: CourseService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {
    this.questionForm = this.createForm();
    this.examSettingsForm = this.createExamSettingsForm();
  }

  ngOnInit() {
    this.questionService.questions$.subscribe(data => {
      this.questions = data;
      this.applyFilters();
    });
    this.courseService.courses$.subscribe(data => {
        this.courses = data.filter(c => c.type === 'exam');
    });
  }

  createForm(): FormGroup {
    const form = this.fb.group({
      text: ['', Validators.required],
      type: ['multiple-choice', Validators.required],
      topic: ['', Validators.required],
      difficulty: ['Medium', Validators.required],
      status: ['Active', Validators.required],
      targetPage: ['testbank', Validators.required],
      courseId: [null, Validators.required],
      // New Course Fields (optional in form group, manually validated)
      newCourseTitle: [''],
      newCourseImage: [''],
      options: this.fb.array([
        this.createOptionControl(),
        this.createOptionControl(), 
        this.createOptionControl(), 
        this.createOptionControl()
      ]),
      correctAnswer: [0, Validators.required],
      answerExplanation: ['']
    });

    // Listen to type changes to handle validation
    form.get('type')?.valueChanges.subscribe(type => {
        this.updateValidatorsForType(type || 'multiple-choice', form);
    });

    return form;
  }

  updateValidatorsForType(type: string, form: FormGroup) {
      const optionsArray = form.get('options') as FormArray;
      const correctAnswer = form.get('correctAnswer');

      if (type === 'multiple-choice') {
          optionsArray.enable();
          correctAnswer?.enable();
          
          // Auto-populate if empty (e.g. switching back from Essay/TF)
          if (optionsArray.length === 0) {
               for(let i=0; i<4; i++) optionsArray.push(this.createOptionControl());
          }
      } else if (type === 'true-false') {
          // True/False doesn't need dynamic options input, we can handle it manually or disable validation
          // But we probably want to save 'True'/'False' as options
          optionsArray.disable(); 
          correctAnswer?.enable();
      } else {
          // Essay
          optionsArray.disable();
          correctAnswer?.disable();
      }
      this.cd.detectChanges(); // Fix for ExpressionChangedAfterItHasBeenCheckedError
  }

  createOptionControl(value: string | null = '') { 
    return this.fb.control(value || '', Validators.required);
  }
  
  get optionsControls() {
    return (this.questionForm.get('options') as FormArray);
  }

  // Filtering Logic
  onSearch(event: any) {
    this.currentSearch = event.target.value.toLowerCase();
    this.applyFilters();
  }

  onCourseFilter(event: any) {
    const val = event.target.value;
    this.currentCourseFilter = (val === 'null' || val === 'All Courses') ? null : Number(val);
    this.applyFilters();
  }

  onDifficultyFilter(event: any) {
    const val = event.target.value;
    this.currentDiffFilter = (val === 'null' || val === 'All Difficulties') ? null : val;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredQuestions = this.questions.filter(q => {
        const matchSearch = !this.currentSearch || 
            q.text.toLowerCase().includes(this.currentSearch) || 
            q.topic.toLowerCase().includes(this.currentSearch);
        
        const matchCourse = !this.currentCourseFilter || 
             q.courseId === this.currentCourseFilter;

        const matchDiff = !this.currentDiffFilter || q.difficulty === this.currentDiffFilter;

        return matchSearch && matchCourse && matchDiff;
    });
    this.p = 1; 
  }


  createExamSettingsForm(): FormGroup {
    return this.fb.group({
      courseId: [null, Validators.required],
      durationMinutes: [120, [Validators.required, Validators.min(1)]],
      questionCount: [100, [Validators.required, Validators.min(1)]],
      passingScore: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
      randomize: [true]
    });
  }

  openExamSettings() {
      // Default to first exam course for convenience or reset
      const firstExamCourse = this.courses.find(c => c.type === 'exam');
      if(firstExamCourse) {
          this.examSettingsForm.patchValue({ courseId: firstExamCourse.id });
          this.loadExamSettings(firstExamCourse.id);
      }
      this.examSettingsDialog = true;
  }

  onSettingsCourseChange(event: any) {
     const courseId = Number(event.target.value);
     this.loadExamSettings(courseId);
  }

  loadExamSettings(courseId: number) {
      const config = this.questionService.getExamConfig(courseId);
      this.examSettingsForm.patchValue(config);
  }

  deleteExamCourseConfirmation() {
      this.deleteCourseDialog = true;
  }

  deleteExamCourse() {
      const courseId = this.examSettingsForm.get('courseId')?.value;
      if (courseId) {
          this.courseService.deleteCourse(Number(courseId));
          this.deleteCourseDialog = false;
          this.examSettingsDialog = false;
          // Refresh happens via subscription update usually, but ensure 'courses' local list is updated if needed.
          // Since we subscribe to courseService.courses$, it should be automatic.
      }
  }

  saveExamSettings() {
      if (this.examSettingsForm.valid) {
          this.questionService.saveExamConfig(this.examSettingsForm.value);
          this.examSettingsDialog = false;
      
      }
  }

  openNew() {
    this.questionForm.reset({
      text: '',
      type: 'multiple-choice',
      difficulty: 'Medium',
      status: 'Active',
      correctAnswer: 0,
      answerExplanation: '',
      targetPage: 'testbank',
      courseId: null,
      newCourseTitle: '',
      newCourseImage: ''
    });
    
    // Reset validators state
    this.updateValidatorsForType('multiple-choice', this.questionForm);

    this.isCreatingCourse = false;
    this.imagePreview = null;

    const optionsArray = this.questionForm.get('options') as FormArray;
    optionsArray.clear();
    for(let i=0; i<4; i++) optionsArray.push(this.createOptionControl());

    this.submitted = false;
    this.questionDialog = true;
    this.isEditMode = false;
  }

  editQuestion(question: Question) {
    this.questionForm.patchValue({
        text: question.text,
        type: question.type,
        topic: question.topic,
        difficulty: question.difficulty,
        status: question.status,
        correctAnswer: question.correctAnswer,
        answerExplanation: question.answerExplanation,
        targetPage: question.targetPage || 'testbank',
        courseId: question.courseId || null
    });
    
    // Synchronize validators with existing type
    this.updateValidatorsForType(question.type, this.questionForm);
    
    this.isCreatingCourse = false;
    this.imagePreview = null;

    const optionsArray = this.questionForm.get('options') as FormArray;
    optionsArray.clear();
    if (question.options && question.options.length > 0) {
        question.options.forEach(opt => {
            optionsArray.push(this.createOptionControl(opt));
        });
    } else {
        // Fallback for edit if emptiness is issue (e.g. was Essay, switching to MCQ manually)
        // If type is Essay, this is fine. If type is MCQ and empty, add 4
        if (question.type === 'multiple-choice' && optionsArray.length === 0) {
             for(let i=0; i<4; i++) optionsArray.push(this.createOptionControl());
        }
    }

    this.currentQuestionId = question.id;
    this.questionDialog = true;
    this.isEditMode = true;
  }

  deleteQuestion(question: Question) {
    this.questionToDelete = question;
    this.deleteDialog = true;
  }

  confirmDelete() {
    if (this.questionToDelete) {
        this.questionService.deleteQuestion(this.questionToDelete.id);
     
        this.questionToDelete = null;
        this.deleteDialog = false;
    }
  }

  hideDialog() {
    this.questionDialog = false;
    this.submitted = false;
  }

  async saveQuestion(addAnother: boolean = false) {
    this.submitted = true;
    console.log('Attempting to save question...');
    console.log('Form Invalid:', this.questionForm.invalid);
    console.log('Form Value:', this.questionForm.getRawValue());
    console.log('Course ID Value:', this.questionForm.get('courseId')?.value);

    // Standard form validation (Text, Options, basic courseId presence)
    if (this.questionForm.invalid) {
         // Special handling for "New Course" case where courseId is 'new' (invalid number pattern maybe?)
         // but our validator is just 'required', so string 'new' is valid. 
         // Real issue is standard fields.
         // However, if courseId is 'new', we must check newCourseTitle/Image manually.
         const isNewCourse = this.questionForm.get('courseId')?.value === 'new';
         if (!isNewCourse) {
             console.log('Form invalid and NOT new course. Returning.');
             return;
         }
         // If it IS new course, we check standard fields (like Topic) + New Course Fields below.
         // If text/topic invalid, we return.
         if (this.questionForm.get('topic')?.invalid || 
             this.questionForm.get('text')?.invalid || 
             this.questionForm.get('correctAnswer')?.invalid ||
             (this.questionForm.get('type')?.value === 'multiple-choice' && this.questionForm.get('options')?.invalid)) {
             console.log('Standard fields invalid for new course. Topic/Text/CorrectAnswer/Options invalid.');
             return;
         }
    }

    // Custom Validation for New Course Creation
    if (this.questionForm.get('courseId')?.value === 'new') {
         if (!this.questionForm.get('newCourseTitle')?.value || !this.questionForm.get('newCourseImage')?.value) {
             console.log('New Course Title or Image missing.');
             return;
         }
    }

    const formValue = this.questionForm.getRawValue();
    let finalCourseId = formValue.courseId;

    // Handle New Course Creation
    if (finalCourseId === 'new') { 
        console.log('Detected new course creation');
        if (!formValue.newCourseTitle || !formValue.newCourseImage) {
            console.log('Missing title/image inside creation block');
            return;
        }

        const newCourse: Course = {
            id: 0, // Assigned by service
            title: formValue.newCourseTitle,
            category: 'COURSES.CATEGORIES.ACCOUNTING', // Default or could add field
            level: 'COURSES.LEVELS.BEGINNER', // Default
            image: formValue.newCourseImage,
            description: 'New Course Description',
            rating: 0,
            students: 0,
            price: 0,
            isFreeTrial: formValue.targetPage === 'free-trial',
            type: 'exam'
        };
        
        console.log('Adding new course:', newCourse);
        try {
            const createdId = await this.courseService.addCourse(newCourse);
            console.log('Created Course ID:', createdId);
            finalCourseId = createdId;
        } catch (error: any) {
            console.error('Failed to create course:', error);
            if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
                const projectId = 'rfvvnutdtnousxlgkvik'; // From environment
                const url = `https://supabase.com/dashboard/project/${projectId}/sql`;
                alert(`DATABASE ERROR: Tables are missing!\n\nYou must run the SQL script in Supabase.\n1. Go to: ${url}\n2. Paste the SQL code provided in the chat.\n3. Click Run.`);
                window.open(url, '_blank');
            }
            return;
        }
    }

    let finalOptions = formValue.options;
    if (formValue.type === 'true-false') {
        finalOptions = ['True', 'False'];
    } else if (formValue.type === 'essay') {
        finalOptions = [];
    }

    const questionData: Question = {
      id: this.isEditMode ? (this.currentQuestionId as number) : 0,
      text: formValue.text,
      type: formValue.type,
      options: finalOptions,
      correctAnswer: formValue.type === 'essay' ? -1 : formValue.correctAnswer,
      // ciaPart removed
      topic: formValue.topic,
      difficulty: formValue.difficulty,
      status: formValue.status,
      answerExplanation: formValue.answerExplanation,
      targetPage: formValue.targetPage,
      courseId: finalCourseId
    };

    if (this.isEditMode) {
      await this.questionService.updateQuestion(questionData);
    } else {
      await this.questionService.addQuestion(questionData);
    }

    if (addAnother) {
        // preserve context
        const context = {
            courseId: finalCourseId, // Use the resolved ID (handle 'new' case becoming real ID)
            topic: formValue.topic,
            difficulty: formValue.difficulty,
            targetPage: formValue.targetPage,
            type: formValue.type
        };

        this.submitted = false;
        this.questionForm.reset();
        
        // Reset specific creation states
        this.isCreatingCourse = false;
        this.imagePreview = null;
        
        // Restore context
        // We use setTimeout to ensure any async UI updates (like dropdown options) have a chance to settle,
        // although RxJS is sync, Angular CD is not.
        setTimeout(() => {
             this.questionForm.patchValue({
                ...context,
                status: 'Active',
                correctAnswer: 0,
                answerExplanation: '',
                // ensure new course fields are clean
                newCourseTitle: '',
                newCourseImage: ''
            });
            
            // Ensure options are ready
            this.updateValidatorsForType(context.type, this.questionForm);
            
            const optionsArray = this.questionForm.get('options') as FormArray;
            optionsArray.clear();
            if (context.type === 'multiple-choice') {
                for(let i=0; i<4; i++) optionsArray.push(this.createOptionControl());
            }
        });

        // Stay in creation mode, but switch off 'new' course mode since it's created now
        this.isEditMode = false;
        this.currentQuestionId = null;

    } else {
        this.questionDialog = false;
        this.questionForm.reset();
        this.isCreatingCourse = false;
        this.imagePreview = null;
    }
  }

  onCourseChange(event: any) {
      if (event.target.value === 'new') {
          this.isCreatingCourse = true;
          this.questionForm.patchValue({ courseId: 'new' });
      } else {
          this.isCreatingCourse = false;
      }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
        this.questionForm.patchValue({ newCourseImage: this.imagePreview });
      };
      reader.readAsDataURL(file);
    }
  }

  addOption() {
      this.optionsControls.push(this.createOptionControl());
  }

  removeOption(index: number) {
      this.optionsControls.removeAt(index);
  }

  // View Navigation
  selectCourse(course: Course) {
      this.selectedCourse = course;
      this.currentCourseFilter = course.id;
      this.viewMode = 'questions';
      this.applyFilters();
  }

  backToCourses() {
      this.selectedCourse = null;
      this.currentCourseFilter = null; // or keep it null if we want to show all questions? No, we want course view.
      this.viewMode = 'courses';
      this.p = 1;
      // Clear filters potentially, or just relies on viewMode to show correct template
  }

  getQuestionCount(courseId: number): number {
      return this.questions.filter(q => q.courseId === courseId).length;
  }
}
