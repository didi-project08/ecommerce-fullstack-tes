import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { UidDto, CreatePermissionGroupsDto, UpdatePermissionGroupsDto, delPermanentPermissionGroupsDto, PaginationDto, TypeModuleDto } from './dto';

@Injectable()
export class PermissionGroupsService {
    constructor(private prisma: PrismaService) {}

    async getPermissionGroups(dto: PaginationDto, res: Response): Promise<any> {
        const { search, filter, page, rows, trash, orderBy } = dto;

        // START SEARCHING LOGIC
        const setSearch = {}
        if (search) {
            let where = {}
            const query = `%${search}%`;
            const maxResults = 10;
            const ids = await this.prisma.$queryRawUnsafe<{ id: number }[]>
            (`SELECT id FROM permission_groups
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
            console.log(pairs)
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
            const permissionGroups = await this.prisma.$transaction([
                this.prisma.permission_groups.count({
                    ...setSearch,
                }),
                this.prisma.permission_groups.findMany({
                    ...order,
                    ...setSearch,
                    ...setFilter,
                    ...setPagination, // if has pagination
                })
            ]);
            
            return {
                total: permissionGroups[0],
                data : permissionGroups[1],
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

    async createPermissionGroups(dto: CreatePermissionGroupsDto, res: Response): Promise<any> {
        const { name, icon, sort } = dto
        const permissionGroups = await this.prisma.permission_groups.create({
            data: {
                name,
                icon,
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

        return permissionGroups;
    }

    async UpdatePermissionGroupsById(currUser: string, param: UidDto, body: UpdatePermissionGroupsDto, res: Response): Promise<any> {
        const { id } = param
        const { name, icon, sort, restore } = body;
        let data = {}
        if (restore) {
            data = {
                deletedBy: null,
                deletedAt: null,
            }
        } else {
            data = {
                name,
                icon,
                sort,
                updatedBy: currUser['fullname'],
            }
        }
        
        const permissionGroups = await this.prisma.permission_groups.update({
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

        return permissionGroups;
    }

    async getPermissionGroupsById(dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        
        const permissionGroups = await this.prisma.$transaction([
            this.prisma.permission_groups.count(),
            this.prisma.permission_groups.findUnique({
                where: {
                    id,
                    deletedAt: null,
                    deletedBy: null,
                },
            })
        ]).catch ((error) => {
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

        return {
            total: permissionGroups[0],
            data: permissionGroups[1],
        }
    }

    async deletePermissionGroupsById(currUser: string, param: UidDto, body: delPermanentPermissionGroupsDto, res: Response): Promise<any> {
        const { id } = param;
        const { permanent } = body;
        
        if (permanent) {
            const permissionGroups = await this.prisma.permission_groups.delete({
                where: {
                    id,
                }
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

            return permissionGroups
        } else {
            const permissionGroups = await this.prisma.permission_groups.update({
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

            return permissionGroups
        }
    }
}