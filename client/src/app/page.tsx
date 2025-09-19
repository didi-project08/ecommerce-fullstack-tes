"use client"

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../utils/api';
import { AuthContext } from "../context/AuthContext";

// Tipe untuk data user yang akan disimpan di localStorage
interface User {
    id: string;
    name: string;
    email: string;
    // Tambahkan properti lain sesuai dengan data user dari API
}

// Tipe untuk response dari API login
interface LoginResponse {
    token: string;
    user: User;
}

// Schema validasi dengan Zod
const loginSchema = z.object({
    email: z.string()
        .min(1, 'Email harus diisi')
        .email('Format email tidak valid'),
    password: z.string()
        .min(1, 'Password harus diisi')
        .min(5, 'Password minimal harus 5 karakter'),
});

// Type inference dari schema Zod
type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();
    
    const auth = useContext(AuthContext);
    
    if (!auth) {
        throw new Error('Login must be used within AuthProvider');
    }

    const { user } = auth;

    useEffect(() => {
        if (user) {
            router.push('/products');
        }
    }, [user, router]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError('');

        try {
            await api.post<LoginResponse>('/auth/signin', data);
            router.push('/products');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Login gagal';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Tampilkan loading state saat mengecek status login
    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">Sedang mengalihkan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Masuk ke Akun Anda
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {process.env.NEXT_PUBLIC_SITE_NAME}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {error}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                type="email"
                                autoComplete="email"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Alamat email"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </div>
                    
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.push('/products')}
                            className="text-indigo-600 hover:text-indigo-500 text-sm"
                        >
                            Lanjutkan sebagai tamu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}