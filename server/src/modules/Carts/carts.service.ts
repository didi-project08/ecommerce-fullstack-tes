import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { GetCurrentUserId } from '../../common/decorators';
import { UidDto, CreateCartsDto, UpdateCartsDto, delPermanentCartsDto, PaginationDto } from './dto';

interface CartsResponse {
    total: number;
    data: any[];
}

interface CartResponse {
    data: any | null;
    message?: string;
}

interface FilterObject {
    [key: string]: any;
}

@Injectable()
export class CartsService {
    constructor(private prisma: PrismaService) {}

    async getCarts(userId: string, dto: PaginationDto, res: Response): Promise<CartsResponse> {
        const { search, filter, page, rows, trash, orderBy } = dto;

        try {
            const searchConditions = await this.buildSearchConditions(search, trash);
            const filterConditions = this.buildFilterConditions(filter);
            const paginationOptions = this.buildPaginationOptions(page, rows);
            const cartOptions = this.buildCartOptions(orderBy);

            const [total, data] = await this.prisma.$transaction([
                this.prisma.carts.count({
                    ...searchConditions,
                }),
                this.prisma.carts.findMany({
                    ...cartOptions,
                    ...searchConditions,
                    ...filterConditions,
                    ...paginationOptions,
                    where: {
                        userId: userId,
                    },
                    include: {
                        cartItems: {
                            where: {
                                deletedBy: null,
                                deletedAt: null,
                            },
                            include: {
                                product: true,
                            }
                        }
                    },
                })
            ]);
            
            return { total, data };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async createCarts(userId: string, dto: CreateCartsDto, res: Response): Promise<any> {
        const { sessionId } = dto
        
        const carts = await this.prisma.carts.create({
            data: {
                userId,
                sessionId
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

        return carts;
    }

    async UpdateCartsById(currUser: string, param: UidDto, dto: UpdateCartsDto, res: Response): Promise<any> {
        const { id } = param
        const { userId, sessionId, restore } = dto
        let data = {}
        if (restore) {
            data = {
                deletedBy: null,
                deletedAt: null,
            }
        } else {
            data = {
                userId,
                sessionId,
                updatedBy: currUser['fullname'],
            }
        }

        const carts = await this.prisma.carts.update({
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

        return carts;
    }

    async getCartsById(dto: UidDto, res: Response): Promise<CartResponse> {
        const { id } = dto;
        
        try {
            const order = await this.prisma.carts.findUnique({
                where: {
                    id,
                    deletedAt: null,
                    deletedBy: null,
                },
                include: {
                    // Tambahkan relations jika diperlukan
                    // orderItems: true,
                    // user: true,
                }
            });

            if (!order) {
                return {
                    data: null,
                    message: 'Order not found or has been deleted'
                };
            }

            return {
                data: order
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async deleteCartsById(currUser: string, param: UidDto, body: delPermanentCartsDto, res: Response): Promise<any> {
        const { id } = param;
        const { permanent } = body;
        if (permanent) {
            const carts = this.prisma.carts.delete({
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
    
            return carts
        } else {
            const carts = this.prisma.carts.update({
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
    
            return carts
        }
    }

    // ============================== helper functions ===================================
    private async buildSearchConditions(search: string, trash: boolean): Promise<any> {
        const baseWhere = trash
        ? { deletedAt: { not: null }, deletedBy: { not: null } }
        : { deletedAt: null, deletedBy: null };

        if (!search) {
        return { where: baseWhere };
        }

        const searchIds = await this.searchOrderItemsIds(search);

        return {
            where: {
                id: {
                    in: searchIds,
                },
                ...baseWhere,
            },
        };
    }

    private async searchOrderItemsIds(search: string): Promise<number[]> {
        const query = `%${search}%`;
        const maxResults = 10;

        const ids = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
            `SELECT id FROM carts
            WHERE userId LIKE '${query}'
            WHERE sessionId LIKE '${query}'
            LIMIT ${maxResults};`
        );

        return ids.map((row) => row.id);
    }

    private buildFilterConditions(filter: string): any {
        if (!filter) {
            return {};
        }

        const filters = this.parseFilterString(filter);
        return { where: filters };
    }

    private parseFilterString(filter: string): FilterObject {
        const pairs = filter.split(',');
        const filters: FilterObject = {};

        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key && value) {
                filters[key] = this.convertValueForPrisma(value);
            }
        }

        return filters;
    }

    private convertValueForPrisma(value: string): any {
        // Handle boolean
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        
        // Handle null
        if (value.toLowerCase() === 'null') return null;
        
        // Handle numbers (integer dan float)
        if (/^-?\d+$/.test(value)) {
            return parseInt(value, 10);
        }
        if (/^-?\d+\.\d+$/.test(value)) {
            return parseFloat(value);
        }
        
        // Handle array format (contoh: "1,2,3" menjadi [1, 2, 3])
        if (value.includes('|')) {
            const arrayValues = value.split('|');
            const convertedArray = arrayValues.map(v => this.convertValueForPrisma(v));
            // Jika semua elemen adalah number, return sebagai number array
            if (convertedArray.every(item => typeof item === 'number')) {
                return convertedArray;
            }
            return convertedArray;
        }
        
        // Default: return sebagai string
        return value;
    }

    private buildPaginationOptions(page: number, rows: number): any {
        if (!page || !rows) {
            return {};
        }

        return {
            skip: (Number(page) - 1) * Number(rows),
            take: Number(rows),
        };
    }

    private buildCartOptions(orderBy: string): any {
        if (!orderBy) {
            return {};
        }

        return {
            orderBy: [{ createdAt: orderBy.toLowerCase() }],
        };
    }

    private handlePrismaError(error: unknown): never {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const message = Object.entries(error.meta || {})
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
                
                throw new BadRequestException(`Credentials incorrect: ${message}`);
            }
        }
        
        throw error;
    }
}