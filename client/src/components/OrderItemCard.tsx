// components/OrderItemCard.tsx

import React from 'react';

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

interface OrderItemCardProps {
  item: OrderItem;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item }) => {
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

  return (
    <tr>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img className="h-10 w-10 rounded-md object-cover" src={item.products.imageUrl} alt={item.products.name} />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{item.products.name}</div>
            <div className="text-sm text-gray-500">{item.products.category}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatRupiah(item.price)}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {item.quantity}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {formatRupiah(parseFloat(item.price) * item.quantity)}
      </td>
    </tr>
  );
};

export default OrderItemCard;