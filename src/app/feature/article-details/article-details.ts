import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ArticleService, Article } from '../../core/service/article.service';

@Component({
  selector: 'app-article-details',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './article-details.html'
})
export class ArticleDetails {
  private route = inject(ActivatedRoute);
  private articleService = inject(ArticleService);
  
  article: Article | undefined;

  ngOnInit() {
      this.route.paramMap.subscribe(params => {
          const id = params.get('id');
          if (id) {
              this.article = this.articleService.getArticleById(Number(id));
          }
      });
  }
}
