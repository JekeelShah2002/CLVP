import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /** Upload Contact.txt (primary 3-file flow) */
  uploadContacts(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload/contacts`, formData);
  }

  /** @deprecated Use uploadContacts() — kept for backward compatibility */
  uploadDemographics(file: File): Observable<any> {
    return this.uploadContacts(file);
  }

  uploadTransactions(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload/transactions`, formData);
  }

  computeFeatures(): Observable<any> {
    return this.http.post(`${this.baseUrl}/features/compute`, {});
  }

  getCustomers(query: string = ''): Observable<any> {
    console.log(`[API] Requesting all customers${query ? ` (Search term: "${query}")` : ''}...`);
    return this.http.get(`${this.baseUrl}/customers?q=${encodeURIComponent(query)}`);
  }

  getCustomerDetails(id: string): Observable<any> {
    console.log(`[API] Requesting details for customer ID: ${id}...`);
    return this.http.get(`${this.baseUrl}/customers/${encodeURIComponent(id)}`);
  }
}
