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

  uploadDemographics(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload/demographics`, formData);
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
    return this.http.get(`${this.baseUrl}/customers?q=${encodeURIComponent(query)}`);
  }
}
