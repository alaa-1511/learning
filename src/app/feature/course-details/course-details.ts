import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CourseService, Course } from '../../core/service/course.service';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './course-details.html'
})
export class CourseDetails  {
  course: Course | null = null;
  isLoading = true; // Add loading state
 
  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const type = this.route.snapshot.paramMap.get('type'); // 'standard' or 'special'

    if (id) {
       try {
           if (type === 'special') {
               this.course = await this.courseService.getCourse2ById(id);
           } else {
               this.course = await this.courseService.getCourseById(id);
           }
       } catch (error) {
           console.error('Error loading course', error);
       } finally {
           this.isLoading = false;
       }
    } else {
        this.isLoading = false;
    }
  
  }
}
