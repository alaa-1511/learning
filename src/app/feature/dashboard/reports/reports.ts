import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportService, StudentReport } from '../../../core/service/report.service';
import { NgxPaginationModule } from 'ngx-pagination';

export interface StudentGroup {
  student_email: string;
  student_name: string;
  total_exams: number;
  average_score: number;
  reports: StudentReport[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NgxPaginationModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  providers: [DatePipe]
})
export class Reports implements OnInit {
  rawReports: StudentReport[] = [];
  studentGroups: StudentGroup[] = [];
  filteredGroups: StudentGroup[] = [];
  
  isLoading: boolean = false;
  p: number = 1; // Pagination current page
  searchTerm: string = '';
  errorMessage: string = ''; // Hold any error text to show on screen

  constructor(private reportService: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadReports();
  }

  async loadReports() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // force view to show loading

    try {
      this.rawReports = await this.reportService.getAllReports();
      this.groupReports();
    } catch (err: any) {
      console.error('CRITICAL ERROR in loadReports:', err);
      this.errorMessage = err.message || err.toString() || 'Unknown Error Occurred';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges(); // force view to show loading=false regardless of error
    }
  }

  groupReports() {
    const groupMap = new Map<string, StudentGroup>();

    this.rawReports.forEach(report => {
      const email = report.student_email || 'unknown';
      if (!groupMap.has(email)) {
        groupMap.set(email, {
          student_email: email,
          student_name: report.student_name || 'Unknown Student',
          total_exams: 0,
          average_score: 0,
          reports: [],
          isExpanded: false
        });
      }

      const group = groupMap.get(email)!;
      group.reports.push(report);
      group.total_exams++;
    });

    // Calculate averages and convert to array
    this.studentGroups = Array.from(groupMap.values()).map(group => {
      const totalPercentage = group.reports.reduce((sum, r) => sum + (r.percentage || 0), 0);
      group.average_score = group.total_exams > 0 ? Math.round(totalPercentage / group.total_exams) : 0;
      return group;
    });

    // Sort groups alphabetically by name
    this.studentGroups.sort((a, b) => a.student_name.localeCompare(b.student_name));
    
    this.filteredGroups = [...this.studentGroups];
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    if (!this.searchTerm) {
      this.filteredGroups = [...this.studentGroups];
    } else {
      const term = this.searchTerm.trim();
      this.filteredGroups = this.studentGroups.filter(group => {
        const nameMatch = group.student_name ? group.student_name.toLowerCase().includes(term) : false;
        const emailMatch = group.student_email ? group.student_email.toLowerCase().includes(term) : false;
        return nameMatch || emailMatch;
      });
    }
    this.p = 1; // Reset to first page
  }

  toggleExpand(group: StudentGroup) {
    group.isExpanded = !group.isExpanded;
  }
}

