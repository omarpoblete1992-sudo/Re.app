// Export global types here
export type User = {
    id: string;
    email: string;
    nickname: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial';
};
