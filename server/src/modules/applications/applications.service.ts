import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';

@Injectable()
export class ApplicationsService {
    constructor(private prisma: PrismaService) {}

    async getModules(userId: string, res: Response): Promise<any> {
        // const { roleId } = currUser
        try {
            const user = await this.prisma.users.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    role_users: {
                        select: {
                            roleId: true,
                        }
                    }
                }
            })

            if (!user?.role_users[0]?.roleId) throw new BadRequestException("Opps, Your role was not found.");

            const permissionMasters = await this.prisma.$transaction([
                this.prisma.role_permissions.count(),
                this.prisma.role_permissions.findMany({
                    where: {
                        roleId: user.role_users[0].roleId,
                        deletedAt: null,
                        deletedBy: null,
                        permissions: {
                            type: 'module'
                        }
                    },
                    select: {
                        id: true,
                        roleId: true,
                        permissionsId: true,
                        permissions: {
                            select: {
                                id: true,
                                name: true,
                                pGroupId: true,
                                description: true,
                                type: true,
                                icon: true,
                                path: true,
                                sort: true,
                                permission_groups: {
                                    select: {
                                        id: true,
                                        name: true,
                                        icon: true,
                                        sort: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        permissions: {
                            sort: 'asc'
                        }
                    }
                })
            ]);
            
            return {
                total: permissionMasters[1].length,
                data: permissionMasters[1],
            }
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    let message = ""
                    for (const [key, value] of Object.entries(error.meta || {})) {
                        message += `${key}: ${value},`
                    }
                    throw new BadRequestException(`Credentials incorrect: ${message}`);
                }
            }
            throw error;
        }
    }
}