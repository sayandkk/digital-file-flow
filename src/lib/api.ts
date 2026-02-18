import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'OFFICER' | 'ASSISTANT' | 'SUPERVISOR' | 'DEPT_HEAD';

export interface LoginResponse {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
        department: { id: string; name: string; code: string } | null;
    };
    accessToken: string;
    refreshToken: string;
    sessionId: string;
}

export const authApi = {
    login: (email: string, password: string, role: Role) =>
        api.post<LoginResponse>('/auth/login', { email, password, role }),

    logout: (refreshToken: string) =>
        api.post('/auth/logout', { refreshToken }),
};
