import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastrService } from 'ngx-toastr';

export interface StudentReport {
  id?: string;
  student_email: string;
  student_name: string;
  exam_title: string;
  parts_practiced: string;
  questions_solved: number;
  score: number;
  percentage: number;
  practice_mode: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private supabaseService: SupabaseService,
    private toastr: ToastrService
  ) { }

  async saveReport(report: StudentReport): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('student_reports')
      .insert(report);

    if (error) {
      console.error('Error saving report:', error);
      // We don't want to alert the user aggressively if saving a report fails, just log it.
    }
  }

  async getAllReports(): Promise<StudentReport[]> {
    const { data, error } = await this.supabaseService.client
      .from('student_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error.message || error);
      this.toastr.error('Failed to load reports: ' + (error.message || 'Unknown error'));
      return [];
    }

    return data || [];
  }
}
