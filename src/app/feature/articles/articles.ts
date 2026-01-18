import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ArticleService } from '../../core/service/article.service';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class Articles {
  private articleService = inject(ArticleService);
  articles = this.articleService.articles;
}

