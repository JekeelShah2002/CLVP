import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../app/core/api.service';
import { LoaderService } from '../../app/core/loader.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  private api = inject(ApiService);
  public loader = inject(LoaderService);
  
  searchTerm = '';
  customers: any[] = [];
  displayedCount = 50;
  error: string | null = null;

  ngOnInit() {
    this.search();
  }

  search() {
    this.loader.show();
    this.error = null;
    this.displayedCount = 50;
    this.api.getCustomers(this.searchTerm).subscribe({
      next: (res: any) => {
        this.customers = res.customers;
        this.loader.hide();
      },
      error: (err: any) => {
        this.error = 'Failed to fetch customers.';
        this.loader.hide();
        console.error(err);
      }
    });
  }

  loadMore() {
    this.displayedCount += 50;
  }
}
