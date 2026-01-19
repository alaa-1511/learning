import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArticleService {
  private articlesSignal = signal<Article[]>([]);

  constructor(private supabaseService: SupabaseService) {
    this.loadArticles();
  }

  get articles() {
    return this.articlesSignal.asReadonly();
  }

  private async loadArticles() {
    const { data, error } = await this.supabaseService.client
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading articles:', error);
      return;
    }

    this.articlesSignal.set(data as Article[]);
  }

  getArticleById(id: number): Article | undefined {
    return this.articlesSignal().find(a => a.id === Number(id));
  }

  async addArticle(article: Omit<Article, 'id'>) {
    const { data, error } = await this.supabaseService.client
      .from('articles')
      .insert(article)
      .select()
      .single();

    if (error) {
      console.error('Error adding article:', error);
      return;
    }

    this.articlesSignal.update(list => [data, ...list]);
  }

  async updateArticle(updatedArticle: Article) {
    const { error } = await this.supabaseService.client
      .from('articles')
      .update(updatedArticle)
      .eq('id', updatedArticle.id);

    if (error) {
      console.error('Error updating article:', error);
      return;
    }

    this.articlesSignal.update(list => 
      list.map(a => a.id === updatedArticle.id ? updatedArticle : a)
    );
  }

  async deleteArticle(id: number) {
    const { error } = await this.supabaseService.client
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
       console.error('Error deleting article:', error);
       return;
    }

    this.articlesSignal.update(list => list.filter(a => a.id !== id));
  }
}
