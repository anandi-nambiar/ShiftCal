// types.ts

export type Shift = {
    id: string;
    user_id: string;
    provider: string;
    external_id: string;
    start_time: string; // ISO string
    end_time: string;   // ISO string
    title?: string;
    location?: string;
    created_at?: string;
};

// If you have navigation types for stack/tab:
export type RootStackParamList = {
    Home: undefined;
    Shifts: undefined;
    Auth: undefined;
};
