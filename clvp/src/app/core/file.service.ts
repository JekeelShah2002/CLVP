import { Injectable } from '@angular/core';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    data?: any[];
}

export type Delimiter = ',' | '\t';

@Injectable({ providedIn: 'root' })
export class FileService {
    constructor() { }

    async validateDataset(file: File, type: 'contacts' | 'transactions', delimiter: Delimiter): Promise<ValidationResult> {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'csv' && ext !== 'txt') {
            return { isValid: false, error: 'File must be a .csv or .txt format.' };
        }

        try {
            const text = await file.text();
            const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);

            if (lines.length < 2) {
                return { isValid: false, error: 'File is empty or missing data rows.' };
            }

            const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

            let required: string[] = [];
            if (type === 'transactions') {
                required = ['contactid', 'purchasedon', 'totalprice'];
            } else if (type === 'contacts') {
                // ContactId is the only hard requirement; Loyalty Tier is recommended but not blocking
                required = ['contactid'];
                // Soft warning for missing Loyalty Tier (non-blocking)
                const hasLoyaltyTier = headers.includes('loyalty tier');
                if (!hasLoyaltyTier) {
                    console.warn('[FileService] "Loyalty Tier" column not found in Contact file — loyalty_tier_score will default to 0.');
                }
            }

            const missing = required.filter(req => !headers.includes(req));

            if (missing.length > 0) {
                return {
                    isValid: false,
                    error: `Missing required columns: ${missing.join(', ')}`
                };
            }

            return { isValid: true, data: lines };

        } catch (e) {
            return { isValid: false, error: 'Failed to read file. It might be corrupted.' };
        }
    }
}
