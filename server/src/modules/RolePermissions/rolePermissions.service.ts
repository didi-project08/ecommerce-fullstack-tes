import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { UidDto, CreateRolePermissionsDto, PaginationDto, TypeModuleDto } from './dto';

@Injectable()
export class RolePermissionsService {
    constructor(private prisma: PrismaService) {}

    async getRolePermissions(dto: PaginationDto, res: Response): Promise<any> {
        const { search, page, rows, orderBy } = dto;

        // START SEARCHING LOGIC
        const setSearch = {}
        if (search) {
            const query = `%${search}%`;
            const maxResults = 10;
            const ids = await this.prisma.$queryRawUnsafe<{ id: number }[]>
            (`SELECT a.id, b.name, c.name, c.description FROM role_permissions AS a
                INNER JOIN roles AS b ON a.roleId = b.id
                INNER JOIN permissions AS c ON a.permissionsId = c.id
                WHERE b.name LIKE '${query}'
                OR c.name LIKE '${query}'
                OR c.description LIKE  '${query}'
                LIMIT ${maxResults}
                ;`
            );
            setSearch['where'] = {
                id: {
                    in: ids.map((row) => row.id),
                },
                deletedAt: null,
                deletedBy: null,
            }
        } else {
            setSearch['where'] = {
                deletedAt: null,
                deletedBy: null,
            }
        }
        // END SEARCHING LOGIC
        // START PAGINATION LOGIC
        const setPagination = {}
        if (page && rows) {
            setPagination['skip'] = (Number(page)-1) * Number(rows)
            setPagination['take'] = Number(rows)
        }
        // END PAGINATION LOGIC
        // START ORDERBY
        const  order = {}
        if (orderBy) {
            order['orderBy'] = [{
                permissions: {
                    sort: orderBy.toUpperCase().toLowerCase()
                }
            }]
        }
        // END ORDERBY

        try {
            const rolePermissions = await this.prisma.$transaction([
                this.prisma.role_permissions.count({
                    ...setSearch,
                }),
                this.prisma.role_permissions.findMany({
                    include: {
                        roles: {
                            select: {
                                name: true,
                            }
                        },
                        permissions: {
                            select: {
                                name: true,
                                pGroupId: true,
                                description: true,
                                icon: true,
                                path: true,
                                sort: true,
                            }
                        }
                    },
                    ...setSearch,
                    ...setPagination, // if has pagination
                    ...order,
                })
            ]);
            
            return {
                total: rolePermissions[0],
                data : rolePermissions[1],
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

    async createRolePermissions(dto: CreateRolePermissionsDto, res: Response): Promise<any> {
        const { roleId, permissionsId } = dto
        const deleteRolePermissions = await this.prisma.role_permissions.deleteMany({
            where: { roleId },
        }).catch((error) => {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                let message = ""
                if (error.code === 'P2002') {
                    for (const [key, value] of Object.entries(error.meta || {})) {
                        message += `${key}: ${value},`
                    }
                } else if (error.code === 'P2025') {
                    message += error.meta?.cause
                }
                throw new BadRequestException(`Credentials incorrect: ${message}`);
            }
            throw error;
        })

        let response = []
        if (deleteRolePermissions) {
            if (permissionsId.length > 0) {
                permissionsId.map(async (permissionId) => {
                    await this.prisma.role_permissions.create({
                        data: {
                            roleId,
                            permissionsId: permissionId,
                        },
                    })
                })
                response = permissionsId;
            }
        }

        return response;
    }

    async getRolePermissionsById(dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        try {
            const rolePermissions = await this.prisma.$transaction([
                this.prisma.role_permissions.count(),
                this.prisma.role_permissions.findUnique({
                    where: {
                        id,
                        deletedAt: null,
                        deletedBy: null,
                    },
                })
            ]);

            return {
                total: rolePermissions[0],
                data: rolePermissions[1],
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

    async deleteRolePermissionsById(currUser: string, dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        try {
            const rolePermissions = this.prisma.role_permissions.update({
                where: {
                    id,
                },
                data: {
                    deletedAt: (new Date()).toISOString(),
                    deletedBy: currUser['fullname']
                },
            })

            return rolePermissions
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