
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { getRoleUser, getAllRoles, getRolePermissions } from '../decorators/roles-permissions.decorators';
import { JwtPayload } from 'src/auth/types/jwtPayload.type';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RPGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<any> {
        const isPublic = this.reflector.get<boolean>( "isPublic", context.getHandler() );
        if (isPublic) return true
        
        const request = context.switchToHttp().getRequest();
        const user = request.user as JwtPayload;
        const roleUser = await getRoleUser(user?.id)
        const requiredRoles = await getAllRoles();

        let response: boolean;

        //START CHECK USER ROLE
        if (!roleUser || roleUser == undefined || !requiredRoles) throw new HttpException("It looks like you don't have any role to access this resource!!", HttpStatus.FORBIDDEN)
        if ((roleUser.roles.name).toLowerCase().toUpperCase() === 'ADMINISTRATOR') return true;
        response = requiredRoles.some((role) => roleUser.roles.name.includes(role));
        if (!response) throw new HttpException("It looks like your role doesn't exist in our system!!", HttpStatus.FORBIDDEN)
        //END CHECK USER ROLE

        //START GET USER PERMISSION
        const permissionUser = await getRolePermissions(roleUser.roleId)
        if (permissionUser.length < 1) throw new HttpException("It looks like you don't have any permission to access resources!!", HttpStatus.FORBIDDEN)
        const requirePermission = this.reflector.getAllAndOverride('permission', [
            context.getHandler(),
            context.getClass(),
        ])
        if (!requirePermission) throw new HttpException("Please check this endpoint. It looks like no permissions have been applied yet!!", HttpStatus.FORBIDDEN)
        if (!permissionUser || permissionUser == null) throw new HttpException("This user does not have permissions!!", HttpStatus.FORBIDDEN)
        //END GET USER PERMISSION

        //START CHECK USER PERMISSION
        response = requirePermission.some((permission) => {
            let permiss = permissionUser.filter((field) => field.permissions.name.includes(permission))
            if (permiss.length) { return true; } else { throw new HttpException(`It looks like you don't have permission [${permission}] to access this resource!!`, HttpStatus.FORBIDDEN); }
        })
        //END CHECK USER PERMISSION

        return response;
    }
}
