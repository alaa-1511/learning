
import { Component, OnInit } from '@angular/core';
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
    private fb: FormBuilder
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
    return this.fb.group({
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
  }

  createOptionControl(value: string = '') { 
    return this.fb.control(value, Validators.required);
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
    
    this.isCreatingCourse = false;
    this.imagePreview = null;

    const optionsArray = this.questionForm.get('options') as FormArray;
    optionsArray.clear();
    question.options.forEach(opt => {
        optionsArray.push(this.createOptionControl(opt));
    });

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

  saveQuestion() {
    this.submitted = true;

    if (this.questionForm.invalid) {
      // Allow saving if creating new course effectively
      if(this.questionForm.get('courseId')?.value === 'new' && (!this.questionForm.get('newCourseTitle')?.value || !this.questionForm.get('newCourseImage')?.value)) {
           return;
      }
       // If standard validation fails (excluding courseId if it's 'new' which technically isn't a number)
       if(this.questionForm.get('courseId')?.value !== 'new' && this.questionForm.invalid) return;
    }

    const formValue = this.questionForm.value;
    let finalCourseId = formValue.courseId;

    // Handle New Course Creation
    if (finalCourseId === 'new') { 
        if (!formValue.newCourseTitle || !formValue.newCourseImage) return;

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
        
        // We need to add logic to get the ID back or handle async.
        // Since the service updates the subject synchronously, this.courses (subscribed) should be updated.
        this.courseService.addCourse(newCourse);
        
        // Get the last added course from the updated local list
        const allCourses = this.courses;
        // Verify we have courses, otherwise fallback (shouldn't happen if add worked)
        finalCourseId = allCourses.length > 0 ? allCourses[allCourses.length - 1].id : 0;
    }

    const questionData: Question = {
      id: this.isEditMode ? (this.currentQuestionId as number) : 0,
      text: formValue.text,
      type: formValue.type,
      options: formValue.type === 'essay' ? [] : formValue.options,
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
      this.questionService.updateQuestion(questionData);
    } else {
      this.questionService.addQuestion(questionData);
    }

    this.questionDialog = false;
    this.questionForm.reset();
    this.isCreatingCourse = false;
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
}
