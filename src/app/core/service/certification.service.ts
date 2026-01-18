import { Injectable } from '@angular/core';
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

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    const saved = localStorage.getItem('certificates');
    if (saved) {
      // Parse dates correctly
      const parsed = JSON.parse(saved, (key, value) => {
        if (key === 'issueDate' || key === 'expiryDate') return new Date(value);
        return value;
      });
      this.certificatesSubject.next(parsed);
    } else {
        // Mock Data
        const mock: Certificate[] = [
            // {
            //     id: 'CERT-2024-001',
            //     studentName: 'Ahmed Ali',
            //     courseId: 1,
            //     courseName: 'CIA Part 1: Essentials',
            //     issueDate: new Date('2024-01-15'),
            //     status: 'Active'
            // },
            // {
            //     id: 'CERT-2024-002',
            //     studentName: 'Sarah Smith',
            //     courseId: 2,
            //     courseName: 'CIA Part 2: Practice',
            //     issueDate: new Date('2024-02-20'),
            //     status: 'Active'
            // }
        ];
        this.certificatesSubject.next(mock);
        this.saveToLocalStorage(mock);
    }
  }

  getCertificates(): Certificate[] {
    return this.certificatesSubject.value;
  }

  getCertificateById(id: string): Certificate | undefined {
      return this.certificatesSubject.value.find(c => c.id === id);
  }

  issueCertificate(cert: Omit<Certificate, 'id' | 'status'>) {
      const newCert: Certificate = {
          ...cert,
          id: this.generateCertificateId(),
          status: 'Active'
      };
      
      const current = this.certificatesSubject.value;
      const updated = [newCert, ...current];
      this.certificatesSubject.next(updated);
      this.saveToLocalStorage(updated);
  }

  deleteCertificate(id: string) {
    const current = this.certificatesSubject.value;
    const updated = current.filter(c => c.id !== id);
    this.certificatesSubject.next(updated);
    this.saveToLocalStorage(updated);
  }

  updateCertificate(cert: Certificate) {
      const current = this.certificatesSubject.value;
      const index = current.findIndex(c => c.id === cert.id);
      if (index !== -1) {
          const updated = [...current];
          updated[index] = cert;
          this.certificatesSubject.next(updated);
          this.saveToLocalStorage(updated);
      }
  }

  private saveToLocalStorage(data: Certificate[]) {
    localStorage.setItem('certificates', JSON.stringify(data));
  }

  private generateCertificateId(): string {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `CERT-${year}-${random}`;
  }
}
