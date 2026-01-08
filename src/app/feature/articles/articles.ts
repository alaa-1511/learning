import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  category: string;
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class Articles {
  articles = signal<Article[]>([
    {
      id: 1,
      title: 'ARTICLES_PAGE.LIST.ARTICLE1.TITLE',
      excerpt: 'ARTICLES_PAGE.LIST.ARTICLE1.EXCERPT',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 15, 2025',
      author: 'Sarah Johnson',
      category: 'ARTICLES_PAGE.LIST.ARTICLE1.CATEGORY'
    },
    {
      id: 2,
      title: 'ARTICLES_PAGE.LIST.ARTICLE2.TITLE',
      excerpt: 'ARTICLES_PAGE.LIST.ARTICLE2.EXCERPT',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 12, 2025',
      author: 'Michael Chen',
      category: 'ARTICLES_PAGE.LIST.ARTICLE2.CATEGORY'
    },
    {
      id: 3,
      title: 'ARTICLES_PAGE.LIST.ARTICLE3.TITLE',
      excerpt: 'ARTICLES_PAGE.LIST.ARTICLE3.EXCERPT',
      image: 'https://images.unsplash.com/photo-1586486855514-8c633cc6fd38?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 08, 2025',
      author: 'Jessica Williams',
      category: 'ARTICLES_PAGE.LIST.ARTICLE3.CATEGORY'
    },
    {
      id: 4,
      title: 'ARTICLES_PAGE.LIST.ARTICLE4.TITLE',
      excerpt: 'ARTICLES_PAGE.LIST.ARTICLE4.EXCERPT',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 05, 2025',
      author: 'David Smith',
      category: 'ARTICLES_PAGE.LIST.ARTICLE4.CATEGORY'
    },
    {
      id: 5,
      title: 'ARTICLES_PAGE.LIST.ARTICLE5.TITLE',
      excerpt: 'ARTICLES_PAGE.LIST.ARTICLE5.EXCERPT',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
      date: 'Sep 28, 2025',
      author: 'Emily Davis',
      category: 'ARTICLES_PAGE.LIST.ARTICLE5.CATEGORY'
    },
     {
      id: 6,
      title: 'ARTICLES_PAGE.LIST.ARTICLE6.TITLE',
      excerpt: 'ARTICLES_PAGE.LIST.ARTICLE6.EXCERPT',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',
      date: 'Sep 22, 2025',
      author: 'Robert Wilson',
      category: 'ARTICLES_PAGE.LIST.ARTICLE6.CATEGORY'
    },
  ]);
}
