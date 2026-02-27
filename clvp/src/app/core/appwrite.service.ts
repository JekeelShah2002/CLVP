import { Injectable } from '@angular/core';
import { Client, Account } from 'appwrite';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppwriteService {
  public client: Client;
  public account: Account;

  constructor() {
    const endpoint = environment.appwrite.endpoint;
    const projectId = environment.appwrite.projectId;

    if (!endpoint || !projectId) {
      throw new Error(
        'Appwrite config missing. Define environment.appwrite { endpoint, projectId }.'
      );
    }

    this.client = new Client().setEndpoint(endpoint).setProject(projectId);
    this.account = new Account(this.client);
  }
}
