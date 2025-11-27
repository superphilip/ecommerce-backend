import type { User, UserHasRole } from "../generated/prisma/client.js";
import { formatRoles, type FormattedRole } from "./RolesUtils.js";


export function excludePassword(user: User) {
  const { password, ...userData } = user;
  return userData;
}

export type FormattedUserResponse = Omit<User, 'password'> & {
    image: string | null;
    roles?: FormattedRole[]; 
};

export const formatUserResponse = (
    user: User, 
    roles?: (UserHasRole & { role: FormattedRole })[]
): FormattedUserResponse => {
    
    const userDataWithoutPassword = excludePassword(user);

    const imageFormatted = userDataWithoutPassword.image 
        ? `http://${process.env.HOST}:${process.env.PORT}${userDataWithoutPassword.image}` 
        : null;

    let rolesFormatted: FormattedRole[] | undefined;
    if (roles) {
        rolesFormatted = formatRoles(roles); 
    }
    
    return {
        ...userDataWithoutPassword,
        image: imageFormatted,
        ...(rolesFormatted && { roles: rolesFormatted }),
    } as FormattedUserResponse;
};