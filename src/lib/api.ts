import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/v1';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('dms_user');
            window.location.href = '/';
        }
        return Promise.reject(err);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export type Role = 'ADMIN' | 'OFFICER' | 'ASSISTANT' | 'SUPERVISOR' | 'DEPT_HEAD';

export interface LoginResponse {
    user: { id: string; email: string; firstName: string; lastName: string; role: Role; department: any };
    accessToken: string; refreshToken: string; sessionId: string;
}

export const authApi = {
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/auth/login', { email, password }),
    logout: (refreshToken: string) =>
        api.post('/auth/logout', { refreshToken }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats'),
};

// ── Files ─────────────────────────────────────────────────────────────────────
export const filesApi = {
    list: (params?: any) => api.get('/files', { params }),
    get: (id: string) => api.get(`/files/${id}`),
    create: (data: any) => api.post('/files', data),
    forward: (id: string, data: any) => api.post(`/files/${id}/forward`, data),
    approve: (id: string, data: any) => api.post(`/files/${id}/approve`, data),
    return: (id: string, data: any) => api.post(`/files/${id}/return`, data),
    reject: (id: string, data: any) => api.post(`/files/${id}/reject`, data),
    close: (id: string, data: any) => api.post(`/files/${id}/close`, data),
    getMovements: (id: string) => api.get(`/files/${id}/movements`),
};

// ── Inward ────────────────────────────────────────────────────────────────────
export const inwardApi = {
    list: (params?: any) => api.get('/inward', { params }),
    get: (id: string) => api.get(`/inward/${id}`),
    create: (data: any) => api.post('/inward', data),
    linkToFile: (id: string, fileId: string) => api.patch(`/inward/${id}/link-file`, { fileId }),
};

// ── Notes ─────────────────────────────────────────────────────────────────────
export const notesApi = {
    list: (params?: any) => api.get('/notes', { params }),
    get: (id: string) => api.get(`/notes/${id}`),
    create: (data: any) => api.post('/notes', data),
    update: (id: string, data: any) => api.patch(`/notes/${id}`, data),
    approve: (id: string) => api.post(`/notes/${id}/approve`),
    delete: (id: string) => api.delete(`/notes/${id}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
    list: (params?: any) => api.get('/documents', { params }),
    get: (id: string) => api.get(`/documents/${id}`),
    upload: (formData: FormData, params?: { fileId?: string; inwardId?: string; description?: string; heading?: string }) =>
        api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            params,
        }),
    delete: (id: string) => api.delete(`/documents/${id}`),
    download: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
    findByFile: (fileId: string) => api.get(`/documents/file/${fileId}`),
    findByInward: (inwardId: string) => api.get(`/documents/inward/${inwardId}`),
};

// ── Archive ───────────────────────────────────────────────────────────────────
export const archiveApi = {
    list: (params?: any) => api.get('/archive', { params }),
    restore: (id: string) => api.post(`/archive/${id}/restore`),
    requestDisposal: (id: string, data: any) => api.post(`/archive/${id}/dispose`, data),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
    getSummary: () => api.get('/reports/summary'),
    getFilesByStatus: () => api.get('/reports/files-by-status'),
    getTurnaround: () => api.get('/reports/turnaround'),
    getActivity: () => api.get('/reports/activity'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
    list: (params?: any) => api.get('/users', { params }),
    get: (id: string) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: string, data: any) => api.patch(`/users/${id}`, data),
    deactivate: (id: string) => api.patch(`/users/${id}/status`, { status: 'INACTIVE' }),
};

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentsApi = {
    list: () => api.get('/departments'),
    create: (data: any) => api.post('/departments', data),
    update: (id: string, data: any) => api.patch(`/departments/${id}`, data),
};

// ── Workflow ──────────────────────────────────────────────────────────────────
export const workflowApi = {
    // Categories
    listCategories: () => api.get('/workflow/categories'),
    createCategory: (data: { name: string; description?: string }) => api.post('/workflow/categories', data),
    getCategory: (id: string) => api.get(`/workflow/categories/${id}`),

    // Stages
    addStage: (data: { categoryId: string; role: Role; stageOrder: number; isMandatory?: boolean }) =>
        api.post('/workflow/stages', data),
    removeStage: (id: string) => api.delete(`/workflow/stages/${id}`),

    // Actions
    getActionHistory: (fileId: string) => api.get(`/workflow/files/${fileId}/approvals`),
    processAction: (fileId: string, data: { status: 'APPROVED' | 'REJECTED' | 'RETURNED'; comments?: string }) =>
        api.post(`/workflow/files/${fileId}/action`, data),
};
// ── Classifications ────────────────────────────────────────────────────────────
export const classificationsApi = {
    list: () => api.get('/classifications'),
    get: (id: string) => api.get(`/classifications/${id}`),
    create: (data: any) => api.post('/classifications', data),
    update: (id: string, data: any) => api.patch(`/classifications/${id}`, data),
    delete: (id: string) => api.delete(`/classifications/${id}`),
    setRoutes: (id: string, routes: { userId: string; order: number }[]) =>
        api.post(`/classifications/${id}/routes`, { routes }),
};
