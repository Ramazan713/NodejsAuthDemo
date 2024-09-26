import { expressjwt } from "express-jwt"
import jwt from 'jsonwebtoken';
import base64url from 'base64url';
import { Buffer } from 'buffer';


const secret = process.env.JWT_SECRET as string

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


export const getApkHashKey = (sha256: string): string => {
    const hexString = sha256.replace(/:/g, '');
    const binaryData = Buffer.from(hexString, 'hex');
    const encoded = base64url(binaryData);
   return `android:apk-key-hash:${encoded}`
}