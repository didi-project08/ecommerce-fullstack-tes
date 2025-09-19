import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AtGuard } from './common/guards';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/Users/users.module';
import { RolesModule } from './modules/Roles/roles.module';
import { RoleUsersModule } from './modules/RoleUsers/roleUsers.module';
import { RolePermissionsModule } from './modules/RolePermissions/rolePermissions.module';
import { PermissionGroupsModule } from './modules/PermissionGroups/permissionGroups.module';
import { PermissionsModule } from './modules/Permissions/permissions.module';
import { ProductsModule } from './modules/Products/products.module';
import { CartsModule } from './modules/Carts/carts.module';
import { CartItemsModule } from './modules/CartItems/cartItems.module';
import { OrdersModule } from './modules/Orders/orders.module';
import { OrderItemsModule } from './modules/OrderItems/orderItems.module';
import { RPGuard } from './common/guards/rp.guard';
import { ApplicationsModule } from './modules/applications/applications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ApplicationsModule,
    UsersModule,
    RolesModule,
    RoleUsersModule,
    RolePermissionsModule,
    PermissionGroupsModule,
    PermissionsModule,
    ProductsModule,
    CartsModule,
    CartItemsModule,
    OrdersModule,
    OrderItemsModule,
    RouterModule.register([
      {
        path: 'api',
        children: [
          {
            path: 'auth',
            module: AuthModule,
          },
          {
            path: 'app',
            module: ApplicationsModule,
          },
          {
            path: 'users',
            module: UsersModule,
          },
          {
            path: 'roles',
            module: RolesModule,
          },
          {
            path: 'role-users',
            module: RoleUsersModule,
          },
          {
            path: 'role-permissions',
            module: RolePermissionsModule,
          },
          {
            path: 'permission-groups',
            module: PermissionGroupsModule,
          },
          {
            path: 'permissions',
            module: PermissionsModule,
          },
          {
            path: 'products',
            module: ProductsModule,
          },
          {
            path: 'carts',
            module: CartsModule,
          },
          {
            path: 'cart-items',
            module: CartItemsModule,
          },
          {
            path: 'orders',
            module: OrdersModule,
          },
          {
            path: 'order-items',
            module: OrderItemsModule,
          },
        ],
      },
    ]),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: RPGuard
    },
  ],
})
export class AppModule {}
