import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { UidDto, CreateRoleUsersDto, PaginationDto, TypeModuleDto } from './dto';

@Injectable()
export class RoleUsersService {
    constructor(private prisma: PrismaService) {}

    async getRoleUsers(dto: PaginationDto, res: Response): Promise<any> {
        const { page, rows, orderBy } = dto;

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
            order['orderBy'] = [
                {createdAt: orderBy.toUpperCase().toLowerCase()}
            ]
        }
        // END ORDERBY

        try {
            const roleUsers = await this.prisma.$transaction([
                this.prisma.role_users.count(),
                this.prisma.role_users.findMany({
                    where: {
                        deletedAt: null,
                        deletedBy: null,
                    },
                    include: {
                        users: {
                            select: {
                                fullname: true,
                                username: true,
                                email: true,
                            }
                        },
                        roles: {
                            select: {
                                name: true,
                            }
                        }
                    },
                    ...order,
                    ...setPagination, // if has pagination
                })
            ]);
            
            return {
                total: (setPagination.hasOwnProperty('skip')) ? roleUsers[0] : roleUsers[1].length,
                data: roleUsers[1],
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

    async createRoleUsers(dto: CreateRoleUsersDto, res: Response): Promise<any> {
        const { userId, roleId } = dto
        const deleteRoleUsers = await this.prisma.role_users.deleteMany({
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
        if (deleteRoleUsers) {
            if (userId.length > 0) {
                userId.map(async (uId) => {
                    const countRU = await this.prisma.role_users.findMany({
                        where: { userId: uId },
                    })
                    if (countRU.length > 0) {
                        await this.prisma.role_users.deleteMany({
                            where: { userId: uId },
                        })
                        await this.prisma.role_users.create({
                            data: { roleId, userId: uId },
                        })
                    } else {
                        await this.prisma.role_users.create({
                            data: { roleId, userId: uId },
                        })
                    }
                })
                response = userId;
            }
        }

        return response;
    }

    async getRoleUsersById(dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        try {
            const roles = await this.prisma.$transaction([
                this.prisma.roles.count(),
                this.prisma.roles.findUnique({
                    where: {
                        id,
                        deletedAt: null,
                        deletedBy: null,
                    },
                })
            ]);

            return {
                total: roles[0],
                data: roles[1],
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

    async deleteRoleUsersById(currUser: string, dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        try {
            const roles = this.prisma.roles.update({
                where: {
                    id,
                },
                data: {
                    deletedAt: (new Date()).toISOString(),
                    deletedBy: currUser['fullname']
                },
            })

            return roles
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