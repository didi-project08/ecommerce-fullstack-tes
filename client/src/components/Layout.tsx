// components/Layout.tsx
import { ReactNode, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthContext } from "../context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Pastikan kita berada di sisi klien
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!auth) {
    throw new Error('Layout must be used within AuthProvider');
  }

  const { user, loading, logout } = auth;

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      router.push("/");
    }
  };

  console.log(user)

  // Jika belum di sisi klien atau masih loading, tampilkan loading
  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold">
                    {process.env.NEXT_PUBLIC_SITE_NAME}
                  </h1>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="text-sm text-gray-500">Memuat...</div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">
                  {process.env.NEXT_PUBLIC_SITE_NAME}
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link href="/products" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Produk
                  </Link>
                  <Link href="/carts" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Keranjang
                  </Link>
                  <Link href="/orders" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Pesanan
                  </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {user ? (
                <div className="flex items-center">
                  <span className="mr-4 text-sm text-gray-700">
                    Halo, {user.fullname}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}