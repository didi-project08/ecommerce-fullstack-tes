"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useSession } from "../context/SessionContext";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string; // API mengembalikan price sebagai string, bukan number
  stock: number;
  imageUrl: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(false);
  const router = useRouter();
  const { addToCart, isLoading: cartLoading } = useCart();
  const { sessionId } = useSession();
  
  // Ref untuk Intersection Observer
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Setup Intersection Observer untuk lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Hentikan observasi setelah elemen terlihat
            if (cardRef.current) {
              observer.unobserve(cardRef.current);
            }
          }
        });
      },
      {
        root: null, // Menggunakan viewport sebagai root
        rootMargin: '50px', // Mulai loading 50px sebelum elemen masuk viewport
        threshold: 0.1 // Trigger saat 10% elemen terlihat
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Fungsi untuk menangani loading gambar
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleIncrement = (): void => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = (): void => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = async (): Promise<void> => {
    setIsAdding(true);
    try {
      await addToCart(product.id, quantity);
      // Reset quantity kembali ke 1 setelah berhasil menambah ke keranjang
      setQuantity(1);
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async (): Promise<void> => {
    setIsAdding(true);
    try {
      // Tambahkan produk ke keranjang
      await addToCart(product.id, quantity);
      
      setQuantity(1);
      
      // Redirect ke halaman checkout dengan parameter productId untuk menandakan ini adalah pembelian langsung
      router.push(`/checkout?sessionId=${sessionId}&directBuy=true&productId=${product.id}`);
    } catch (error) {
      console.error("Failed to process direct buy:", error);
    } finally {
      setIsAdding(false);
    }
  };

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
    <div 
      ref={cardRef}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="w-full h-48 bg-gray-200 relative overflow-hidden">
        {/* Placeholder untuk gambar yang belum dimuat */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="animate-pulse bg-gray-300 w-full h-full"></div>
          </div>
        )}
        
        {/* Gambar produk - hanya dimuat jika card sudah dalam viewport */}
        {isInView && (
          <img
            ref={imageRef}
            src={product.imageUrl || "/placeholder-image.jpg"}
            alt={product.name}
            className={`w-full h-48 object-cover transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={handleImageLoad}
            onError={() => setIsImageLoaded(true)} // Tetap tampilkan placeholder jika gambar gagal dimuat
          />
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <p className="text-gray-600 mt-1">{product.category}</p>
        <p className="text-2xl font-bold text-indigo-600 mt-2">
          {formatRupiah(product.price)}
        </p>
        
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">Stok: {product.stock}</p>
          
          <div className="flex items-center border border-gray-300 rounded">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <span className="px-2 py-1 text-sm w-8 text-center">{quantity}</span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= product.stock}
              className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={isAdding || cartLoading || product.stock === 0 || !sessionId}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding || cartLoading ? "Menambah..." : "+ Keranjang"}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isAdding || cartLoading || product.stock === 0 || !sessionId}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}