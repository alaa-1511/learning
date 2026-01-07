import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './articles.html',
  styleUrl: './articles.css',
})
export class Articles {
  articles = signal<Article[]>([
    {
      id: 1,
      title: 'Introduction to Financial Accounting',
      excerpt: 'Understand the basics of financial accounting, including the balance sheet, income statement, and cash flow statement.',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 15, 2025',
      author: 'Sarah Johnson',
      category: 'Financial Accounting'
    },
    {
      id: 2,
      title: 'Mastering the CPA Exam: Tips & Strategy',
      excerpt: 'A comprehensive guide to preparing for the CPA exam, covering study schedules, resource selection, and exam day tactics.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 12, 2025',
      author: 'Michael Chen',
      category: 'Career Development'
    },
    {
      id: 3,
      title: 'Understanding Tax Regulations for 2026',
      excerpt: 'Stay updated with the latest changes in tax regulations affecting individuals and small businesses for the upcoming fiscal year.',
      image: 'https://images.unsplash.com/photo-1586486855514-8c633cc6fd38?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 08, 2025',
      author: 'Jessica Williams',
      category: 'Taxation'
    },
    {
      id: 4,
      title: 'The Role of Audit in Corporate Governance',
      excerpt: 'Explore how internal and external audits contribute to transparency, accountability, and better decision-making in organizations.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000',
      date: 'Oct 05, 2025',
      author: 'David Smith',
      category: 'Auditing'
    },
    {
      id: 5,
      title: 'Managerial Accounting: Cost Behavior',
      excerpt: 'Learn how to analyze cost behavior to make informed managerial decisions regarding pricing, production, and budgeting.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
      date: 'Sep 28, 2025',
      author: 'Emily Davis',
      category: 'Managerial Accounting'
    },
     {
      id: 6,
      title: 'Forensic Accounting: Uncovering Fraud',
      excerpt: 'Dive into the world of forensic accounting and learn techniques used to investigate financial discrepancies and fraud.',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',
      date: 'Sep 22, 2025',
      author: 'Robert Wilson',
      category: 'Forensic Accounting'
    },
  ]);
}
