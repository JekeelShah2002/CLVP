import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    public toasts = signal<Toast[]>([]);

    show(message: string, type: 'success' | 'error' | 'info' = 'info') {
        const id = Math.random().toString(36).substring(7);
        this.toasts.update(current => [...current, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => this.remove(id), 3000);
    }

    success(message: string) {
        this.show(message, 'success');
    }

    error(message: string) {
        this.show(message, 'error');
    }

    remove(id: string) {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
