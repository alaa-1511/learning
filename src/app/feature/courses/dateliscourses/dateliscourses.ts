import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dateliscourses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dateliscourses.html',
  styleUrl: './dateliscourses.css',
})
export class Dateliscourses {
  course = {
    title: 'CIA Part 1: Essentials of Internal Auditing',
    subtitle: 'Master the foundations of internal auditing with our comprehensive CIA Part 1 preparation course.',
    rating: 4.8,
    reviews: 245,
    students: 1850,
    lastUpdated: '12/2025',
    language: 'English',
    price: 199,
    originalPrice: 299,
    discount: 33,
    image: '/courses/img mealify1.jfif',
    instructor: {
      name: 'Dr.Moamen Zakaria',
      title: 'Certified Internal Auditor & CPA',
      image: '/courses/img mealify2.jfif',
      bio: 'Dr.Moamen is a seasoned auditor with over 15 years of experience in Fortune 500 companies. She has helped thousands of students pass their CIA exams.'
    },
    whatYouWillLearn: [
      'Understand the foundations of internal auditing',
      'Master independence and objectivity concepts',
      'Learn detailed proficiency and due professional care',
      'Quality assurance and improvement programs',
      'Governance, risk management, and control',
      'Fraud risks and controls'
    ],
    curriculum: [
      {
        title: 'Section 1: Foundations of Internal Auditing',
        lectures: 5,
        duration: '2h 15m'
      },
      {
        title: 'Section 2: Independence and Objectivity',
        lectures: 4,
        duration: '1h 45m'
      },
      {
        title: 'Section 3: Proficiency and Due Professional Care',
        lectures: 6,
        duration: '3h 10m'
      },
      {
        title: 'Section 4: Quality Assurance and Improvement',
        lectures: 3,
        duration: '1h 30m'
      }
    ]
  };
}
