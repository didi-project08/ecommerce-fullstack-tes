import { ForbiddenException, BadRequestException, Injectable, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import { Request, Response } from 'express';
import { UidDto, CreateOrderItemsDto, UpdateOrderItemsDto, delPermanentOrderItemsDto, PaginationDto } from './dto';

interface OrderItemsResponse {
    total: number;
    data: any[];
}

interface OrderItemResponse {
    data: any | null;
    message?: string;
}

interface FilterObject {
    [key: string]: any;
}

@Injectable()
export class OrderItemsService {
    constructor(private prisma: PrismaService) {}

    async getOrderItems(dto: PaginationDto, res: Response): Promise<OrderItemsResponse> {
        const { search, filter, page, rows, trash, orderBy } = dto;

        try {
            const searchConditions = await this.buildSearchConditions(search, trash);
            const filterConditions = this.buildFilterConditions(filter);
            const paginationOptions = this.buildPaginationOptions(page, rows);
            const orderOptions = this.buildOrderOptions(orderBy);

            const [total, data] = await this.prisma.$transaction([
                this.prisma.orderItems.count({
                    ...searchConditions,
                }),
                this.prisma.orderItems.findMany({
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

    async createOrderItems(dto: CreateOrderItemsDto, res: Response): Promise<any> {
        const { orderId, productId, quantity, price } = dto
        
        const orderItems = await this.prisma.orderItems.create({
            data: {
                orderId,
                productId,
                quantity,
                price
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

        return orderItems;
    }

    async UpdateOrderItemsById(currUser: string, param: UidDto, dto: UpdateOrderItemsDto, res: Response): Promise<any> {
        const { id } = param
        const { orderId, productId, quantity, price, restore } = dto
        let data = {}
        if (restore) {
            data = {
                deletedBy: null,
                deletedAt: null,
            }
        } else {
            data = {
                orderId,
                productId,
                quantity,
                price,
                updatedBy: currUser['fullname'],
            }
        }

        const orderItems = await this.prisma.orderItems.update({
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

        return orderItems;
    }

    async getOrderItemsById(dto: UidDto, res: Response): Promise<OrderItemResponse> {
        const { id } = dto;
        try {
            const orderItems = await this.prisma.orderItems.findUnique({
                where: {
                    id,
                    deletedAt: null,
                    deletedBy: null,
                },
            });

            if (!orderItems) {
                return {
                    data: null,
                    message: 'order items not found or has been deleted'
                };
            }

            return {
                data: orderItems
            };
        } catch (error) {
            this.handlePrismaError(error);
        }
    }

    async deleteOrderItemsById(currUser: string, param: UidDto, body: delPermanentOrderItemsDto, res: Response): Promise<any> {
        const { id } = param;
        const { permanent } = body;
        if (permanent) {
            const orderItems = this.prisma.orderItems.delete({
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
    
            return orderItems
        } else {
            const orderItems = this.prisma.orderItems.update({
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
    
            return orderItems
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
            `SELECT id FROM order_items
            WHERE quantity LIKE '${query}'
            WHERE price LIKE '${query}'
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