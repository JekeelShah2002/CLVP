import { AppEnvironment } from './environment.development';

export const environment: AppEnvironment = {
  production: false,
  appwrite: {
    endpoint: 'https://sfo.cloud.appwrite.io/v1', // or your self-hosted endpoint
    projectId: '698a323e001706b3ff01',
  },
};