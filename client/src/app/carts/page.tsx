"use client";

import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import CartItemCard from '../../components/CartItemCard';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSession } from '../../context/SessionContext';

// Interface untuk data item keranjang
interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string,
    description: string,
    price: string,
    category: string,
    stock: number,
    imageUrl: string,
  };
}

// Interface untuk data keranjang
interface Cart {
  id: string;
  userId?: string;
  sessionId: string;
  createdAt?: string;
  updatedAt?: string;
  cartItems: CartItem[];
}

// Interface untuk response API
interface CartResponse {
  statusCode: number;
  total: number;
  data: Cart[]; // Perhatikan bahwa data adalah array of Cart
}

interface DeleteRequestBody {
  permanent: boolean;
}

const body: DeleteRequestBody = {
  permanent: true,
};

export default function Carts() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDataReady, setIsDataReady] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { sessionId } = useSession();

  // Menggunakan useCallback untuk mencegah pembuatan fungsi baru di setiap render
  const fetchCart = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setIsDataReady(false);
      setError('');
      
      // Pastikan sessionId ada
      if (!sessionId) {
        setError('Session tidak ditemukan. Silakan refresh halaman.');
        setIsLoading(false);
        return;
      }
      
      const response = await api.get<CartResponse>(`/carts?sessionId=${sessionId}`);
      
      // Sesuaikan dengan struktur response API Anda
      if (response.data && response.data.data && response.data.data.length > 0) {
        // Ambil cart pertama dari array (karena response adalah array)
        const cartData = response.data.data[0];
        
        // Set cart data
        setCart(cartData);
        
        // Tambahkan delay kecil sebelum menandai data siap
        setTimeout(() => {
          setIsDataReady(true);
          setIsLoading(false);
        }, 300); // 300ms delay untuk memastikan state sudah terupdate
      } else {
        setCart(null);
        setIsDataReady(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Untuk menggunakan fitur ini, anda wajib login.');
      } else if (err.response?.status === 404) {
        setCart(null);
      } else {
        setError('Gagal memuat data keranjang');
        console.error(err);
      }
      setIsDataReady(true);
      setIsLoading(false);
    }
  }, [sessionId]); // Tambahkan sessionId sebagai dependency

  // Menghitung total harga keranjang
  const calculateTotal = useCallback((): number => {
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) return 0;
    
    return cart.cartItems.reduce((total, item) => {
      return total + (Number(item.product.price) * item.quantity);
    }, 0);
  }, [cart]);

  // Update quantity item di keranjang
  const updateItemQuantity = useCallback(async (itemId: string, newQuantity: number): Promise<void> => {
    if (newQuantity < 1) return;
    
    try {
      setIsUpdating(true);
      
      await api.put(`/cart-items/${itemId}`, {
        quantity: newQuantity
      });
      
      // Update state secara lokal untuk respons yang lebih cepat
      if (cart) {
        const updatedCart = {
          ...cart,
          cartItems: cart.cartItems.map(item => 
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        };
        setCart(updatedCart);
        
        // Tambahkan delay sebelum refresh data dari server
        setTimeout(async () => {
          await fetchCart();
        }, 300);
      }
    } catch (err: any) {
      setError('Gagal memperbarui jumlah item');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  }, [cart, fetchCart]);

  // Hapus item dari keranjang
  const removeItemFromCart = useCallback(async (itemId: string): Promise<void> => {
    try {
      setIsUpdating(true);
      
      // Update state secara lokal untuk respons yang lebih cepat
      if (cart) {
        const updatedCart = {
          ...cart,
          cartItems: cart.cartItems.filter(item => item.id !== itemId)
        };
        setCart(updatedCart);
        
        // Tambahkan delay sebelum menghapus dari server dan refresh data
        setTimeout(async () => {
          try {
            // Kirim request dengan body yang sudah ditentukan tipenya
            await api.delete(`/cart-items/${itemId}`, { data: body });
            await fetchCart();
          } catch (err: unknown) {
            // Perbaiki penanganan error dengan type safety
            if (err instanceof Error) {
              setError('Gagal menghapus item dari keranjang');
              console.error(err.message);
            } else {
              setError('Gagal menghapus item dari keranjang');
              console.error('Unknown error occurred:', err);
            }
            
            // Jika gagal, refresh data untuk mendapatkan state terbaru
            await fetchCart();
          }
        }, 300);
      }
    } catch (err: unknown) {
      // Perbaiki penanganan error dengan type safety
      if (err instanceof Error) {
        setError('Gagal menghapus item dari keranjang');
        console.error(err.message);
      } else {
        setError('Gagal menghapus item dari keranjang');
        console.error('Unknown error occurred:', err);
      }
      
      // Jika gagal, refresh data untuk mendapatkan state terbaru
      await fetchCart();
    } finally {
      setIsUpdating(false);
    }
  }, [cart, fetchCart]);

  // Mengosongkan keranjang
  const clearCart = useCallback(async (): Promise<void> => {
    if (!cart) return;
    
    try {
      setIsUpdating(true);
      
      // Update state secara lokal untuk respons yang lebih cepat
      setCart({
        ...cart,
        cartItems: []
      });
      
      // Tambahkan delay sebelum menghapus dari server
      setTimeout(async () => {
        try {
          // Hapus semua item di keranjang dari server
          for (const item of cart.cartItems) {
            await api.delete(`/cart-items/${item.id}`, { data: body });
          }
          
          // Refresh data keranjang
          await fetchCart();
        } catch (err: any) {
          setError('Gagal mengosongkan keranjang');
          console.error(err);
          
          // Jika gagal, refresh data untuk mendapatkan state terbaru
          await fetchCart();
        }
      }, 300);
    } catch (err: any) {
      setError('Gagal mengosongkan keranjang');
      console.error(err);
      
      // Jika gagal, refresh data untuk mendapatkan state terbaru
      await fetchCart();
    } finally {
      setIsUpdating(false);
    }
  }, [cart, fetchCart]);

  // Melanjutkan ke checkout
  const proceedToCheckout = (): void => {
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      setError('Keranjang Anda kosong');
      return;
    }
    
    // Redirect ke halaman checkout dengan session ID dan tandai ini bukan pembelian langsung
    window.location.href = `/checkout?sessionId=${sessionId}&directBuy=false`;
  };

  useEffect(() => {
    // Fetch cart data saat komponen dimount dan sessionId berubah
    if (sessionId) {
      fetchCart();
    }
  }, [fetchCart, sessionId]);

  // Format Rupiah
  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Keranjang Belanja</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {cart && cart.cartItems && cart.cartItems.length > 0 && isDataReady ? (
            <div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
                <ul className="divide-y divide-gray-200">
                  {cart.cartItems.map((item: CartItem) => (
                    <CartItemCard 
                      key={item.id} 
                      item={item} 
                      onUpdateQuantity={updateItemQuantity}
                      onRemove={removeItemFromCart}
                      isUpdating={isUpdating}
                    />
                  ))}
                </ul>
              </div>

              <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Total</h3>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatRupiah(calculateTotal())}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={clearCart}
                    disabled={isUpdating}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Memproses..." : "Kosongkan Keranjang"}
                  </button>
                  <button
                    onClick={proceedToCheckout}
                    disabled={isUpdating}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? "Memproses..." : "Checkout"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow sm:rounded-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Keranjang Anda kosong</h3>
              <p className="mt-1 text-sm text-gray-500">
                Mulai berbelanja dan tambahkan produk ke keranjang Anda.
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
    </Layout>
  );
}