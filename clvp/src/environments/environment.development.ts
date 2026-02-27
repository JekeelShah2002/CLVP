export interface AppEnvironment {
    production: boolean;
    appwrite: {
        endpoint: string;
        projectId: string;
    };
}

export const environment: AppEnvironment = {
    production: false,
    appwrite: {
        endpoint: 'https://sfo.cloud.appwrite.io/v1',
        projectId: '698a323e001706b3ff01',
    },
};
