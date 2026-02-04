import { Component, OnInit, effect, Injector, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ArticleService, Article } from '../../../core/service/article.service';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { Button } from "primeng/button";

@Component({
  selector: 'app-articles-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, ReactiveFormsModule, DialogModule, Button],
  templateUrl: './articles.html'
})
export class Articles implements OnInit {
  private injector = inject(Injector);
  articles: Article[] = [];
  
  // Article Dialog State
  articleDialog: boolean = false;
  articleForm: FormGroup;
  editingId: number | null = null;
  
  // Delete Dialog State
  deleteDialogVisible: boolean = false;
  deleteId: number | null = null;

  constructor(
    private articleService: ArticleService,
    private fb: FormBuilder
  ) {
      this.articleForm = this.fb.group({
          title: ['', Validators.required],
          excerpt: ['', Validators.required],
          image: ['', Validators.required],
          content: ['', Validators.required],
          category: ['', Validators.required],
          author: ['', Validators.required],
          date: [new Date().toISOString().split('T')[0], Validators.required]
      });

      // Reactively update articles whenever the signal changes
      effect(() => {
        this.articles = this.articleService.articles();
      }, { injector: this.injector });
  }

  ngOnInit() {
      // Logic handled by effect now
  }

  // Getter to always have fresh data 
  get currentArticles() {
      return this.articleService.articles();
  }

  openNew() {
      this.articleDialog = true;
      this.editingId = null;
      this.articleForm.reset({
          date: new Date().toISOString().split('T')[0]
      });
  }

  editArticle(article: Article) {
      this.articleDialog = true;
      this.editingId = article.id;
      this.articleForm.patchValue({
          title: article.title,
          excerpt: article.excerpt,
          image: article.image,
          content: article.content,
          category: article.category,
          author: article.author,
          date: article.date 
      });
  }
  
  onFileSelected(event: any) {
      const file: File = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
              const base64Image = e.target.result;
              this.articleForm.patchValue({
                  image: base64Image
              });
          };
          reader.readAsDataURL(file);
      }
  }

  async saveArticle() {
      if (this.articleForm.valid) {
          const val = this.articleForm.value;
          
          if (this.editingId) {
              await this.articleService.updateArticle({
                  id: this.editingId,
                  ...val
              });
          } else {
              await this.articleService.addArticle(val);
          }
          this.articleDialog = false;
      }
  }

  confirmDeleteDialog(id: number) {
      this.deleteDialogVisible = true;
      this.deleteId = id;
  }

  confirmDelete() {
      if (this.deleteId) {
          this.articleService.deleteArticle(this.deleteId);
          this.deleteDialogVisible = false;
          this.deleteId = null;
      }
  }
}
