export interface AppEnvironment {
    production: boolean;
    apiUrl: string;
    appwrite: {
        endpoint: string;
        projectId: string;
    };
}

export const environment: AppEnvironment = {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    appwrite: {
        endpoint: 'https://sfo.cloud.appwrite.io/v1',
        projectId: '698a323e001706b3ff01',
    },
};
