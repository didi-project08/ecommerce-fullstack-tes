// components/OrderCard.tsx

import React from 'react';
import OrderItemCard from './OrderItemCard';

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

interface OrderCardProps {
  order: Order;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  // Format Rupiah
  const formatRupiah = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  // Format tanggal
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fungsi untuk mendapatkan status badge dengan warna yang sesuai
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Terkirim</span>;
      case 'PROCESSING':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Diproses</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Menunggu</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Dibatalkan</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-indigo-600">Pesanan #{order.id.substring(0, 8)}</h3>
          <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
        </div>
        <div className="flex items-center space-x-4">
          {getStatusBadge(order.status)}
          <span className="text-lg font-semibold text-gray-900">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Detail Pesanan:</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-sm font-medium text-gray-900">{order.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Telepon</p>
              <p className="text-sm font-medium text-gray-900">{order.phone}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Alamat Pengiriman</p>
              <p className="text-sm font-medium text-gray-900">{order.address}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Item Pesanan:</h4>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.orderItems.map((item) => (
                <OrderItemCard key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </li>
  );
};

export default OrderCard;