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

  /** Top 25 high-tier customers — used on /customers default load. ~26 Appwrite reads. */
  getTopCustomers(): Observable<any> {
    console.log('[API] Requesting top 25 customers...');
    return this.http.get(`${this.baseUrl}/customers/top`);
  }

  /** Search customers by name or ID — only fires when user submits a query. */
  searchCustomers(query: string): Observable<any> {
    console.log(`[API] Searching customers for: "${query}"`);
    return this.http.get(`${this.baseUrl}/customers?q=${encodeURIComponent(query)}`);
  }

  /** @deprecated Use getTopCustomers() or searchCustomers() */
  getCustomers(query: string = ''): Observable<any> {
    return query ? this.searchCustomers(query) : this.getTopCustomers();
  }

  getCustomerDetails(id: string): Observable<any> {
    console.log(`[API] Requesting details for customer ID: ${id}...`);
    return this.http.get(`${this.baseUrl}/customers/${encodeURIComponent(id)}`);
  }

  // --- DASHBOARD ANALYTICS ---
  getDashboardAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/analytics`);
  }

  // --- NEW AI PREDICTION ENDPOINTS ---
  getPredictions(contacts: File, transactions: File): Observable<any> {
    const formData = new FormData();
    formData.append('contacts', contacts);
    formData.append('purchases', transactions);
    // Hardcoded to the engine port. In prod, use environment variable.
    return this.http.post(`http://localhost:5000/predict`, formData);
  }

  savePredictions(predictions: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/features/scores`, { predictions });
  }

  // --- CLOUD DASHBOARD SYNC (Zero-Cost Arch) ---
  checkDashboardStatus(): Observable<{ exists: boolean; source?: string }> {
    return this.http.get<{ exists: boolean; source?: string }>(`${this.baseUrl}/dashboard/status`);
  }

  syncDashboard(): Observable<any> {
    return this.http.post(`${this.baseUrl}/dashboard/sync`, {});
  }
}
