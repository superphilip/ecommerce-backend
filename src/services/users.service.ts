import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import { formatUserResponse } from '../utils/UserUtils.js';


export const findByEmail = async (email: string) => {
    return await prisma.user.findUnique({
        where: {
            email: email
        }
    });
}

export const findById = async (id: number) => {
    const user = await prisma.user.findUnique({
        where: {
            id: id
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });

    if(!user) {
        throw new AppError('Usuario no encontrado', 404);
    }

    
    return formatUserResponse(user, user.roles);

}

export const findAll = async () => {
    const users = await prisma.user.findMany({
        orderBy: {
            id: 'asc'
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
    

    const usersData = users.map(user => {
        return formatUserResponse(user, user.roles);
    });

    return usersData;
}