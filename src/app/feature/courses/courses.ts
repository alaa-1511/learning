import { Component, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CourseService, Course } from '../../core/service/course.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule, RouterLink , TranslateModule],
  templateUrl: './courses.html',
  styleUrl: './courses.css',
})
export class Courses implements OnInit {
  p: number = 1;
  displayedCourses: any[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit() {
    combineLatest([
      this.courseService.courses$,
      this.courseService.courses2$
    ]).subscribe(([courses1, courses2]) => {
      this.updateDisplay(courses1, courses2);
    });
  }

  updateDisplay(c1: Course[], c2: Course[]) {
      const list1 = c1
        .filter(c => c.type !== 'exam')
        .map(c => ({...c, sourceType: 'standard'}));
        
      const list2 = c2.map(c => ({...c, sourceType: 'special'}));
      
      this.displayedCourses = [...list1, ...list2];
  }
}
