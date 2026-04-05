import { AppEnvironment } from './environment.development';

export const environment: AppEnvironment = {
  production: true,
  apiUrl: 'https://clvp-api.vercel.app/api',
  appwrite: {
    endpoint: 'https://sfo.cloud.appwrite.io/v1',
    projectId: '698a323e001706b3ff01',
  },
};