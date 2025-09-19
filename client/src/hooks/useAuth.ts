import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useRouter } from 'next/navigation';

interface User {
    name: string;
    email: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await api.post<{ user: User }>('/auth/me');
            setUser(response.data.user);
            setIsAuthenticated(true);
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
        };

        fetchUser();
    }, []);

    const logout = async () => {
        try {
            await api.post('/auth/logout');
            setUser(null);
            setIsAuthenticated(false);
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    };

    return { 
        user, 
        loading, 
        isAuthenticated,
        logout 
    };
}