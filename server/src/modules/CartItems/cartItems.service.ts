import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { UidDto, CreateCartItemsDto, UpdateCartItemsDto, delPermanentCartItemsDto, PaginationDto } from './dto';

interface CartItemsResponse {
    total: number;
    data: any[];
}

interface CartItemResponse {
    data: any | null;
    message?: string;
}

interface FilterObject {
    [key: string]: any;
}

@Injectable()
export class CartItemsService {
    constructor(private prisma: PrismaService) {}

    async getCartItems(dto: PaginationDto, res: Response): Promise<CartItemsResponse> {
        const { search, filter, page, rows, trash, orderBy } = dto;

        try {
            const searchConditions = await this.buildSearchConditions(search, trash);
            const filterConditions = this.buildFilterConditions(filter);
            const paginationOptions = this.buildPaginationOptions(page, rows);
            const orderOptions = this.buildOrderOptions(orderBy);

            const [total, data] = await this.prisma.$transaction([
                this.prisma.cartItems.count({
                    ...searchConditions,
                }),
                this.prisma.cartItems.findMany({
                    ...orderOptions,
                    ...searchConditions,
                    ...filterConditions,
                    ...paginationOptions,
                }),
            ]);

            return { total, data };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async createCartItems(dto: CreateCartItemsDto, res: Response): Promise<any> {
        const { cartId, productId, quantity } = dto
        
        const cartItems = await this.prisma.cartItems.create({
            data: {
                cartId,
                productId,
                quantity,
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

        return cartItems;
    }

    async UpdateCartItemsById(currUser: string, param: UidDto, dto: UpdateCartItemsDto, res: Response): Promise<any> {
        const { id } = param
        const { cartId, productId, quantity, restore } = dto
        let data = {}
        if (restore) {
            data = {
                deletedBy: null,
                deletedAt: null,
            }
        } else {
            data = {
                cartId,
                productId,
                quantity,
                updatedBy: currUser['fullname'],
            }
        }

        const cartItems = await this.prisma.cartItems.update({
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

        return cartItems;
    }

    async getCartItemsById(dto: UidDto, res: Response): Promise<CartItemResponse> {
        const { id } = dto;
        try {
            const cartItems = await this.prisma.cartItems.findUnique({
                where: {
                    id,
                    deletedAt: null,
                    deletedBy: null,
                },
            });

            if (!cartItems) {
                return {
                    data: null,
                    message: 'order items not found or has been deleted'
                };
            }

            return {
                data: cartItems
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async deleteCartItemsById(currUser: string, param: UidDto, body: delPermanentCartItemsDto, res: Response): Promise<any> {
        const { id } = param;
        const { permanent } = body;
        if (permanent) {
            const cartItems = this.prisma.cartItems.delete({
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
    
            return cartItems
        } else {
            const cartItems = this.prisma.cartItems.update({
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
    
            return cartItems
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

        const searchIds = await this.searchCartItemsIds(search);

        return {
            where: {
                id: {
                    in: searchIds,
                },
                ...baseWhere,
            },
        };
    }

    private async searchCartItemsIds(search: string): Promise<number[]> {
        const query = `%${search}%`;
        const maxResults = 10;

        const ids = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
            `SELECT id FROM cart_items
            WHERE productId LIKE '${query}'
            WHERE quantity LIKE '${query}'
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

    private buildOrderOptions(orderBy: string): any {
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