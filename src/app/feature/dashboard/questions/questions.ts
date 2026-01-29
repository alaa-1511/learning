
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { QuestionService, Question, ExamConfig } from '../../../core/service/question.service';
import { ExamService, Exam, ExamPart } from '../../../core/service/exam.service';
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
  exams: Exam[] = [];
  parts: ExamPart[] = [];
  
  // View State
  viewMode: 'exams' | 'parts' | 'questions' = 'exams';
  selectedExam: Exam | null = null;
  selectedPart: ExamPart | null = null;

  // Modals state
  questionDialog: boolean = false;
  partDialog: boolean = false;
  addExamDialog: boolean = false;
  deleteDialog: boolean = false;
  examSettingsDialog: boolean = false;
  deleteExamDialog: boolean = false;
  deletePartDialog: boolean = false;

  questionToDelete: Question | null = null;
  partToDelete: ExamPart | null = null;
  
  // Alert Modal State
  alertDialogVisible: boolean = false;
  alertMessage: string = '';
  alertHeader: string = 'Notification';
  
  questionForm: FormGroup;
  partForm: FormGroup;
  examForm: FormGroup;
  examSettingsForm: FormGroup;

  submitted: boolean = false;
  isEditMode: boolean = false;
  currentQuestionId: number | null = null;
  currentPartId: number | null = null;
  
  // Pagination
  p: number = 1;

  // Filter State
  currentDiffFilter: string | null = null;
  currentSearch: string = '';
  currentTab: 'all' | 'testbank' | 'free-trial' = 'all';

  imagePreview: string | ArrayBuffer | null = null;
  
  // Options for Dropdowns
  pageOptions = [
      { label: 'Page Question (Testbank)', value: 'testbank' },
      { label: 'Page Free Trial', value: 'free-trial' }
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
    private examService: ExamService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {
    this.questionForm = this.createForm();
    this.partForm = this.createPartForm();
    this.examForm = this.createExamForm();
    this.examSettingsForm = this.createExamSettingsForm();
  }

  showAlert(message: string, header: string = 'Notification') {
      this.alertMessage = message;
      this.alertHeader = header;
      this.alertDialogVisible = true;
  }

  ngOnInit() {
    this.questionService.questions$.subscribe(data => {
      this.questions = data;
      this.applyFilters();
    });
    this.examService.exams$.subscribe(data => {
        this.exams = data;
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

  createPartForm(): FormGroup {
      return this.fb.group({
          title: ['', Validators.required],
          description: [''],
          image: ['']
      });
  }

  createExamForm(): FormGroup {
      return this.fb.group({
          title: ['', Validators.required],
          description: [''],
          image: ['', Validators.required],
          level: ['Intermediate']
      });
  }

  updateValidatorsForType(type: string, form: FormGroup) {
      const optionsArray = form.get('options') as FormArray;
      const correctAnswer = form.get('correctAnswer');

      if (type === 'multiple-choice') {
          optionsArray.enable();
          correctAnswer?.enable();
          
          if (optionsArray.length === 0) {
               for(let i=0; i<4; i++) optionsArray.push(this.createOptionControl());
          }
      } else if (type === 'true-false') {
          optionsArray.disable(); 
          correctAnswer?.enable();
      } else {
          optionsArray.disable();
          correctAnswer?.disable();
      }
      this.cd.detectChanges();
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

  onDifficultyFilter(event: any) {
    const val = event.target.value;
    this.currentDiffFilter = (val === 'null' || val === 'All Difficulties') ? null : val;
    this.applyFilters();
  }

  setTab(tab: 'all' | 'testbank' | 'free-trial') {
      this.currentTab = tab;
      this.applyFilters();
  }

  applyFilters() {
    this.filteredQuestions = this.questions.filter(q => {
        const matchSearch = !this.currentSearch || 
            q.text.toLowerCase().includes(this.currentSearch) || 
            q.topic.toLowerCase().includes(this.currentSearch);
        
        // Filter by strict hierarchy
        const matchPart = this.selectedPart ? q.partId === this.selectedPart.id : false;
        
        // Special case for General component (orphan questions within an exam)
        const matchExam = this.selectedExam && !this.selectedPart ? q.examId === this.selectedExam.id : true; 
        
        const matchDiff = !this.currentDiffFilter || q.difficulty === this.currentDiffFilter;

        // Tab filter
        let matchTab = true;
        if (this.currentTab === 'testbank') {
            matchTab = q.targetPage === 'testbank' || !q.targetPage; // Default logic
        } else if (this.currentTab === 'free-trial') {
            matchTab = q.targetPage === 'free-trial';
        }
        
        // Show questions only if a part is selected
        return this.selectedPart ? (matchSearch && matchPart && matchDiff && matchTab) : false;
    });
    this.p = 1; 
  }


  createExamSettingsForm(): FormGroup {
    return this.fb.group({
      examId: [null, Validators.required],
      durationMinutes: [120, [Validators.required, Validators.min(1)]],
      questionCount: [100, [Validators.required, Validators.min(1)]],
      passingScore: [75, [Validators.required, Validators.min(0), Validators.max(100)]],
      randomize: [true]
    });
  }

  openExamSettings() {
      if(this.selectedExam) {
          this.examSettingsForm.patchValue({ examId: this.selectedExam.id });
          this.loadExamSettings(this.selectedExam.id);
      } else {
          // If called from main view, default to first
          if(this.exams.length > 0) {
             const first = this.exams[0];
             this.examSettingsForm.patchValue({ examId: first.id });
             this.loadExamSettings(first.id);
          }
      }
      this.examSettingsDialog = true;
  }

  loadExamSettings(examId: number) {
      const config = this.questionService.getExamConfig(examId);
      this.examSettingsForm.patchValue(config);
  }

  deleteExamConfirmation() {
      this.deleteExamDialog = true;
  }

  deleteExam() {
      const examId = this.examSettingsForm.get('examId')?.value; // or selectedExam?.id
      // Better to prioritize selectedExam or passed arg
      if (this.selectedExam) {
          this.examService.deleteExam(this.selectedExam.id);
          this.deleteExamDialog = false;
          this.examSettingsDialog = false;
          this.backToExams();
      } else if (examId) {
           this.examService.deleteExam(Number(examId));
           this.deleteExamDialog = false;
           this.examSettingsDialog = false;
      }
  }
  
  // New method to delete exam from card view
  confirmDeleteExam(exam: Exam) {
      this.selectedExam = exam;
      this.deleteExamDialog = true;
  }

  saveExamSettings() {
      if (this.examSettingsForm.valid) {
          this.questionService.saveExamConfig(this.examSettingsForm.value);
          this.examSettingsDialog = false;
      
      }
  }

  // --- Exam Management ---
  openAddExam() {
      this.examForm.reset({ level: 'Intermediate' });
      this.imagePreview = null;
      this.addExamDialog = true;
      this.isEditMode = false; // Reuse flag for exam
      this.submitted = false;
  }

  editExam(exam: Exam) {
      this.examForm.patchValue({
          title: exam.title,
          description: exam.description,
          image: exam.image,
          level: exam.level || 'Intermediate'
      });
      this.imagePreview = exam.image || null;
      this.selectedExam = exam; // Temporarily set for update context
      this.isEditMode = true;
      this.addExamDialog = true;
      this.submitted = false;
  }

  addPartToExam(exam: Exam) {
      this.selectExam(exam).then(() => {
           this.openAddPart();
      });
  }

  async saveExam() {
      this.submitted = true;
      if (this.examForm.invalid) return;

      const formValue = this.examForm.value;
      
      try {
          if (this.isEditMode && this.selectedExam) {
              const updatedExam: Exam = {
                  id: this.selectedExam.id,
                  title: formValue.title,
                  description: formValue.description,
                  image: formValue.image,
                  level: formValue.level
              };
              await this.examService.updateExam(updatedExam);
          } else {
              const newExam: Omit<Exam, 'id'> = {
                  title: formValue.title,
                  description: formValue.description,
                  image: formValue.image,
                  level: formValue.level
              };
              await this.examService.addExam(newExam);
          }
          this.addExamDialog = false;
          // Refresh handled by subscription usually, but if not:
          // this.examService.loadExams(); (it's behavioral subject)
      } catch (err) {
          console.error(err);
          this.showAlert('Failed to save exam.');
      }
  }

  // --- Part Management ---
  async loadParts(examId: number) {
      const realParts = await this.examService.getParts(examId);
      
      // Check for orphaned questions (Legacy/Direct support)
      const orphanedCount = this.questions.filter(q => q.examId === examId && !q.partId).length;
      
      this.parts = [...realParts];
      
      if (orphanedCount > 0) {
          // Virtual part
          this.parts.push({
              id: -1, // Virtual ID
              examId: examId,
              title: 'General Questions',
              description: 'Questions not assigned to any specific part.',
              image: '', 
          });
      }
  }

  openAddPart() {
      this.partForm.reset();
      this.imagePreview = null;
      this.isEditMode = false;
      this.currentPartId = null;
      this.partDialog = true;
      this.submitted = false;
  }

  editPart(part: ExamPart) {
      if (part.id === -1) return; // Cannot edit virtual part
      this.partForm.patchValue({
          title: part.title,
          description: part.description,
          image: part.image,
          duration: part.duration
      });
      this.imagePreview = part.image || null;
      this.isEditMode = true;
      this.currentPartId = part.id;
      this.partDialog = true;
  }

  async savePart() {
      this.submitted = true;
      if (this.partForm.invalid) return;
      if (!this.selectedExam) return;

      const formValue = this.partForm.value;
      
      try {
          if (this.isEditMode && this.currentPartId) {
             const updatedPart: ExamPart = {
                 id: this.currentPartId,
                 examId: this.selectedExam.id,
                 title: formValue.title,
                 description: formValue.description,
                 image: formValue.image,
                 duration: formValue.duration ? Number(formValue.duration) : undefined
             };
             await this.examService.updatePart(updatedPart);
          } else {
             const newPart: Omit<ExamPart, 'id'> = {
                 examId: this.selectedExam.id,
                 title: formValue.title,
                 description: formValue.description,
                 image: formValue.image,
                 duration: formValue.duration ? Number(formValue.duration) : undefined
             };
             await this.examService.addPart(newPart);
          }
          await this.loadParts(this.selectedExam.id);
          this.partDialog = false;
      } catch (err) {
          console.error(err);
          this.showAlert('Failed to save part.');
      }
  }

  confirmDeletePart(part: ExamPart) {
      if (part.id === -1) {
          this.showAlert('Cannot delete General Questions container.');
          return;
      }
      this.partToDelete = part;
      this.deletePartDialog = true;
  }

  async deletePart() {
      if (this.partToDelete && this.selectedExam) {
          await this.examService.deletePart(this.partToDelete.id);
          await this.loadParts(this.selectedExam.id);
          this.deletePartDialog = false;
          this.partToDelete = null;
      }
  }


  // --- Questions Management ---

  openNew() {
    if (!this.selectedExam || !this.selectedPart) {
        this.showAlert('Please select an Exam and Part first.');
        return;
    }
    this.questionForm.reset({
      text: '',
      type: 'multiple-choice',
      difficulty: 'Medium',
      status: 'Active',
      correctAnswer: 0,
      answerExplanation: '',
      targetPage: this.currentTab === 'all' ? 'testbank' : this.currentTab
    });
    
    this.updateValidatorsForType('multiple-choice', this.questionForm);
    
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
        targetPage: question.targetPage || 'testbank'
    });
    
    this.updateValidatorsForType(question.type, this.questionForm);
    
    const optionsArray = this.questionForm.get('options') as FormArray;
    optionsArray.clear();
    if (question.options && question.options.length > 0) {
        question.options.forEach(opt => {
            optionsArray.push(this.createOptionControl(opt));
        });
    } else {
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
    this.partDialog = false;
    this.addExamDialog = false;
    this.submitted = false;
  }

  async saveQuestion(addAnother: boolean = false) {
    this.submitted = true;
    if (this.questionForm.invalid) return;
    if (!this.selectedExam || !this.selectedPart) return;

    const formValue = this.questionForm.getRawValue();

    let finalOptions = formValue.options;
    if (formValue.type === 'true-false') {
        finalOptions = ['True', 'False'];
    } else if (formValue.type === 'essay') {
        finalOptions = [];
    }

    // Determine IDs
    // If selectedPart is -1 (Virtual), partId is undefined or null? 
    // Usually it means direct link to exam.
    // If we support that, partId is null.
    const finalPartId = this.selectedPart.id === -1 ? undefined : this.selectedPart.id;

    const questionData: Question = {
      id: this.isEditMode ? (this.currentQuestionId as number) : 0,
      text: formValue.text,
      type: formValue.type,
      options: finalOptions,
      correctAnswer: formValue.type === 'essay' ? -1 : formValue.correctAnswer,
      topic: formValue.topic,
      difficulty: formValue.difficulty,
      status: formValue.status,
      answerExplanation: formValue.answerExplanation,
      targetPage: formValue.targetPage,
      examId: this.selectedExam.id, // NEW LINKAGE
      partId: finalPartId
    };

    if (this.isEditMode) {
      await this.questionService.updateQuestion(questionData);
    } else {
      await this.questionService.addQuestion(questionData);
    }

    if (addAnother) {
        const context = {
            topic: formValue.topic,
            difficulty: formValue.difficulty,
            targetPage: formValue.targetPage,
            type: formValue.type
        };

        this.submitted = false;
        this.questionForm.reset();
        
        setTimeout(() => {
             this.questionForm.patchValue({
                ...context,
                status: 'Active',
                correctAnswer: 0,
                answerExplanation: ''
            });
            this.updateValidatorsForType(context.type, this.questionForm);
            const optionsArray = this.questionForm.get('options') as FormArray;
            optionsArray.clear();
            if (context.type === 'multiple-choice') {
                for(let i=0; i<4; i++) optionsArray.push(this.createOptionControl());
            }
        });
        this.isEditMode = false;
        this.currentQuestionId = null;

    } else {
        this.questionDialog = false;
        this.questionForm.reset();
    }
  }

  onFileSelected(event: any, type: 'exam' | 'part' = 'exam') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.imagePreview = result;
        if (type === 'exam') {
            this.examForm.patchValue({ image: result });
        } else {
            this.partForm.patchValue({ image: result });
        }
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

  // --- View Navigation ---
  async selectExam(exam: Exam) {
      this.selectedExam = exam;
      this.selectedPart = null;
      await this.loadParts(exam.id);
      this.viewMode = 'parts';
  }

  selectPart(part: ExamPart) {
      this.selectedPart = part;
      this.viewMode = 'questions';
      this.applyFilters();
  }

  backToExams() {
      this.selectedExam = null;
      this.selectedPart = null;
      this.viewMode = 'exams';
  }

  backToParts() {
      this.selectedPart = null;
      this.viewMode = 'parts';
  }

  getQuestionCount(examId: number): number {
      return this.questions.filter(q => q.examId === examId).length;
  }
  
  getPartQuestionCount(partId: number): number {
      if (partId === -1 && this.selectedExam) {
          return this.questions.filter(q => q.examId === this.selectedExam?.id && !q.partId).length;
      }
      return this.questions.filter(q => q.partId === partId).length;
  }
}
