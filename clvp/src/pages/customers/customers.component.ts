import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../app/core/api.service';
import { LoaderService } from '../../app/core/loader.service';
import { AnimatedBgComponent } from '../../shared/animated-bg/animated-bg.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AnimatedBgComponent],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  private api = inject(ApiService);
  public loader = inject(LoaderService);

  searchTerm = '';
  customers: any[] = [];
  /** 'top' = default top-25 view | 'search' = user-submitted query results */
  viewMode: 'top' | 'search' = 'top';
  error: string | null = null;

  ngOnInit() {
    this.loadTopCustomers();
  }

  /** Loads top 25 high-tier customers (~26 Appwrite reads). Called on init. */
  loadTopCustomers() {
    this.loader.show();
    this.error = null;
    this.viewMode = 'top';
    this.api.getTopCustomers().subscribe({
      next: (res: any) => {
        this.customers = res.customers ?? [];
        this.loader.hide();
      },
      error: (err: any) => {
        this.error = 'Failed to load top customers.';
        this.loader.hide();
        console.error(err);
      }
    });
  }

  /** Searches customers by name or ID. Only runs when user submits. */
  search() {
    const term = this.searchTerm.trim();
    if (!term) {
      // Empty search → go back to default top-25 view
      this.loadTopCustomers();
      return;
    }
    this.loader.show();
    this.error = null;
    this.viewMode = 'search';
    this.api.searchCustomers(term).subscribe({
      next: (res: any) => {
        this.customers = res.customers ?? [];
        this.loader.hide();
      },
      error: (err: any) => {
        this.error = 'Search failed. Please try again.';
        this.loader.hide();
        console.error(err);
      }
    });
  }

  /** Clears search and resets to top-25 view */
  clearSearch() {
    this.searchTerm = '';
    this.loadTopCustomers();
  }
}
