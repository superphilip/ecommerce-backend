import jwt, { JwtPayload } from "jsonwebtoken";
import { randomUUID } from "crypto"; 

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const EXPIRES_IN = "2d";

export interface TokenPayload extends JwtPayload {
    id: number; 
    email: string;
    
    sessionRevokedAt: number;
    jwtId: string;
}

export const generateToken = (
    payload: { 
        id: number, 
        email: string, 
        permissions: string[],
        sessionRevokedAt: number,
    }
): { token: string, jwtId: string } => { 
    
    const jwtId = randomUUID(); 
    
    const token = jwt.sign(
        { ...payload, jwtId: jwtId, sessionRevokedAt: payload.sessionRevokedAt },
        JWT_SECRET, 
        { expiresIn: EXPIRES_IN }
    );
    
    return { token, jwtId };
}

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        throw error; 
    }
}