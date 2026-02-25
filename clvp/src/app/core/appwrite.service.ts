import { Injectable } from '@angular/core';
import { Client, Account } from 'appwrite';
import { environment } from '../../environments/environment';

type AnyEnv = typeof environment & {
  appwriteEndpoint?: string;
  appwriteProjectId?: string;
  appwrite?: { endpoint: string; projectId: string };
};

@Injectable({ providedIn: 'root' })
export class AppwriteService {
  public client: Client;
  public account: Account;

  constructor() {
    const env = environment as AnyEnv;

    const endpoint = env.appwrite?.endpoint ?? env.appwriteEndpoint;
    const projectId = env.appwrite?.projectId ?? env.appwriteProjectId;

    if (!endpoint || !projectId) {
      throw new Error(
        'Appwrite config missing. Define either environment.appwrite { endpoint, projectId } or environment.appwriteEndpoint/appwriteProjectId.'
      );
    }

    this.client = new Client().setEndpoint(endpoint).setProject(projectId);
    this.account = new Account(this.client);
  }
}