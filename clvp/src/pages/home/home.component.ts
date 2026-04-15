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
import { AnimatedBgComponent } from '../../shared/animated-bg/animated-bg.component';

type ValidationStatus = 'pending' | 'scanning' | 'valid' | 'invalid';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule, AnimatedBgComponent],
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

  // Contacts State (Contact.txt)
  contactsFile: File | null = null;
  contactsDelimiter: Delimiter = ',';
  contactsStatus: ValidationStatus = 'pending';
  contactsError: string | null = null;
  contactsDragging = false;

  // Transactions State
  transactionsFile: File | null = null;
  transactionsDelimiter: Delimiter = ',';
  transactionsStatus: ValidationStatus = 'pending';
  transactionsError: string | null = null;
  transactionsDragging = false;

  // Step Navigation
  private readonly DATA_FLAG_KEY = 'clvp_has_data';

  async ngOnInit() {
    // Fast-path: if we've previously confirmed data exists, show welcome screen immediately
    const hasFlag = localStorage.getItem(this.DATA_FLAG_KEY) === 'true';
    if (hasFlag) {
      this.hasExistingData = true;
      this.currentStep = 0;
    }

    this.loader.show();
    try {
      // Cheap check (~26 DB reads): if top customers exist, user has data
      const res = await firstValueFrom(this.api.getTopCustomers());
      if (res && res.customers && res.customers.length > 0) {
        this.hasExistingData = true;
        this.currentStep = 0; // Dashboard Welcome Back
        localStorage.setItem(this.DATA_FLAG_KEY, 'true');
      } else {
        // Confirmed empty — clear flag and show onboarding
        this.hasExistingData = false;
        this.currentStep = 1;
        localStorage.removeItem(this.DATA_FLAG_KEY);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.status === 401) {
        // Session expired — redirect to login
        this.router.navigate(['/login']);
      } else if (hasFlag) {
        // API unreachable but we know data existed — stay on welcome screen
        this.hasExistingData = true;
        this.currentStep = 0;
      } else {
        // Unknown error, fresh user — show onboarding
        this.hasExistingData = false;
        this.currentStep = 1;
      }
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
      if (this.contactsStatus !== 'valid' || this.transactionsStatus !== 'valid') {
        this.ns.error('Please upload valid Contact and Transaction files to continue.');
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

    if (!this.contactsFile || !this.transactionsFile) return;

    try {
      // Step 1: Upload Contacts
      this.analysisProgress = 10;
      await firstValueFrom(this.api.uploadContacts(this.contactsFile));

      // Step 2: Upload Transactions
      this.analysisProgress = 40;
      await firstValueFrom(this.api.uploadTransactions(this.transactionsFile));

      // Step 3: Compute Features (including loyalty_tier_score)
      this.analysisProgress = 70;
      const res = await firstValueFrom(this.api.computeFeatures());

      this.analysisProgress = 100;
      this.analysisStatus = 'complete';
      localStorage.setItem(this.DATA_FLAG_KEY, 'true'); // Mark as returning user
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

  onDragOver(event: DragEvent, type: 'contacts' | 'transactions') {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'contacts') this.contactsDragging = true;
    else this.transactionsDragging = true;
  }

  onDragLeave(event: DragEvent, type: 'contacts' | 'transactions') {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'contacts') this.contactsDragging = false;
    else this.transactionsDragging = false;
  }

  onDrop(event: DragEvent, type: 'contacts' | 'transactions') {
    event.preventDefault();
    event.stopPropagation();

    if (type === 'contacts') this.contactsDragging = false;
    else this.transactionsDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0], type);
    }
  }

  onFileSelected(event: any, type: 'contacts' | 'transactions') {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file, type);
    }
  }

  onDelimiterChange(type: 'contacts' | 'transactions') {
    const file = type === 'contacts' ? this.contactsFile : this.transactionsFile;
    if (file) {
      this.validateFile(file, type);
    }
  }

  handleFile(file: File, type: 'contacts' | 'transactions') {
    if (type === 'contacts') {
      this.contactsFile = file;
    } else {
      this.transactionsFile = file;
    }
    this.validateFile(file, type);
  }

  async validateFile(file: File, type: 'contacts' | 'transactions') {
    if (type === 'contacts') {
      this.contactsStatus = 'scanning';
      this.contactsError = null;
    } else {
      this.transactionsStatus = 'scanning';
      this.transactionsError = null;
    }

    const delimiter = type === 'contacts' ? this.contactsDelimiter : this.transactionsDelimiter;
    const result = await this.fileService.validateDataset(file, type, delimiter);

    if (type === 'contacts') {
      this.contactsStatus = result.isValid ? 'valid' : 'invalid';
      this.contactsError = result.error || null;
    } else {
      this.transactionsStatus = result.isValid ? 'valid' : 'invalid';
      this.transactionsError = result.error || null;
    }

    if (result.isValid) {
      this.ns.success(`${type} file validated successfully!`);
    } else {
      this.ns.error(`${type} validation failed.`);
    }
  }
}
