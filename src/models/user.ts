import { Prisma } from "@prisma/client";
import { prisma } from "../db/client";


// const userPersonalData = Prisma.validator<Prisma.UserDefaultArgs>()({
//     omit: {password: true},
// })

async function getUser() {
    return (await prisma.user.findMany({omit: {password: true}}))[0]
}
  
type User = Prisma.PromiseReturnType<typeof getUser>

export {
    User
}