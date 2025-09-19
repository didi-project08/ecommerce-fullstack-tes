// pages/orders/index.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import OrderCard from '../../components/OrderCard';
import ProtectedRoute from '../../components/ProtectedRoute';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// Interface untuk data produk dalam order item
interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  stock: number;
  imageUrl: string;
}

// Interface untuk data pesanan item
interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
  createdAt: string;
  products: Product;
}

// Interface untuk data pesanan
interface Order {
  id: string;
  userId: string;
  orderDate: string;
  totalAmount: string;
  status: 'DELIVERED' | 'PROCESSING' | 'CANCELLED' | 'PENDING' | string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  orderItems: OrderItem[];
}

// Interface untuk response API
interface OrdersResponse {
  statusCode: number;
  total: number;
  data: Order[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { user, isAuthenticated, hasPermission } = useAuth();

  // Menggunakan useCallback untuk mencegah pembuatan fungsi baru di setiap render
  const fetchOrders = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get<OrdersResponse>('/orders?orderBy=desc');
      
      // Sesuaikan dengan struktur response API Anda
      if (response.data && response.data.data) {
        setOrders(response.data.data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login kembali.');
      } else {
        setError('Gagal memuat data pesanan');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Tambahkan user sebagai dependency

  useEffect(() => {
    // Hanya fetch orders jika user terautentikasi dan memiliki permission
    if (isAuthenticated && hasPermission('orders:read')) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, hasPermission, fetchOrders]); // Tambahkan fetchOrders sebagai dependency

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ProtectedRoute>
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Daftar Pesanan</h1>
              <button
                onClick={fetchOrders}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh
              </button>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {orders.length > 0 ? (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {orders.map((order: Order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-12 bg-white shadow sm:rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Belum ada pesanan</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Anda belum memiliki pesanan. Mulai berbelanja untuk membuat pesanan pertama Anda.
                </p>
                <div className="mt-6">
                  <a
                    href="/products"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Lihat Produk
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </ProtectedRoute>
    </Layout>
  );
}