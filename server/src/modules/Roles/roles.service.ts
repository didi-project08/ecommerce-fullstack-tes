import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { UidDto, CreateRolesDto, UpdateRolesDto, PaginationDto, TypeModuleDto, delPermanentRolesDto } from './dto';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) {}

    async getRoles(dto: PaginationDto, res: Response): Promise<any> {
        const { search, filter, page, rows, trash, orderBy } = dto;

        // START SEARCHING LOGIC
        const setSearch = {}
        if (search) {
            let where = {}
            const query = `%${search}%`;
            const maxResults = 10;
            const ids = await this.prisma.$queryRawUnsafe<{ id: number }[]>
            (`SELECT id FROM roles
                WHERE name LIKE '${query}'
                LIMIT ${maxResults}
                ;`
            );
            if (trash) {
                where = {
                    deletedAt: { not: null},
                    deletedBy: { not: null},
                }
            } else {
                where = {
                    deletedAt: null,
                    deletedBy: null,
                }
            }
            setSearch['where'] = {
                id: {
                    in: ids.map((row) => row.id),
                },
                ...where
            }
        } else {
            if (trash) {
                setSearch['where'] = {
                    deletedAt: { not: null},
                    deletedBy: { not: null},
                }
            } else {
                setSearch['where'] = {
                    deletedAt: null,
                    deletedBy: null,
                }
            }
        }
        // END SEARCHING LOGIC
        // START FILTER LOGIC
        const setFilter = {}
        if (filter) {
            // BENTUK FILTER YANG DIKIRIM HARUS SEPERTI INI 'username=test,fullname=test2'
            let pairs = filter.split(',')
            let filters = {}
            for (let i = 0; i < pairs.length; i++) {
                let pair = pairs[i].split('=');
                filters[pair[0]] = pair[1];
            }
            setFilter['where'] = filters;
            // console.log(relation)
        }
        // END FILTER LOGIC
        // START TYPE LOGIC
        let relation = {}
        relation['include'] = {
            role_users: true,
            role_permissions: true,
        }
        //END TYPE LOGIC
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
            const roles = await this.prisma.$transaction([
                this.prisma.roles.count({
                    ...setSearch,
                }),
                this.prisma.roles.findMany({
                    ...order,
                    ...setSearch,
                    ...setFilter,
                    ...setPagination, // if has pagination
                    ...relation,
                })
            ]);
            
            return {
                total: roles[0],
                data : roles[1],
            }
        } catch (error) {
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
        }
    }

    async createRoles(@Query() types: TypeModuleDto, dto: CreateRolesDto, res: Response): Promise<any> {
        const { name } = dto
        const { type } = types

        let createWith = {}
        if (type == 'master') {
            createWith['role_masters'] = {
                create: {}
            }
        }

        const roles = await this.prisma.roles.create({
            data: {
                name,
                ...createWith
            },
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
        
        return roles;
    }

    async UpdateRolesById(currUser: string, param: UidDto, body: UpdateRolesDto, res: Response): Promise<any> {
        const { id } = param
        const { name, restore } = body;
        let data = {}
        if (restore) {
            data = {
                deletedBy: null,
                deletedAt: null,
            }
        } else {
            data = {
                name,
                updatedBy: currUser['fullname'],
            }
        }
        const roles = await this.prisma.roles.update({
            where: {
                id,
            },
            data,
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

        return roles;
    }

    async getRolesById(dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;

        const roles = await this.prisma.$transaction([
            this.prisma.roles.count(),
            this.prisma.roles.findUnique({
                where: {
                    id,
                    deletedAt: null,
                    deletedBy: null,
                },
                include: {
                    role_users: true,
                    role_permissions: true,
                }
            })
        ]).catch((error) => {
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
        });

        return {
            total: roles[0],
            data: roles[1],
        }
    }

    async deleteRolesById(currUser: string, param: UidDto, body: delPermanentRolesDto, res: Response): Promise<any> {
        const { id } = param;
        const { permanent } = body;

        if (permanent) {
            const role_users = this.prisma.role_users.deleteMany({ where: { roleId: id } })
            const role_permissions = this.prisma.role_permissions.deleteMany({ where: { roleId: id } })
            const roles = this.prisma.roles.delete({ where: { id } })

            const transaction = await this.prisma.$transaction([role_users, role_permissions, roles])
            .catch (error => {
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    let message = ""
                    console.log(error)
                    if (error.code === 'P2002' || error.code === 'P2003') {
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
            
            return transaction
        } else {
            const roles = this.prisma.roles.update({
                where: {
                    id,
                },
                data: {
                    deletedAt: (new Date()).toISOString(),
                    deletedBy: currUser['fullname']
                },
            }).catch (error => {
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
            return roles
        }
    }
}