import prisma from "../database/prismaClient.js";
import bcrypt from "bcryptjs";

export const hashedPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}


export const isPasswordValid = async(password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
}

export const fetchUserPermissions = async (userId: number): Promise<string[]> => {
    
    const userRoles = await prisma.userHasRole.findMany({
        where: { idUser: userId },
        select: {
            role: {
                select: {
                    permissions: {
                        select: { idPermission: true }
                    }
                }
            }
        }
    });

    const permissionIds = userRoles.flatMap(userRole => 
        userRole.role.permissions.map(rolePermission => rolePermission.idPermission)
    );

    return Array.from(new Set(permissionIds));
};