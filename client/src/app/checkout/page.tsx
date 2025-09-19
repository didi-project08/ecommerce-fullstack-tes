"use client";

import { useState, useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useSession } from '../../context/SessionContext';
import { AuthContext } from "../../context/AuthContext";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNotification } from '../../context/NotificationContext';

// Interface untuk item keranjang
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
  cartItems: CartItem[];
}

// Interface untuk data pesanan
interface OrderData {
  userId?: string | null;
  orderDate: string;
  totalAmount: number;
  status: string;
  email: string;
  phone: string;
  address: string;
}

// Interface untuk order item
interface OrderItemData {
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

// Interface untuk response dari API
interface OrderResponse {
  data: {
    id: string,
  }
  // Tambahkan properti lain sesuai kebutuhan
}

// Schema validasi form menggunakan Zod
const checkoutSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit'),
  address: z.string().min(10, 'Alamat minimal 10 karakter').max(200, 'Alamat maksimal 200 karakter'),
  city: z.string().min(3, 'Kota minimal 3 karakter').max(50, 'Kota maksimal 50 karakter'),
  postalCode: z.string().min(5, 'Kode pos minimal 5 digit').max(6, 'Kode pos maksimal 6 digit'),
});

// Type untuk form data berdasarkan schema
interface CheckoutFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export default function Checkout() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('Layout must be used within AuthProvider');
  }

  const { user } = auth;

  const [cart, setCart] = useState<Cart | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionId } = useSession();
  const { showNotification } = useNotification();
  
  // Cek apakah ini adalah pembelian langsung
  const directBuy = searchParams.get('directBuy') === 'true';
  const productId = searchParams.get('productId');

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
    }
  });

  // Watch values untuk debugging
  const watchedValues = watch();

  // Mengisi form dengan data user jika sudah login
  useEffect(() => {
    if (user) {
      setValue('name', user.fullname || '');
      setValue('email', user.email || '');
      setValue('phone', '');
      setValue('address', user.addresses.at(0)?.street || '');
      setValue('city', user.addresses.at(0)?.city || '');
      setValue('postalCode', user.addresses.at(0)?.zipCode || '');
    }
  }, [user, setValue]);

  // Menghitung total harga keranjang
  const calculateTotal = (): number => {
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) return 0;
    
    return cart.cartItems.reduce((total, item) => {
      return total + (Number(item.product.price) * item.quantity);
    }, 0);
  };

  // Format Rupiah
  const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      if (!sessionId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await api.get(`/carts?sessionId=${sessionId}`);
        
        if (response.data && response.status === 200 && response.data.data.length > 0) {
          const cartData = response.data.data[0];
          
          // Jika ini adalah pembelian langsung, filter item berdasarkan productId
          if (directBuy && productId) {
            const filteredItems = cartData.cartItems.filter((item: CartItem) => item.productId === productId);
            setCart({
              ...cartData,
              cartItems: filteredItems
            });
          } else {
            setCart(cartData);
          }
        } else {
          setCart(null);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        console.error('Error loading cart:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [sessionId, directBuy, productId]);

  // Update quantity item di keranjang
  const updateItemQuantity = async (itemId: string, newQuantity: number): Promise<void> => {
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
      }
    } catch (err: any) {
      const errorMessage = 'Gagal memperbarui jumlah item';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Hapus item dari keranjang
  const removeItemFromCart = async (itemId: string): Promise<void> => {
    try {
      setIsUpdating(true);
      
      // Update state secara lokal untuk respons yang lebih cepat
      if (cart) {
        const updatedCart = {
          ...cart,
          cartItems: cart.cartItems.filter(item => item.id !== itemId)
        };
        setCart(updatedCart);
        
        // Hapus dari server
        await api.delete(`/cart-items/${itemId}`, { data: { permanent: true } });
      }
    } catch (err: any) {
      const errorMessage = 'Gagal menghapus item dari keranjang';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error(err);
      
      // Jika gagal, refresh data untuk mendapatkan state terbaru
      const fetchCart = async () => {
        if (!sessionId) return;
        
        try {
          const response = await api.get(`/carts?sessionId=${sessionId}`);
          
          if (response.data && response.status === 200 && response.data.data.length > 0) {
            const cartData = response.data.data[0];
            
            if (directBuy && productId) {
              const filteredItems = cartData.cartItems.filter((item: CartItem) => item.productId === productId);
              setCart({
                ...cartData,
                cartItems: filteredItems
              });
            } else {
              setCart(cartData);
            }
          } else {
            setCart(null);
          }
        } catch (err: any) {
          const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
          setError(errorMessage);
          showNotification(errorMessage, 'error');
          console.error('Error loading cart:', err);
        }
      };
      
      fetchCart();
    } finally {
      setIsUpdating(false);
    }
  };

  // Fungsi submit form dengan validasi
  const onFormSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        const errorMessage = 'Keranjang belanja Anda kosong';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        return;
      }

      // Validasi stok produk
      const outOfStockItems: string[] = [];
      const insufficientStockItems: { name: string; requested: number; available: number }[] = [];
      
      for (const item of cart.cartItems) {
        if (item.product.stock === 0) {
          outOfStockItems.push(item.product.name);
        } else if (item.quantity > item.product.stock) {
          insufficientStockItems.push({
            name: item.product.name,
            requested: item.quantity,
            available: item.product.stock
          });
        }
      }
      
      // Jika ada produk yang habis
      if (outOfStockItems.length > 0) {
        const errorMessage = `Beberapa produk habis: ${outOfStockItems.join(', ')}`;
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        return;
      }
      
      // Jika ada produk dengan stok tidak mencukup
      if (insufficientStockItems.length > 0) {
        const errorMessage = insufficientStockItems
          .map(item => `${item.name} (diminta: ${item.requested}, tersedia: ${item.available})`)
          .join(', ');
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        return;
      }

      // Format tanggal saat ini dalam format ISO
      const currentDate = new Date().toISOString();
      
      // Siapkan data order sesuai dengan struktur yang diharapkan API
      const orderData = {
        userId: cart.userId || null, // Gunakan userId dari cart jika ada, jika tidak null
        orderDate: currentDate,
        totalAmount: calculateTotal(),
        status: "PENDING", // Status default untuk pesanan baru
        email: data.email,
        phone: data.phone,
        address: data.address
      };

      // Buat order
      const orderResponse = await api.post<OrderResponse>('/orders', orderData);
      const orderId = orderResponse.data.data.id;
      
      // Simpan cart items untuk dihapus nanti
      const cartItemsToDelete = [...cart.cartItems];
      
      // Jika ada item-item, kirim ke endpoint order-items satu per satu
      if (cartItemsToDelete.length > 0) {
        // Siapkan data untuk update stok produk
        const stockUpdates: { id: string; stock: number }[] = [];
        
        for (const item of cartItemsToDelete) {
          const orderItemData: OrderItemData = {
            orderId: orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: Number(item.product.price) // Pastikan price adalah number
          };
          
          // Kirim data item ke endpoint order-items
          await api.post('/order-items', orderItemData);
          
          // Siapkan data untuk update stok
          stockUpdates.push({
            id: item.productId,
            stock: item.product.stock - item.quantity
          });
        }
        
        // Update stok produk
        try {
          for (const update of stockUpdates) {
            await api.put(`/products/${update.id}`, {
              stock: update.stock
            });
          }
          
          showNotification('Stok produk berhasil diperbarui', 'success');
        } catch (stockError: any) {
          const errorMessage = 'Gagal memperbarui stok produk';
          console.error('Error updating product stock:', stockError);
          showNotification(errorMessage, 'warning');
          // Tetap lanjutkan proses meskipun update stok gagal
        }
        
        // Hapus semua item cart yang sudah diorder
        try {
          for (const item of cartItemsToDelete) {
            await api.delete(`/cart-items/${item.id}`, { data: { permanent: true } });
          }
          
          // Update state lokal untuk mengosongkan cart
          if (cart) {
            setCart({
              ...cart,
              cartItems: []
            });
          }
        } catch (deleteError: any) {
          console.error('Error deleting cart items after order:', deleteError);
          // Tidak perlu throw error di sini karena order sudah berhasil dibuat
          // Cukup log error untuk debugging
        }
      }
      
      showNotification('Pesanan anda berhasil dibuat, silahkan cek pesanan anda', 'success');
      // Redirect ke halaman konfirmasi dengan ID pesanan
      router.push(`/orders`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat checkout');
      showNotification(err.response?.data?.message || 'Terjadi kesalahan saat checkout', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {directBuy ? 'Checkout - Pembelian Langsung' : 'Checkout'}
          </h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Checkout */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit(onFormSubmit)} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Nama Lengkap
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    id="name"
                    {...register('name')}
                    type="text"
                    placeholder="Nama lengkap"
                    readOnly={!!user} // Menjadikan field read-only jika user sudah login
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    id="email"
                    {...register('email')}
                    type="email"
                    placeholder="Email"
                    readOnly={!!user} // Menjadikan field read-only jika user sudah login
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                    Nomor Telepon
                  </label>
                  <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                    id="phone"
                    {...register('phone')}
                    type="tel"
                    placeholder="Nomor telepon"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Alamat
                  </label>
                  <textarea
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                      errors.address ? 'border-red-500' : ''
                    }`}
                    id="address"
                    {...register('address')}
                    placeholder="Alamat lengkap"
                    rows={3}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs italic mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                      Kota
                    </label>
                    <input
                      className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                        errors.city ? 'border-red-500' : ''
                      }`}
                      id="city"
                      {...register('city')}
                      type="text"
                      placeholder="Kota"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs italic mt-1">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postalCode">
                      Kode Pos
                    </label>
                    <input
                      className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                        errors.postalCode ? 'border-red-500' : ''
                      }`}
                      id="postalCode"
                      {...register('postalCode')}
                      type="text"
                      placeholder="Kode Pos"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-xs italic mt-1">{errors.postalCode.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
                    type="submit"
                    disabled={
                      isSubmitting || 
                      !cart || 
                      cart.cartItems.length === 0 ||
                      cart.cartItems.some(item => item.product.stock === 0) ||
                      cart.cartItems.some(item => item.quantity > item.product.stock)
                    }
                  >
                    {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
                  </button>
                  <button
                    className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                    type="button"
                    onClick={() => router.back()}
                  >
                    Kembali
                  </button>
                </div>
              </form>
            </div>

            {/* Ringkasan Pesanan */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h2>
                
                {cart && cart.cartItems && cart.cartItems.length > 0 ? (
                  <div>
                    <div className="space-y-4 mb-6">
                      {cart.cartItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-4 mb-3">
                            <img
                              src={item.product.imageUrl || "/placeholder-image.jpg"}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                              <p className="text-sm text-gray-500">{formatRupiah(Number(item.product.price))} × {item.quantity}</p>
                              {/* Tambahkan indikator stok */}
                              <div className="flex items-center mt-1">
                                <span className={`text-xs font-medium ${
                                  item.product.stock === 0 
                                    ? 'text-red-600' 
                                    : item.product.stock < 5 
                                      ? 'text-yellow-600' 
                                      : 'text-green-600'
                                }`}>
                                  Stok: {item.product.stock}
                                </span>
                                {item.quantity > item.product.stock && (
                                  <span className="ml-2 text-xs font-medium text-red-600">
                                    Melebihi stok!
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatRupiah(Number(item.product.price) * item.quantity)}
                            </p>
                          </div>
                          
                          {/* Tombol + dan - untuk mengubah jumlah item */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-gray-300 rounded">
                              <button
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isUpdating}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                -
                              </button>
                              <span className="px-2 py-1 text-sm w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating || item.quantity >= item.product.stock}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                +
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeItemFromCart(item.id)}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tambahkan peringatan jika ada produk dengan stok habis atau tidak mencukup */}
                    {(cart.cartItems.some(item => item.product.stock === 0) || 
                      cart.cartItems.some(item => item.quantity > item.product.stock)) && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293-1.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">
                              <span className="font-medium">Perhatian!</span> Beberapa produk dalam keranjang Anda memiliki stok yang tidak mencukup atau sudah habis. Silakan perbarui keranjang Anda sebelum melanjutkan checkout.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatRupiah(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Ongkos Kirim</span>
                        <span className="font-medium">{formatRupiah(0)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-indigo-600">{formatRupiah(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Keranjang belanja Anda kosong</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}