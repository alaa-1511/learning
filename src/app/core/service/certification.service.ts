import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Certificate {
  id: string; 
  studentName: string;
  courseId: number;
  courseName: string;
  issueDate: Date;
  expiryDate?: Date;
  status: 'Active' | 'Revoked' | 'Pending';
  templateId?: number; // link to a design template if needed
}

@Injectable({
  providedIn: 'root'
})
export class CertificationService {
  private certificatesSubject = new BehaviorSubject<Certificate[]>([]);
  public certificates$ = this.certificatesSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
      this.loadCertificates();
  }

  async getCertificateById(id: string): Promise<Certificate | null> {
      try {
          const { data, error } = await this.supabaseService.client
              .from('certificates')
              .select('*')
              .eq('certificate_id', id) // match your DB column name
              .single();

          if (error) {
              console.error('Error fetching certificate:', error);
              return null;
          }
          
          if (data) {
              return {
                  id: data.certificate_id,
                  studentName: data.student_name,
                  courseId: data.course_id,
                  courseName: data.course_name,
                  issueDate: new Date(data.issue_date),
                  expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
                  status: data.status,
                  templateId: data.template_id
              };
          }
          
          return null;
      } catch (err) {
          console.error('Unexpected error:', err);
          return null;
      }
  }

  async loadCertificates() {
    const { data, error } = await this.supabaseService.client
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading certificates:', error);
        return;
    }

    const certs: Certificate[] = (data || []).map((c: any) => ({
        id: c.certificate_id,
        studentName: c.student_name,
        courseId: c.course_id,
        courseName: c.course_name,
        issueDate: new Date(c.issue_date),
        expiryDate: c.expiry_date ? new Date(c.expiry_date) : undefined,
        status: c.status,
        templateId: c.template_id
    }));

    this.certificatesSubject.next(certs);
  }

  async issueCertificate(cert: Omit<Certificate, 'id' | 'status'>) {
      const dbCert = {
          student_name: cert.studentName,
          course_id: cert.courseId,
          course_name: cert.courseName,
          issue_date: cert.issueDate,
          expiry_date: cert.expiryDate,
          status: 'Active',
          certificate_id: this.generateCertificateId()
      };

      const { data, error } = await this.supabaseService.client
          .from('certificates')
          .insert(dbCert)
          .select()
          .single();

      if (error) {
          console.error('Error issuing certificate:', error);
          return; // Handle error appropriately
      }

      // Update local state immediately
      const newCert: Certificate = {
          id: data.certificate_id,
          studentName: data.student_name,
          courseId: data.course_id,
          courseName: data.course_name,
          issueDate: new Date(data.issue_date),
          expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
          status: data.status,
          templateId: data.template_id
      };
      
      const currentCerts = this.certificatesSubject.value;
      this.certificatesSubject.next([newCert, ...currentCerts]);
  }

  async updateCertificate(cert: Certificate) {
      const dbCert = {
          student_name: cert.studentName,
          course_id: cert.courseId,
          course_name: cert.courseName,
          issue_date: cert.issueDate,
          expiry_date: cert.expiryDate,
          status: cert.status,
          template_id: cert.templateId
      };

      const { error } = await this.supabaseService.client
          .from('certificates')
          .update(dbCert)
          .eq('certificate_id', cert.id);

      if (error) {
          console.error('Error updating certificate:', error);
          return;
      }

      // Update local state locally
      const currentCerts = this.certificatesSubject.value;
      const index = currentCerts.findIndex(c => c.id === cert.id);
      if (index !== -1) {
          currentCerts[index] = cert;
          this.certificatesSubject.next([...currentCerts]);
      }
  }

  async deleteCertificate(id: string) {
      const { error } = await this.supabaseService.client
          .from('certificates')
          .delete()
          .eq('certificate_id', id);

      if (error) {
          console.error('Error deleting certificate:', error);
          return;
      }

      // Update local state
      const currentCerts = this.certificatesSubject.value;
      this.certificatesSubject.next(currentCerts.filter(c => c.id !== id));
  }

  private generateCertificateId(): string {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `CERT-${year}-${random}`;
  }

  // kept for compatibility if needed, but primary logic is now read-only verification
  getCertificates(): Certificate[] {
    return this.certificatesSubject.value;
  }
}
