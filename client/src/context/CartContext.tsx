"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from './SessionContext';
import api from '../utils/api';
import { AuthContext } from "./AuthContext";
import { useNotification } from './NotificationContext';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
}

interface Cart {
  id: string;
  userId?: string;
  sessionId: string;
  items: CartItem[];
}

interface CartContextType {
  cart: Cart | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const auth = useContext(AuthContext);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { sessionId } = useSession();
  const { showNotification } = useNotification();
  
  if (!auth) {
    throw new Error('useCart must be used within AuthProvider');
  }
  const { user } = auth;

  // Fungsi untuk memuat keranjang
  const refreshCart = async (): Promise<void> => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/carts?filter=sessionId=${sessionId}`);
      
      if (response.data && response.status === 200 && response.data.data.length > 0) {
        setCart(response.data.data[0]);
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

  // Fungsi untuk menambahkan produk ke keranjang
  const addToCart = async (productId: string, quantity: number = 1): Promise<void> => {
    if (!sessionId) {
      const errorMessage = 'Session ID tidak tersedia. Silakan refresh halaman.';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Dapatkan atau buat keranjang
      let cartData: any;
      
      if (user?.carts && user.carts.length > 0) {
        // Gunakan keranjang yang sudah ada
        const cartResponse = await api.get(`/carts?filter=sessionId=${sessionId}`);
        if (cartResponse.data && cartResponse.status === 200 && cartResponse.data.data.length > 0) {
          cartData = cartResponse.data.data[0];
        } else {
          throw new Error('Failed to get existing cart');
        }
      } else {
        // Buat keranjang baru
        const cartResponse = await api.post('/carts', {
          sessionId,
        });
        
        if (!cartResponse.data || cartResponse.status !== 200) {
          throw new Error('Failed to create cart');
        }
        
        cartData = cartResponse.data.data;
      }

      // Cek apakah item sudah ada di keranjang
      const existingItemsResponse = await api.get(`/cart-items?filter=cartId=${cartData.id}`);
      
      if (existingItemsResponse.data && 
          existingItemsResponse.status === 200 && 
          existingItemsResponse.data.data && 
          existingItemsResponse.data.data.length > 0) {
        
        // Cari item yang sesuai dengan productId
        const existingItem = existingItemsResponse.data.data.find(
          (item: any) => item.productId === productId
        );
        
        if (existingItem) {
          // Jika item sudah ada, update quantity
          const updateResponse = await api.put(`/cart-items/${existingItem.id}`, {
            quantity: existingItem.quantity + quantity,
          });
          
          if (!updateResponse.data || updateResponse.status !== 200) {
            throw new Error('Failed to update cart item');
          }
        } else {
          // Jika item belum ada, tambahkan item baru
          try {
            const addItemResponse = await api.post('/cart-items', {
              cartId: cartData.id,
              productId,
              quantity,
            });
            
            if (!addItemResponse.data || addItemResponse.status !== 200) {
              throw new Error('Failed to add item to cart');
            }
          } catch (addError: any) {
            // Tangani error constraint unik
            if (addError.response?.status === 409 || 
                addError.response?.data?.message?.includes('unique constraint')) {
              
              // Jika error karena constraint unik, coba dapatkan item yang sudah ada dan update
              const itemsResponse = await api.get(`/cart-items?filter=cartId=${cartData.id}&productId=${productId}`);
              
              if (itemsResponse.data && 
                  itemsResponse.status === 200 && 
                  itemsResponse.data.data && 
                  itemsResponse.data.data.length > 0) {
                
                const itemToUpdate = itemsResponse.data.data[0];
                const updateResponse = await api.put(`/cart-items/${itemToUpdate.id}`, {
                  quantity: itemToUpdate.quantity + quantity,
                });
                
                if (!updateResponse.data || updateResponse.status !== 200) {
                  throw new Error('Failed to update cart item after conflict');
                }
              } else {
                throw new Error('Could not find existing cart item after conflict');
              }
            } else {
              // Jika error bukan karena constraint unik, lempar error
              throw addError;
            }
          }
        }
      } else {
        // Jika keranjang kosong, tambahkan item baru
        try {
          const addItemResponse = await api.post('/cart-items', {
            cartId: cartData.id,
            productId,
            quantity,
          });
          
          if (!addItemResponse.data || addItemResponse.status !== 200) {
            throw new Error('Failed to add item to cart');
          }
        } catch (addError: any) {
          // Tangani error constraint unik
          if (addError.response?.status === 409 || 
              addError.response?.data?.message?.includes('unique constraint')) {
            
            // Jika error karena constraint unik, coba dapatkan item yang sudah ada dan update
            const itemsResponse = await api.get(`/cart-items?filter=cartId=${cartData.id}&productId=${productId}`);
            
            if (itemsResponse.data && 
                itemsResponse.status === 200 && 
                itemsResponse.data.data && 
                itemsResponse.data.data.length > 0) {
              
              const itemToUpdate = itemsResponse.data.data[0];
              const updateResponse = await api.put(`/cart-items/${itemToUpdate.id}`, {
                quantity: itemToUpdate.quantity + quantity,
              });
              
              if (!updateResponse.data || updateResponse.status !== 200) {
                throw new Error('Failed to update cart item after conflict');
              }
            } else {
              throw new Error('Could not find existing cart item after conflict');
            }
          } else {
            // Jika error bukan karena constraint unik, lempar error
            throw addError;
          }
        }
      }

      // Refresh cart data setelah menambah item
      await refreshCart();

      showNotification('Produk berhasil ditambahkan ke keranjang', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error adding to cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Memuat keranjang saat komponen dimount dan sessionId berubah
  useEffect(() => {
    refreshCart();
  }, [sessionId]);

  return (
    <CartContext.Provider value={{ cart, addToCart, isLoading, error, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};