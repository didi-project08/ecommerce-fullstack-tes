# E-Commerce Fullstack Application

A complete e-commerce solution built with Next.js (frontend) and NestJS (backend).

## 🚀 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: MySQL
- **Authentication**: JWT

## 📦 Project Structure

    ecommerce-fullstack/
        ├── client/                 # Next.js Frontend
        │   ├── src/
        │   ├── public/
        │   ├── package.json
        │   └── ...
        ├── server/                 # NestJS Backend
        │   ├── src/
        │   ├── prisma/
        │   ├── package.json
        │   └── ...
        ├── package.json            # Root package.json untuk scripts
        ├── docker-compose.yml      # Docker setup
        └── README.md

## Disclaimer Dulu Hehe

Aplikasi ini dibuat khusus untuk keperluan tes teknis sebagai bagian dari proses seleksi kandidat Fullstack Developer.
Catatan Penting

    Tujuan Pengembangan: Aplikasi ini murni dibuat sebagai demonstrasi kemampuan teknis (technical skills assessment) dan tidak ditujukan untuk penggunaan produksi (production-ready) atau tujuan komersial.

    Keterbatasan Fitur: Fitur-fitur yang diimplementasikan mungkin tidak lengkap dan difokuskan untuk memenuhi requirement yang ditentukan dalam tahap tes. Beberapa aspek seperti error handling yang komprehensif, security hardening, testing suite yang lengkap, atau optimasi performa mungkin belum sepenuhnya diimplementasikan.

    Data dan Konten: Semua data yang digunakan mungkin merupakan data contoh (dummy data) dan bukan data real.

    Kode Contoh: Kode dalam proyek ini merupakan hasil pengerjaan kandidat dan boleh digunakan sebagai referensi atau bahan evaluasi semata.

Terima kasih atas perhatiannya.

Disclaimer ini dibuat untuk keperluan transparansi proses rekrutmen.

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/didi-project08/ecommerce-fullstack-tes.git
   cd ecommerce-fullstack

Install dependencies

    npm run install:all

Setup environment variables

# Server
cp server/.env.example server/.env

# Client  
cp client/.env.local.example client/.env.local

Setup database

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database
npm run db:seed

🚀 Development

    Start development servers

    npm run dev
    Server: http://localhost:4444
    Client: http://localhost:3000
    
    Docs API: http://localhost:4444/docs

    Akses Client login default
        email: admin@example.com
        password: 12345

🗃️ Database

The application uses MySQL with Prisma ORM. Key models include:

    Users - User accounts and authentication

    Products - Product catalog

    Orders - Customer orders

    Carts - Shopping cart functionality

🔐 Authentication

JWT-based authentication with the following features:

    User registration and login

    Protected routes

    Role-based access control

    Password hashing with argon2

## Development Workflow

### Untuk development:
```bash
# Install semua dependencies
npm run install:all

# Setup database
npm run db:generate
npm run db:push  
npm run db:seed

# Untuk melihat prisma studio
npm run db:studio

# Jalankan development servers
npm run dev

Untuk production:
bash

# Build aplikasi
npm run build

# Jalankan dengan Docker
docker-compose up --build
```

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
🆘 Support

If you have any questions or issues, please open an issue on GitHub or contact the author.