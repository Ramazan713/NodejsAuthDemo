import { expressjwt, Request as JWTRequest } from "express-jwt"
import jwt from 'jsonwebtoken';

const secret = "asdasdasd"

export function decodeToken(token: string): jwt.JwtPayload | string | any{
    const result = jwt.verify(token, secret)
    return result
}

export function generateToken(payload: any): string{
    return jwt.sign(payload, secret)
}

export const authMiddleware = expressjwt({
    secret,
    credentialsRequired: false,
    algorithms: ["HS256"]
})