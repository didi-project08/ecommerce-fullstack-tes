# E-Commerce Fullstack Application

A complete e-commerce solution built with Next.js (frontend) and NestJS (backend).

## 🚀 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: MySQL
- **Authentication**: JWT
- **Containerization**: Docker

## 📦 Project Structure

    ecommerce-fullstack/
        ├── backend/ # NestJS API
        │ ├── src/
        │ ├── prisma/
        │ └── package.json
        ├── frontend/ # Next.js application
        │ ├── src/
        │ ├── public/
        │ └── package.json
        ├── docker-compose.yml # Docker setup
        └── README.md

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ecommerce-fullstack

Install dependencies
bash

npm run install:all

Setup environment variables
bash

# Server
cp server/.env.example server/.env

# Client  
cp client/.env.local.example client/.env.local

Setup database
bash

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database
npm run db:seed

🚀 Development

    Start development servers
    bash

npm run dev

    Server: http://localhost:4444

    Client: http://localhost:3000

Run with Docker
bash

docker-compose up -d

📋 Available Scripts

    npm run dev - Start both frontend and backend in development mode

    npm run build - Build both applications for production

    npm run start - Start both applications in production mode

    npm run lint - Run linting for both applications

    npm run db:generate - Generate Prisma client

    npm run db:push - Push database schema

    npm run db:seed - Seed database with sample data

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

📦 Deployment
Vercel (Frontend) + Railway (Backend)

    Frontend on Vercel
    bash

# Connect your GitHub repo to Vercel
# Set environment variables in Vercel dashboard

Backend on Railway
bash

# Connect your GitHub repo to Railway
# Set environment variables in Railway dashboard
# Add MySQL plugin

Docker Deployment
bash

# Build and run with Docker
docker-compose up --build

# Production build
docker-compose -f docker-compose.prod.yml up --build

🤝 Contributing

    Fork the project

    Create your feature branch (git checkout -b feature/AmazingFeature)

    Commit your changes (git commit -m 'Add some AmazingFeature')

    Push to the branch (git push origin feature/AmazingFeature)

    Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
🆘 Support

If you have any questions or issues, please open an issue on GitHub or contact the development team.
text


## 10. Development Workflow

### Untuk development:
```bash
# Install semua dependencies
npm run install:all

# Setup database
npm run db:generate
npm run db:push  
npm run db:seed

# Jalankan development servers
npm run dev

Untuk production:
bash

# Build aplikasi
npm run build

# Jalankan dengan Docker
docker-compose up --build