import type { NextConfig } from "next";

const nextConfig = {
  // Konfigurasi lainnya
  reactStrictMode: true,
  // swcMinify: true,

  turbopack: {
    root: __dirname // Tentukan root directory
  },

  webpack: (config:any) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
  
  // Anda bisa menambahkan konfigurasi environment variables di sini
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Untuk mengaktifkan trailing slashes (opsional)
  trailingSlash: false,
  
  // Untuk base path jika aplikasi di-deploy di subfolder
  basePath: '',
  
  // Untuk rewrites dan redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
}

export default nextConfig;
