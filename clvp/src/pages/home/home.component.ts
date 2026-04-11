import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../app/core/auth.service';
import { FileService, Delimiter } from '../../app/core/file.service';
import { NotificationService } from '../../app/core/notification.service';
import { ApiService } from '../../app/core/api.service';
import { LoaderService } from '../../app/core/loader.service';
import { firstValueFrom } from 'rxjs';

type ValidationStatus = 'pending' | 'scanning' | 'valid' | 'invalid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  public auth = inject(AuthService);
  private fileService = inject(FileService);
  private ns = inject(NotificationService);
  private router = inject(Router);
  private api = inject(ApiService);
  private loader = inject(LoaderService);

  currentStep = 0;
  hasExistingData = false;

  // Step 1
  selectedIntegration: string | null = null;

  // Step 2
  selectedGoal: string | null = null;

  // Step 3
  analysisProgress = 0;
  analysisStatus: 'pending' | 'processing' | 'complete' = 'pending';

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

  // Step Navigation
  async ngOnInit() {
    this.loader.show();
    try {
      const res = await firstValueFrom(this.api.getCustomers());
      if (res && res.customers && res.customers.length > 0) {
        this.hasExistingData = true;
        this.currentStep = 0; // Dashboard Welcome Back
      } else {
        this.hasExistingData = false;
        this.currentStep = 1; // Onboarding Setup
      }
    } catch (err) {
      console.error(err);
      this.hasExistingData = false;
      this.currentStep = 1; // Default to onboarding on error
    } finally {
      this.loader.hide();
    }
  }

  cancelUpload() {
    if (this.hasExistingData) {
      this.currentStep = 0;
    }
  }

  startNewUpload() {
    this.currentStep = 1;
  }

  goToStep(step: number) {
    if (step === 2) {
      if (this.selectedIntegration !== 'csv') {
        this.ns.error('Only Custom CSV Upload is fully supported at this time.');
        return;
      }
      if (this.customersStatus !== 'valid' || this.transactionsStatus !== 'valid') {
        this.ns.error('Please upload valid Customer and Transaction CSVs to continue.');
        return;
      }
    }

    if (step === 3) {
      if (!this.selectedGoal) {
        this.ns.error('Please select a primary goal to continue.');
        return;
      }
      this.currentStep = 3;
      this.startAnalysis();
      return;
    }

    this.currentStep = step;
  }

  selectIntegration(integration: string) {
    if (integration === 'csv') {
      // Toggle visibility
      this.selectedIntegration = this.selectedIntegration === 'csv' ? null : 'csv';
    }
  }

  selectGoal(goal: string) {
    this.selectedGoal = goal;
  }

  async startAnalysis() {
    this.analysisStatus = 'processing';
    this.analysisProgress = 0;

    if (!this.customersFile || !this.transactionsFile) return;

    try {
      // Step 1: Upload Demographics
      this.analysisProgress = 10;
      await firstValueFrom(this.api.uploadDemographics(this.customersFile));

      // Step 2: Upload Transactions
      this.analysisProgress = 40;
      await firstValueFrom(this.api.uploadTransactions(this.transactionsFile));

      // Step 3: Compute Features
      this.analysisProgress = 70;
      const res = await firstValueFrom(this.api.computeFeatures());

      this.analysisProgress = 100;
      this.analysisStatus = 'complete';
      console.log('Features computed:', res);
    } catch (err) {
      console.error(err);
      this.ns.error('Server error during analysis computation.');
      this.analysisStatus = 'pending';
      this.analysisProgress = 0;
    }
  }

  goToDashboard() {
    if (this.analysisStatus === 'complete') {
      this.ns.success('Prediction complete! Generation dashboard...');
      this.router.navigate(['/dashboard']);
    }
  }

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
}
