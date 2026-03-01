import { Component, inject } from '@angular/core';
import { CommonModule, TitleCasePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../app/core/auth.service';
import { FileService, Delimiter } from '../../app/core/file.service';
import { NotificationService } from '../../app/core/notification.service';

type ValidationStatus = 'pending' | 'scanning' | 'valid' | 'invalid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, NgClass, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public auth = inject(AuthService);
  private fileService = inject(FileService);
  private ns = inject(NotificationService);
  private router = inject(Router);

  isPredicting = false;

  // Customers State
  customersFile: File | null = null;
  customersDelimiter: Delimiter = ',';
  customersStatus: ValidationStatus = 'pending';
  customersError: string | null = null;
  customersDragging = false;

  // Transactions State
  transactionsFile: File | null = null;
  transactionsDelimiter: Delimiter = ',';
  transactionsStatus: ValidationStatus = 'pending';
  transactionsError: string | null = null;
  transactionsDragging = false;

  onDragOver(event: DragEvent, type: 'customers' | 'transactions') {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'customers') this.customersDragging = true;
    else this.transactionsDragging = true;
  }

  onDragLeave(event: DragEvent, type: 'customers' | 'transactions') {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'customers') this.customersDragging = false;
    else this.transactionsDragging = false;
  }

  onDrop(event: DragEvent, type: 'customers' | 'transactions') {
    event.preventDefault();
    event.stopPropagation();

    if (type === 'customers') this.customersDragging = false;
    else this.transactionsDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0], type);
    }
  }

  onFileSelected(event: any, type: 'customers' | 'transactions') {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file, type);
    }
  }

  onDelimiterChange(type: 'customers' | 'transactions') {
    // Re-validate file if it's already uploaded and we changed the delimiter
    const file = type === 'customers' ? this.customersFile : this.transactionsFile;
    if (file) {
      this.validateFile(file, type);
    }
  }

  handleFile(file: File, type: 'customers' | 'transactions') {
    if (type === 'customers') {
      this.customersFile = file;
    } else {
      this.transactionsFile = file;
    }
    this.validateFile(file, type);
  }

  async validateFile(file: File, type: 'customers' | 'transactions') {
    if (type === 'customers') {
      this.customersStatus = 'scanning';
      this.customersError = null;
    } else {
      this.transactionsStatus = 'scanning';
      this.transactionsError = null;
    }

    const delimiter = type === 'customers' ? this.customersDelimiter : this.transactionsDelimiter;
    const result = await this.fileService.validateDataset(file, type, delimiter);

    if (type === 'customers') {
      this.customersStatus = result.isValid ? 'valid' : 'invalid';
      this.customersError = result.error || null;
    } else {
      this.transactionsStatus = result.isValid ? 'valid' : 'invalid';
      this.transactionsError = result.error || null;
    }

    if (result.isValid) {
      this.ns.success(`${type} validated successfully!`);
    } else {
      this.ns.error(`${type} validation failed.`);
    }
  }

  async startPrediction() {
    if (this.customersStatus !== 'valid' || this.transactionsStatus !== 'valid') return;

    this.isPredicting = true;

    setTimeout(() => {
      this.isPredicting = false;
      this.ns.success('Prediction complete! Generating dashboard...');
      this.router.navigate(['/dashboard']);
    }, 3000);
  }
}
