import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { QuestionService, Question } from '../../../core/service/question.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard-questions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    TranslateModule
  ],
  templateUrl: './questions.html',
  styleUrls: ['./questions.css']
})
export class QuestionsManagement implements OnInit {
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  
  // Modals state
  questionDialog: boolean = false;
  deleteDialog: boolean = false;
  questionToDelete: Question | null = null;
  
  questionForm: FormGroup;
  submitted: boolean = false;
  isEditMode: boolean = false;
  currentQuestionId: number | null = null;
  
  // Pagination
  p: number = 1;

  // Filter State
  currentPartFilter: string | null = null;
  currentDiffFilter: string | null = null;
  currentSearch: string = '';

  // Options for Dropdowns
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
    private fb: FormBuilder
  ) {
    this.questionForm = this.createForm();
  }

  ngOnInit() {
    this.questionService.questions$.subscribe(data => {
      this.questions = data;
      this.applyFilters();
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required],
      type: ['multiple-choice', Validators.required],
      ciaPart: ['P1', Validators.required],
      topic: ['', Validators.required],
      difficulty: ['Medium', Validators.required],
      status: ['Active', Validators.required],
      options: this.fb.array([
        this.createOptionControl(),
        this.createOptionControl(), 
        this.createOptionControl(), 
        this.createOptionControl()
      ]),
      correctAnswer: [0, Validators.required]
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

  onPartFilter(event: any) {
    // Handling null vs string value from select
    const val = event.target.value;
    this.currentPartFilter = val === 'null' ? null : val.replace(/^\d+:\s*/, '').trim(); 
    // Note: Angular select might add index prefixes sometimes or stringify null
    // Let's rely on simple value check.
    // Actually, simple value binding in template: [ngValue]="null" works better with ngModel, 
    // but here we used (change). Let's fix the template to use [ngModel] or simple value access.
    // For standard select (change), it returns string.
    
    // Simpler approach:
    this.currentPartFilter = (val === 'null' || val === 'All Parts') ? null : val;
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
        
        const matchPart = !this.currentPartFilter || 
             // Note: event.target.value from loop might include "P1", verify logic
             // The loop uses part.value which is P1.
             q.ciaPart === this.currentPartFilter;

        const matchDiff = !this.currentDiffFilter || q.difficulty === this.currentDiffFilter;

        return matchSearch && matchPart && matchDiff;
    });
    this.p = 1; // Reset to page 1 on filter change
  }


  openNew() {
    this.questionForm.reset({
      text: '',
      type: 'multiple-choice',
      ciaPart: 'P1',
      difficulty: 'Medium',
      status: 'Active',
      correctAnswer: 0
    });
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
        ciaPart: question.ciaPart,
        topic: question.topic,
        difficulty: question.difficulty,
        status: question.status,
        correctAnswer: question.correctAnswer
    });
    
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
        // Toast logic (simplified for now) or simple alert?
        // Let's assume user just sees it disappear.
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
      return;
    }

    const formValue = this.questionForm.value;
    const questionData: Question = {
      id: this.isEditMode ? (this.currentQuestionId as number) : 0,
      text: formValue.text,
      type: formValue.type,
      options: formValue.options,
      correctAnswer: formValue.correctAnswer,
      ciaPart: formValue.ciaPart,
      topic: formValue.topic,
      difficulty: formValue.difficulty,
      status: formValue.status
    };

    if (this.isEditMode) {
      this.questionService.updateQuestion(questionData);
    } else {
      this.questionService.addQuestion(questionData);
    }

    this.questionDialog = false;
    this.questionForm.reset();
  }

  addOption() {
      this.optionsControls.push(this.createOptionControl());
  }

  removeOption(index: number) {
      this.optionsControls.removeAt(index);
  }
}
