import { ForbiddenException, BadRequestException, Injectable, HttpException, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service';
import * as argon from 'argon2';
import { Request, Response } from 'express';
import {  UserShow } from './show';
import { UidDto, CreateUsersDto, UpdateUsersDto, PaginationDto } from './dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async getUsers(dto: PaginationDto, res: Response): Promise<any> {
        const { search, filter, page, rows } = dto;

        // START SEARCHING LOGIC
        const setSearch = {}
        if (search) {
            const query = `%${search}%`;
            const maxResults = 10;
            const ids = await this.prisma.$queryRawUnsafe<{ id: number }[]>
            (`SELECT id FROM users
                WHERE fullname LIKE '${query}'
                OR username LIKE '${query}'
                OR email LIKE '${query}'
                LIMIT ${maxResults}
                ;`
            );
            setSearch['where'] = {
                id: {
                    in: ids.map((row) => row.id),
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
            // console.log(setFilter)
        }
        // END FILTER LOGIC
        // START PAGINATION LOGIC
        const setPagination = {}
        if (page && rows) {
            setPagination['skip'] = (Number(page)-1) * Number(rows)
            setPagination['take'] = Number(rows)
        }
        // END PAGINATION LOGIC

        try {    
            const users = await this.prisma.$transaction([
                this.prisma.users.count(),
                this.prisma.users.findMany({
                    select: {
                        id: true,
                        fullname: true,
                        username: true,
                        email: true,
                        createdAt: true,
                        createdBy: true,
                        updatedAt: true,
                        updatedBy: true,
                        deletedAt: true,
                        deletedBy: true,
                        role_users: {
                            select: {
                                id: true,
                                userId: true,
                                roleId: true,
                                roles: {
                                    select: { 
                                        id: true,
                                        name: true,
                                        role_permissions: {
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
                                                        icon: true,
                                                        path: true,
                                                        sort: true,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    where: {
                        deletedAt: null,
                        deletedBy: null,
                    },
                    ...setSearch,
                    ...setFilter,
                    ...setPagination, // if has pagination
                })
            ]);
            
            return {
                total: (setPagination.hasOwnProperty('skip')) ? users[0] : users[1].length,
                data: users[1],
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

    async createUsers(dto: CreateUsersDto, res: Response): Promise<any> {
        const password = await argon.hash(dto.password);
    
        try {
            const users = await this.prisma.users.create({
                data: {
                    fullname: dto.fullname,
                    username: dto.username,
                    email: dto.email,
                    password,
                }
            })
            return users;
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

    async getUsersById(dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        try {
            const users = await this.prisma.$transaction([
                this.prisma.users.count(),
                this.prisma.users.findMany({
                    where: {
                        id,
                        deletedAt: null,
                        deletedBy: null,
                    }, // if has pagination
                    select: UserShow,
                })
            ]);
            
            return {
                total: users[0],
                data: users[1],
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

    async UpdateUsersById(userId: UidDto, dto: UpdateUsersDto, res: Response): Promise<any> {
        const { id } = userId
        const { fullname, username, email } = dto;
        try {
            const users = await this.prisma.users.update({
                where: {
                    id,
                },
                data: {
                    fullname: fullname,
                    username: username,
                    email: email,
                },
                select: UserShow,
            })
            return users;
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

    async deleteUsersById(currUser: string, dto: UidDto, res: Response): Promise<any> {
        const { id } = dto;
        try {
            const users = this.prisma.users.update({
                where: {
                    id,
                },
                data: {
                    deletedAt: (new Date()).toISOString(),
                    deletedBy: currUser['fullname']
                },
                select: UserShow,
            })
            return users;
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