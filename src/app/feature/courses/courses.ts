import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { RouterLink } from '@angular/router';
import { Dateliscourses } from './dateliscourses/dateliscourses';
import { TranslateModule } from '@ngx-translate/core';
import { CourseService, Course } from '../../core/service/course.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, RouterLink ,Dateliscourses, TranslateModule],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  p: number = 1;
  courses: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    this.courseService.courses$.subscribe(data => {
      this.courses = data.filter(c => c.type !== 'exam');
    });
  }
}
