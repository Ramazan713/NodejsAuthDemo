import { PrismaClient } from "@prisma/client";
import user_ext from "./extensions/user_ext";


const prisma = new PrismaClient({
    omit: {
        user: {
            password: true
        },
        mfaMethod: {
            methodData: true
        }
    }
}).$extends(user_ext)

export {
    prisma
}