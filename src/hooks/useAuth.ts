import { useMemo } from 'react';
import type { User } from '@/lib/types';

export function useAuth() {
    const user: User | null = useMemo(() => {
        try {
            const raw = localStorage.getItem('dms_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }, []);

    const isAdmin = user?.role === 'ADMIN';
    const isApprover = user?.role === 'SUPERVISOR' || user?.role === 'DEPT_HEAD' || user?.role === 'ADMIN';
    const isApplicant = user?.role === 'OFFICER' || user?.role === 'ASSISTANT';

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('session_id');
        localStorage.removeItem('dms_user');
        window.location.href = '/';
    };

    return { user, isAdmin, isApprover, isApplicant, logout };
}
