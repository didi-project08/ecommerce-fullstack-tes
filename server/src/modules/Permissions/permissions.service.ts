import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { UidDto, CreatePermissionsDto, UpdatePermissionsDto, delPermanentPermissionsDto, PaginationDto } from './dto';

@Injectable()
export class PermissionsService {
    constructor(private prisma: PrismaService) {}

    async getPermissions(dto: PaginationDto, res: Response): Promise<any> {
        const { search, filter, page, rows, trash, orderBy } = dto;

        // START SEARCHING LOGIC
        const setSearch = {}
        if (search) {
            let where = {}
            const query = `%${search}%`;
            const maxResults = 10;
            const ids = await this.prisma.$queryRawUnsafe<{ id: number }[]>
            (`SELECT id FROM permissions
                WHERE name LIKE '${query}'
                OR description LIKE '${query}'
                OR path LIKE '${query}'
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
                {sort: orderBy.toUpperCase().toLowerCase()}
            ]
        }
        // END ORDERBY

        try {
            const permissions = await this.prisma.$transaction([
                this.prisma.permissions.count({
                    ...setSearch,
                }),
                this.prisma.permissions.findMany({
                    include: {
                        permission_groups: {
                            select: {
                                name: true,
                            }
                        }
                    },
                    ...order,
                    ...setSearch,
                    ...setFilter,
                    ...setPagination, // if has pagination
                })
            ]);
            
            return {
                total: permissions[0],
                data : permissions[1],
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

    async createPermissions(dto: CreatePermissionsDto, res: Response): Promise<any> {
        const { type, name, pGroupId, description, icon, path, sort } = dto
        
        const permissions = await this.prisma.permissions.create({
            data: {
                type,
                name,
                pGroupId,
                description,
                icon,
                path,
                sort
            }
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

        return permissions;
    }

    async UpdatePermissionsById(currUser: string, param: UidDto, dto: UpdatePermissionsDto, res: Response): Promise<any> {
        const { id } = param
        const { name, pGroupId, description, icon, path, sort, restore } = dto
        let data = {}
        if (restore) {
            data = {
                deletedBy: null,
                deletedAt: null,
            }
        } else {
            data = {
                name,
                pGroupId,
                description,
                icon,
                path,
                sort,
                updatedBy: currUser['fullname'],
            }
        }

        const permissions = await this.prisma.permissions.update({
            where: {
                id,
            },
            data,
        }).catch ((error) => {
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

        return permissions;
    }

    async getPermissionsById(dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        try {
            const permissions = await this.prisma.$transaction([
                this.prisma.permissions.count(),
                this.prisma.permissions.findUnique({
                    where: {
                        id,
                        deletedAt: null,
                        deletedBy: null,
                    },
                })
            ]);

            return {
                total: permissions[0],
                data: permissions[1],
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

    async deletePermissionsById(currUser: string, param: UidDto, body: delPermanentPermissionsDto, res: Response): Promise<any> {
        const { id } = param;
        const { permanent } = body;
        if (permanent) {
            const permissions = this.prisma.permissions.delete({
                where: {
                    id,
                },
            }).catch ((error) => {
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
    
            return permissions
        } else {
            const permissions = this.prisma.permissions.update({
                where: {
                    id,
                },
                data: {
                    deletedAt: (new Date()).toISOString(),
                    deletedBy: currUser['fullname']
                },
            }).catch ((error) => {
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
    
            return permissions
        }
    }
}