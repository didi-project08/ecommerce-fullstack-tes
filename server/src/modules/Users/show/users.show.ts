import { Prisma } from '@prisma/client'

export const UserShow: Prisma.UsersSelect = {
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
};