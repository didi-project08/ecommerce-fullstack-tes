// prisma/seed.ts
import { PrismaClient, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as argon from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';

// ==================== INTERFACES ====================

interface UserData {
  id: string;
  fullname: string;
  username: string;
  password: string;
  email: string;
}

interface RoleData {
  id: string;
  name: string;
}

interface PermissionData {
  id: string;
  name: string;
  description?: string;
}

interface RolePermissionData {
  id: string;
  roleId: string;
  permissionsId: string;
}

interface RoleUserData {
  id: string;
  userId: string;
  roleId: string;
}

interface AddressData {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

interface CartData {
  id: string;
  userId: string;
}

interface CartItemData {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
}

interface OrderData {
  id: string;
  userId: string;
  totalAmount: number;
  status: OrderStatus;
  email: string;
  phone: string;
  address: string;
}

interface OrderItemData {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

interface PaymentData {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentDate?: Date;
}

interface UserLogData {
  id: string;
  userId: string;
  ip: string;
  method: string;
  accessUrl: string;
  userAgent?: string;
}

// ==================== HELPER FUNCTIONS ====================

class SeederHelper {
  // Generate UUID with type safety
  static generateUUID(): string {
    return uuidv4();
  }

  // Hash password with type safety
  static async hashPassword(password: string): Promise<string> {
    return await argon.hash(password);
  }

  // Generate user data with type safety
  static generateUserData(index: number, passwordHash: string): UserData {
    return {
      id: this.generateUUID(),
      fullname: index === 0 ? 'Administrator' : faker.person.fullName(),
      username: index === 0 ? 'admin' : faker.internet.username(),
      password: passwordHash,
      email: index === 0 ? 'admin@example.com' : `member${index}@example.com`,
    };
  }

  // Generate role data with type safety
  static generateRoleData(name: string): RoleData {
    return {
      id: this.generateUUID(),
      name,
    };
  }

  // Generate permission data with type safety
  static generatePermissionData(name: string, description?: string): PermissionData {
    return {
      id: this.generateUUID(),
      name,
      description,
    };
  }

  // Generate role permission data with type safety
  static generateRolePermissionData(roleId: string, permissionsId: string): RolePermissionData {
    return {
      id: this.generateUUID(),
      roleId,
      permissionsId,
    };
  }

  // Generate role user data with type safety
  static generateRoleUserData(userId: string, roleId: string): RoleUserData {
    return {
      id: this.generateUUID(),
      userId,
      roleId,
    };
  }

  // Generate address data with type safety
  static generateAddressData(userId: string, isAdmin = false): AddressData {
    return {
      id: this.generateUUID(),
      userId,
      street: isAdmin ? 'Jl. Administrator No. 123' : faker.location.streetAddress(),
      city: isAdmin ? 'Jakarta Selatan' : faker.location.city(),
      state: isAdmin ? 'DKI Jakarta' : faker.location.state(),
      zipCode: isAdmin ? '12530' : faker.location.zipCode(),
      country: 'Indonesia',
      isDefault: true,
    };
  }

  // Generate product data with type safety
  static generateProductData(categories: readonly string[]): ProductData {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const price = parseFloat(faker.commerce.price({ min: 10000, max: 1000000 }));
    
    return {
      id: this.generateUUID(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price,
      category: randomCategory,
      stock: faker.number.int({ min: 1, max: 100 }),
      imageUrl: faker.image.urlPicsumPhotos({ width: 640, height: 480 }),
    };
  }

  // Generate cart data with type safety
  static generateCartData(userId: string): CartData {
    return {
      id: this.generateUUID(),
      userId,
    };
  }

  // Generate cart item data with type safety
  static generateCartItemData(cartId: string, productId: string): CartItemData {
    return {
      id: this.generateUUID(),
      cartId,
      productId,
      quantity: faker.number.int({ min: 1, max: 5 }),
    };
  }

  // Generate order data with type safety
  static generateOrderData(
    userId: string, 
    email: string, 
    address: string, 
    totalAmount: number, 
    status: OrderStatus
  ): OrderData {
    return {
      id: this.generateUUID(),
      userId,
      totalAmount,
      status,
      email,
      phone: faker.phone.number(),
      address,
    };
  }

  // Generate order item data with type safety
  static generateOrderItemData(orderId: string, productId: string, price: number): OrderItemData {
    return {
      id: this.generateUUID(),
      orderId,
      productId,
      quantity: faker.number.int({ min: 1, max: 5 }),
      price,
    };
  }

  // Generate payment data with type safety
  static generatePaymentData(
    orderId: string, 
    amount: number, 
    method: PaymentMethod, 
    status: PaymentStatus
  ): PaymentData {
    return {
      id: this.generateUUID(),
      orderId,
      amount,
      method,
      status,
      paymentDate: status === PaymentStatus.PENDING ? faker.date.recent({ days: 30 }) : undefined,
    };
  }

  // Generate user log data with type safety
  static generateUserLogData(userId: string): UserLogData {
    return {
      id: this.generateUUID(),
      userId,
      ip: faker.internet.ip(),
      method: faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'DELETE']),
      accessUrl: faker.internet.url(),
      userAgent: faker.internet.userAgent(),
    };
  }

  // Calculate total amount with type safety
  static calculateTotalAmount(items: { price: number; quantity: number }[]): number {
    return parseFloat(items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
  }
}

// ==================== SEEDER CLASS ====================

class DatabaseSeeder {
  private prisma: PrismaClient;
  private passwordHash: string;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async seed() {
    console.log('Seeding database...');
    
    try {
      this.passwordHash = await SeederHelper.hashPassword('12345');
      
      await this.seedRoles();
      await this.seedPermissions();
      await this.seedRolePermissions();
      await this.seedUsers();
      await this.seedRoleUsers();
      await this.seedAddresses();
      await this.seedProducts();
      await this.seedCarts();
      await this.seedCartItems();
      await this.seedOrders();
      await this.seedOrderItems();
      await this.seedPayments();
      await this.seedUserLogs();
      
      console.log('Seed data created successfully!');
      
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }

  private async seedRoles() {
    console.log('Creating roles...');
    
    const rolesData = [
      { name: 'administrator' },
      { name: 'member' }
    ];

    for (const roleData of rolesData) {
      let role = await this.prisma.roles.findFirst({
        where: { name: roleData.name }
      });
      
      if (!role) {
        role = await this.prisma.roles.create({
          data: SeederHelper.generateRoleData(roleData.name),
        });
      }
    }

    console.log('Roles created successfully');
  }

  private async seedPermissions() {
    console.log('Creating permissions...');
    
    const permissionsData = [
      { name: 'dashboard:read', description: 'View dashboard' },
      { name: 'users:read', description: 'View users' },
      { name: 'users:create', description: 'Create users' },
      { name: 'users:update', description: 'Update users' },
      { name: 'users:delete', description: 'Delete users' },
      { name: 'roles:read', description: 'View roles' },
      { name: 'roles:create', description: 'Create roles' },
      { name: 'roles:update', description: 'Update roles' },
      { name: 'roles:delete', description: 'Delete roles' },
      { name: 'products:read', description: 'View products' },
      { name: 'products:create', description: 'Create products' },
      { name: 'products:update', description: 'Update products' },
      { name: 'products:delete', description: 'Delete products' },
      { name: 'orders:read', description: 'View orders' },
      { name: 'orders:create', description: 'Create orders' },
      { name: 'orders:update', description: 'Update orders' },
      { name: 'orders:delete', description: 'Delete orders' },
      { name: 'carts:read', description: 'View carts' },
      { name: 'carts:create', description: 'Create carts' },
      { name: 'carts:update', description: 'Update carts' },
      { name: 'carts:delete', description: 'Delete carts' },
      { name: 'cartItems:read', description: 'View cart items' },
      { name: 'cartItems:create', description: 'Create cart items' },
      { name: 'cartItems:update', description: 'Update cart items' },
      { name: 'cartItems:delete', description: 'Delete cart items' },
    ];

    for (const permData of permissionsData) {
      let permission = await this.prisma.permissions.findFirst({
        where: { name: permData.name }
      });
      
      if (!permission) {
        await this.prisma.permissions.create({
          data: SeederHelper.generatePermissionData(permData.name, permData.description),
        });
      }
    }

    console.log('Permissions created successfully');
  }

  private async seedRolePermissions() {
    console.log('Assigning permissions to roles...');
    
    // Get roles
    const adminRole = await this.prisma.roles.findFirst({
      where: { name: 'administrator' }
    });
    
    const memberRole = await this.prisma.roles.findFirst({
      where: { name: 'member' }
    });
    
    if (!adminRole || !memberRole) {
      throw new Error('Roles not found');
    }
    
    // Get all permissions
    const permissions = await this.prisma.permissions.findMany();
    
    // Assign all permissions to admin role
    for (const permission of permissions) {
      const existingRolePermission = await this.prisma.role_permissions.findFirst({
        where: {
          roleId: adminRole.id,
          permissionsId: permission.id // Ubah dari permissionId menjadi permissionsId
        }
      });
      
      if (!existingRolePermission) {
        await this.prisma.role_permissions.create({
          data: SeederHelper.generateRolePermissionData(adminRole.id, permission.id),
        });
      }
    }

    // Assign limited permissions to member role
    const memberPermissions = permissions.filter(p => 
      p.name.startsWith('products:') || 
      p.name.startsWith('orders:') ||
      p.name.startsWith('carts:') ||
      p.name.startsWith('cartItems:') ||
      p.name === 'dashboard:read'
    );
    
    for (const permission of memberPermissions) {
      const existingRolePermission = await this.prisma.role_permissions.findFirst({
        where: {
          roleId: memberRole.id,
          permissionsId: permission.id // Ubah dari permissionId menjadi permissionsId
        }
      });
      
      if (!existingRolePermission) {
        await this.prisma.role_permissions.create({
          data: SeederHelper.generateRolePermissionData(memberRole.id, permission.id),
        });
      }
    }

    console.log('Permissions assigned successfully');
  }

  private async seedUsers() {
    console.log('Creating users...');
    
    // Create admin user
    let adminUser = await this.prisma.users.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminUser) {
      adminUser = await this.prisma.users.create({
        data: SeederHelper.generateUserData(0, this.passwordHash),
      });
    }

    // Create member users
    const memberUsersCount = 10;
    
    for (let i = 1; i <= memberUsersCount; i++) {
      let user = await this.prisma.users.findFirst({
        where: { email: `member${i}@example.com` }
      });
      
      if (!user) {
        await this.prisma.users.create({
          data: SeederHelper.generateUserData(i, this.passwordHash),
        });
      }
    }

    console.log('Users created successfully');
  }

  private async seedRoleUsers() {
    console.log('Assigning roles to users...');
    
    // Get users and roles
    const adminUser = await this.prisma.users.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    const memberUsers = await this.prisma.users.findMany({
      where: {
        email: {
          startsWith: 'member'
        }
      }
    });
    
    const adminRole = await this.prisma.roles.findFirst({
      where: { name: 'administrator' }
    });
    
    const memberRole = await this.prisma.roles.findFirst({
      where: { name: 'member' }
    });
    
    if (!adminUser || !adminRole || !memberRole) {
      throw new Error('Required data not found');
    }
    
    // Assign admin role to admin user
    let adminRoleUser = await this.prisma.role_users.findFirst({
      where: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    
    if (!adminRoleUser) {
      await this.prisma.role_users.create({
        data: SeederHelper.generateRoleUserData(adminUser.id, adminRole.id),
      });
    }

    // Assign member role to member users
    for (const user of memberUsers) {
      let memberRoleUser = await this.prisma.role_users.findFirst({
        where: {
          userId: user.id,
          roleId: memberRole.id
        }
      });
      
      if (!memberRoleUser) {
        await this.prisma.role_users.create({
          data: SeederHelper.generateRoleUserData(user.id, memberRole.id),
        });
      }
    }

    console.log('Roles assigned successfully');
  }

  private async seedAddresses() {
    console.log('Creating addresses...');
    
    // Get users
    const adminUser = await this.prisma.users.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    const memberUsers = await this.prisma.users.findMany({
      where: {
        email: {
          startsWith: 'member'
        }
      }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    // Create address for admin user
    let adminAddress = await this.prisma.address.findFirst({
      where: {
        userId: adminUser.id,
        isDefault: true
      }
    });
    
    if (!adminAddress) {
      await this.prisma.address.create({
        data: SeederHelper.generateAddressData(adminUser.id, true),
      });
    }

    // Create addresses for member users
    for (const user of memberUsers) {
      let existingAddress = await this.prisma.address.findFirst({
        where: {
          userId: user.id,
          isDefault: true
        }
      });
      
      if (!existingAddress) {
        await this.prisma.address.create({
          data: SeederHelper.generateAddressData(user.id),
        });
      }
    }

    console.log('Addresses created successfully');
  }

  private async seedProducts() {
    console.log('Creating products...');
    
    const productCategories = [
      'Elektronik',
      'Aksesoris',
      'Fashion',
      'Home & Living',
      'Sports',
      'Otomotif',
      'Kesehatan',
      'Kecantikan',
      'Buku',
      'Makanan & Minuman'
    ] as const;

    const productsCount = 50;
    
    for (let i = 0; i < productsCount; i++) {
      const existingProduct = await this.prisma.products.findFirst({
        where: { name: `Product ${i}` }
      });
      
      if (!existingProduct) {
        await this.prisma.products.create({
          data: SeederHelper.generateProductData(productCategories),
        });
      }
    }

    console.log('Products created successfully');
  }

  private async seedCarts() {
    console.log('Creating carts...');
    
    // Get users
    const adminUser = await this.prisma.users.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    const memberUsers = await this.prisma.users.findMany({
      where: {
        email: {
          startsWith: 'member'
        }
      }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    // Create cart for admin user
    let adminCart = await this.prisma.carts.findFirst({
      where: { userId: adminUser.id }
    });
    
    if (!adminCart) {
      await this.prisma.carts.create({
        data: SeederHelper.generateCartData(adminUser.id),
      });
    }

    // Create carts for member users
    for (const user of memberUsers) {
      let existingCart = await this.prisma.carts.findFirst({
        where: { userId: user.id }
      });
      
      if (!existingCart) {
        await this.prisma.carts.create({
          data: SeederHelper.generateCartData(user.id),
        });
      }
    }

    console.log('Carts created successfully');
  }

  private async seedCartItems() {
    console.log('Creating cart items...');
    
    // Get products and carts
    const products = await this.prisma.products.findMany();
    const adminUser = await this.prisma.users.findFirst({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    const adminCart = await this.prisma.carts.findFirst({
      where: { userId: adminUser.id }
    });
    
    const memberCarts = await this.prisma.carts.findMany({
      where: {
        userId: {
          in: (await this.prisma.users.findMany({
            where: {
              email: {
                startsWith: 'member'
              }
            }
          })).map(u => u.id)
        }
      }
    });
    
    if (!adminCart || products.length === 0) {
      console.log('Skipping cart items - no carts or products found');
      return;
    }
    
    // Add items to admin cart
    const adminCartProducts = faker.helpers.arrayElements(products, 3);
    for (const product of adminCartProducts) {
      const existingCartItem = await this.prisma.cartItems.findFirst({
        where: {
          cartId: adminCart.id,
          productId: product.id
        }
      });
      
      if (!existingCartItem) {
        await this.prisma.cartItems.create({
          data: SeederHelper.generateCartItemData(adminCart.id, product.id),
        });
      }
    }

    // Add items to member carts
    for (const cart of memberCarts) {
      if (products.length > 0) {
        const cartProducts = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 5 }));
        for (const product of cartProducts) {
          const existingCartItem = await this.prisma.cartItems.findFirst({
            where: {
              cartId: cart.id,
              productId: product.id
            }
          });
          
          if (!existingCartItem) {
            await this.prisma.cartItems.create({
              data: SeederHelper.generateCartItemData(cart.id, product.id),
            });
          }
        }
      }
    }

    console.log('Cart items created successfully');
  }

  private async seedOrders() {
    console.log('Creating orders...');
    
    // Get users and addresses
    const users = await this.prisma.users.findMany();
    const products = await this.prisma.products.findMany();
    const orderStatuses = Object.values(OrderStatus);
    
    const ordersCount = 20;
    
    for (let i = 0; i < ordersCount; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const randomAddress = await this.prisma.address.findFirst({
        where: { userId: randomUser.id }
      });
      
      if (!randomAddress) continue;
      
      // Generate random order items (1-5 items per order)
      const itemsCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, itemsCount);
      
      const orderItems = selectedProducts.map(product => ({
        product,
        quantity: faker.number.int({ min: 1, max: 5 })
      }));
      
      const totalAmount = SeederHelper.calculateTotalAmount(
        orderItems.map(item => ({
          price: Number(item.product.price), // Konversi Decimal ke number
          quantity: item.quantity
        }))
      );
      
      const randomStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      await this.prisma.orders.create({
        data: SeederHelper.generateOrderData(
          randomUser.id,
          randomUser.email,
          `${randomAddress.street}, ${randomAddress.city}, ${randomAddress.zipCode}`,
          totalAmount,
          randomStatus
        ),
      });
    }

    console.log('Orders created successfully');
  }

  private async seedOrderItems() {
    console.log('Creating order items...');
    
    // Get orders and products
    const orders = await this.prisma.orders.findMany();
    const products = await this.prisma.products.findMany();
    
    for (const order of orders) {
      // Generate random order items (1-5 items per order)
      const itemsCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, itemsCount);
      
      for (const product of selectedProducts) {
        const quantity = faker.number.int({ min: 1, max: 5 });
        
        const existingOrderItem = await this.prisma.orderItems.findFirst({
          where: {
            orderId: order.id,
            productId: product.id
          }
        });
        
        if (!existingOrderItem) {
          await this.prisma.orderItems.create({
            data: SeederHelper.generateOrderItemData(
              order.id, 
              product.id, 
              Number(product.price) // Konversi Decimal ke number
            ),
          });
        }
      }
    }

    console.log('Order items created successfully');
  }

  private async seedPayments() {
    console.log('Creating payments...');
    
    // Get orders
    const orders = await this.prisma.orders.findMany();
    const paymentMethods = Object.values(PaymentMethod);
    const paymentStatuses = Object.values(PaymentStatus);
    
    for (const order of orders) {
      // Not all orders have payments (e.g., pending orders)
      if (Math.random() > 0.3) { // 70% of orders have payments
        const randomMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const randomStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        
        // Convert Decimal to number untuk perhitungan
        const orderTotal = Number(order.totalAmount);
        
        // Some orders have partial payments
        const isPartialPayment = Math.random() > 0.7; // 30% of payments are partial
        const paymentAmount = isPartialPayment 
          ? parseFloat((orderTotal * faker.number.float({ min: 0.3, max: 0.7 })).toFixed(2))
          : orderTotal;
        
        const existingPayment = await this.prisma.payments.findFirst({
          where: { orderId: order.id }
        });
        
        if (!existingPayment) {
          await this.prisma.payments.create({
            data: SeederHelper.generatePaymentData(
              order.id,
              paymentAmount, // Sekarang sudah number, bukan Decimal
              randomMethod,
              randomStatus
            ),
          });
        }
      }
    }

    console.log('Payments created successfully');
  }

  private async seedUserLogs() {
    console.log('Creating user logs...');
    
    // Get users
    const users = await this.prisma.users.findMany();
    const userLogsCount = 100;
    
    for (let i = 0; i < userLogsCount; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      
      await this.prisma.user_logs.create({
        data: SeederHelper.generateUserLogData(randomUser.id),
      });
    }

    console.log('User logs created successfully');
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// ==================== MAIN FUNCTION ====================

async function main() {
  const seeder = new DatabaseSeeder();
  
  try {
    await seeder.seed();
  } catch (error) {
    console.error('Error in seeding process:', error);
    process.exit(1);
  } finally {
    await seeder.disconnect();
  }
}

main();