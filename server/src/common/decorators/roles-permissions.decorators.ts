import { SetMetadata } from '@nestjs/common'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllRoles = async () => {
    const role = await prisma.roles.findMany({
        select: {
            name: true,
        }
    })

    let result: string[] = []
    role.map((field) => {
        result.push(field.name)
    })
    return result;
}
export const getRolePermissions = async (roleId: string) => {
    const rolePermissions = await prisma.role_permissions.findMany({
        select: {
            roleId: true,
            permissionsId: true,
            permissions: {
                select: {
                    name: true,
                }
            }
        },
        where: {
            roleId,
        }
    })
    return rolePermissions;
}
export const getRoleUser = async (userId: string) => {
    try {
        if (!userId) return undefined
        const role = await prisma.role_users.findFirst({
            select: {
                id: true,
                userId: true,
                roleId: true,
                roles: {
                    select: {
                        name: true,
                    }
                }
            },
            where: {
                userId,
            }
        })
        return role;
    } catch (error) {
        console.log(error)
    }
}
export const SetPermissions = (...permission: string[]): any => SetMetadata('permission', permission);