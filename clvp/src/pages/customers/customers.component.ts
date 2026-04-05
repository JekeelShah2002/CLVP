import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../app/core/api.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  private api = inject(ApiService);
  
  searchTerm = '';
  customers: any[] = [];
  loading = false;
  error: string | null = null;

  ngOnInit() {
    this.search();
  }

  search() {
    this.loading = true;
    this.error = null;
    this.api.getCustomers(this.searchTerm).subscribe({
      next: (res: any) => {
        this.customers = res.customers;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to fetch customers.';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
