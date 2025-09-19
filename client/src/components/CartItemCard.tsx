"use client";

import { useState } from 'react';

interface CartItem {
  id: string;
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

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  isUpdating: boolean;
}

export default function CartItemCard({ item, onUpdateQuantity, onRemove, isUpdating }: CartItemCardProps) {
  const [quantity, setQuantity] = useState<number>(item.quantity);
  const [isUpdatingItem, setIsUpdatingItem] = useState<boolean>(false);

  const handleIncrement = async (): Promise<void> => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setIsUpdatingItem(true);
    try {
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      // Kembalikan ke nilai semula jika gagal
      setQuantity(quantity);
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleDecrement = async (): Promise<void> => {
    if (quantity <= 1) return;
    
    const newQuantity = quantity - 1;
    setQuantity(newQuantity);
    setIsUpdatingItem(true);
    try {
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      // Kembalikan ke nilai semula jika gagal
      setQuantity(quantity);
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (isUpdating || isUpdatingItem) return;
    
    setIsUpdatingItem(true);
    try {
      await onRemove(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsUpdatingItem(false);
    }
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

  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-center">
        <div className="min-w-0 flex-1 flex items-center">
          <div className="flex-shrink-0">
            <img
              className="h-16 w-16 rounded-md object-cover"
              src={item.product.imageUrl || "/placeholder-image.jpg"}
              alt={item.product.name || "Product"}
            />
          </div>
          <div className="min-w-0 flex-1 px-4">
            <div>
              <p className="text-sm font-medium text-indigo-600 truncate">
                {item.product.name || `Product #${item.product.id}`}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {formatRupiah(Number(item.product.price))} × {item.quantity}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-2">
            <div className="flex items-center border border-gray-300 rounded">
              <button
                onClick={handleDecrement}
                disabled={isUpdating || isUpdatingItem || quantity <= 1}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="px-2 py-1 text-sm">{quantity}</span>
              <button
                onClick={handleIncrement}
                disabled={isUpdating || isUpdatingItem}
                className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <button
              onClick={handleRemove}
              disabled={isUpdating || isUpdatingItem}
              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <p className="text-sm font-medium text-gray-900">
          Subtotal: {formatRupiah(Number(item.product.price) * item.quantity)}
        </p>
      </div>
    </li>
  );
}