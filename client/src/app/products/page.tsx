"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '../../components/Layout';
import ProductCard from '../../components/ProductCard';
import api from '../../utils/api';

// Interface untuk data produk
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  imageUrl: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
}

// Interface untuk response API
interface ProductsResponse {
  statusCode: number;
  total: number;
  data: Product[];
}

// Interface untuk error API
interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
  code?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; type: 'api' | 'network' | 'validation' } | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [isClient, setIsClient] = useState<boolean>(false);
  const productsPerPage: number = 10;
  
  // Refs untuk menyimpan referensi ke input elements
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const orderBySelectRef = useRef<HTMLSelectElement>(null);
  
  // State untuk menyimpan nilai input sementara sebelum diterapkan
  const [tempSearchTerm, setTempSearchTerm] = useState<string>('');
  const [tempSelectedCategory, setTempSelectedCategory] = useState<string>('');
  const [tempOrderBy, setTempOrderBy] = useState<string>('asc');
  
  // Flag untuk mencegah pemanggilan API ganda
  const isFetchingRef = useRef<boolean>(false);
  
  // Timer untuk debounce search
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pastikan kita berada di sisi klien
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchCategories();
    }
  }, [isClient]);

  // Buat query parameters yang stabil
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: currentPage.toString(),
      rows: productsPerPage.toString()
    };
    
    // Add search parameter if exists
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    // Add order parameter if exists
    if (orderBy) {
      params.orderBy = orderBy;
    }
    
    return params;
  }, [currentPage, productsPerPage, searchTerm, orderBy]);

  useEffect(() => {
    if (isClient && !isFetchingRef.current) {
      fetchProducts();
    }
  }, [queryParams, isClient, selectedCategory]);

  const fetchCategories = async (): Promise<void> => {
    try {
      const response = await api.get<ProductsResponse>('/products');
      if (!response?.data?.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid data format received from API');
      }
      
      const uniqueCategories = Array.from(
        new Set(
          response.data.data
            .map((product: Product) => product?.category)
            .filter((category): category is string => Boolean(category)) 
        )
      );
      
      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
      } else {
        console.warn('No categories found in products data');
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError({
        message: 'Gagal memuat kategori produk. Silakan coba lagi nanti.',
        type: 'api'
      });
      setCategories([]);
    }
  };

  const fetchProducts = useCallback(async (): Promise<void> => {
    // Cegah pemanggilan API ganda
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      let apiUrl = '/products';
      
      // Jika kategori dipilih, gunakan endpoint khusus
      if (selectedCategory) {
        apiUrl = `/products?filter=category=${selectedCategory}`;
      }
      
      const response = await api.get<ProductsResponse>(apiUrl, { params: queryParams });
      
      if (response.data && response.data.data) {
        setProducts(response.data.data);
        setTotalProducts(response.data.total);
      } else {
        setError({
          message: 'Format data produk tidak valid',
          type: 'validation'
        });
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      
      // Handle different types of errors
      if (!apiErr.response && !navigator.onLine) {
        setError({
          message: 'Tidak ada koneksi internet. Silakan periksa koneksi Anda.',
          type: 'network'
        });
      } else if (apiErr.response?.status === 404) {
        setError({
          message: 'Data produk tidak ditemukan',
          type: 'api'
        });
      } else if (apiErr.response?.status === 500) {
        setError({
          message: 'Terjadi kesalahan pada server. Silakan coba lagi nanti',
          type: 'api'
        });
      } else if (apiErr.response?.data?.message || apiErr.response?.data?.error) {
        setError({
          message: apiErr.response.data.message || apiErr.response.data.error || 'Gagal memuat produk',
          type: 'api'
        });
      } else {
        setError({
          message: 'Gagal memuat produk. Silakan coba lagi',
          type: 'api'
        });
      }
      
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [queryParams, selectedCategory, isClient]);

  // Apply search with debounce
  useEffect(() => {
    if (!isClient) return;
    
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // Set new timer
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(tempSearchTerm);
      setCurrentPage(1);
    }, 500); // 500ms delay
    
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [tempSearchTerm, isClient]);

  // Apply category filter
  useEffect(() => {
    if (!isClient) return;
    
    setSelectedCategory(tempSelectedCategory);
    setCurrentPage(1);
  }, [tempSelectedCategory, isClient]);

  // Apply order filter
  useEffect(() => {
    if (!isClient) return;
    
    setOrderBy(tempOrderBy);
    setCurrentPage(1);
  }, [tempOrderBy, isClient]);

  const handlePageChange = (pageNumber: number): void => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const resetFilters = useCallback(() => {
    setTempSelectedCategory('');
    setTempSearchTerm('');
    setTempOrderBy('asc');
    setCurrentPage(1);
    setError(null); // Clear error when resetting filters
    
    // Reset focus to search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // Fokus ke input pencarian setelah reset filter
    if (tempSearchTerm === '' && tempSelectedCategory === '' && tempOrderBy === 'asc') {
      requestAnimationFrame(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      });
    }
  }, [tempSearchTerm, tempSelectedCategory, tempOrderBy, resetFilters, isClient]);

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  // Tampilkan loading state saat masih di sisi server atau sedang memuat data
  if (!isClient || isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Fungsi untuk merender error message berdasarkan tipe error
  const renderErrorMessage = () => {
    if (!error) return null;
    
    let bgColor = 'bg-red-100';
    let borderColor = 'border-red-400';
    let textColor = 'text-red-700';
    let icon = (
      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
    
    if (error.type === 'network') {
      bgColor = 'bg-yellow-100';
      borderColor = 'border-yellow-400';
      textColor = 'text-yellow-700';
      icon = (
        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <div className={`${bgColor} ${borderColor} border ${textColor} px-4 py-3 rounded mb-4 flex items-start`}>
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            {error.message}
          </p>
          {error.type === 'network' && (
            <div className="mt-2">
              <button
                onClick={() => fetchProducts()}
                className="text-sm font-medium underline"
              >
                Coba lagi
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Daftar Produk</h1>
          
          {/* Error Message */}
          {renderErrorMessage()}

          {/* Filter Section */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-3">Filter Produk</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kategori</label>
                <select
                  ref={categorySelectRef}
                  value={tempSelectedCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setTempSelectedCategory(e.target.value);
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Urutkan</label>
                <select
                  ref={orderBySelectRef}
                  value={tempOrderBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setTempOrderBy(e.target.value);
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="asc">Harga Terendah</option>
                  <option value="desc">Harga Tertinggi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cari Produk</label>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={tempSearchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setTempSearchTerm(e.target.value);
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  placeholder="Nama produk..."
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Reset Filter
              </button>
              
              <div className="text-sm text-gray-500">
                Menampilkan {products.length} dari {totalProducts} produk
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada produk</h3>
              <p className="mt-1 text-sm text-gray-500">
                {error ? 'Silakan coba lagi dengan filter yang berbeda' : 'Tidak ada produk yang sesuai dengan filter.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}