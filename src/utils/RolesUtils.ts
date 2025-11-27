interface UserRole {
  role: {
    id: string;
    name: string;
    route: string;
    image: string | null;
  };
}

export interface FormattedRole {
  id: string;
  name: string;
  route: string;
  image: string | null;
}

export function formatRoles(userRoles: UserRole[]): FormattedRole[] {
    if (!userRoles || userRoles.length === 0) {
        return [];
    }
    
    return userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        route: userRole.role.route,
        image: userRole.role.image
    }));

}