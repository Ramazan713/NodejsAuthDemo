import { Prisma } from "@prisma/client";
import { comparePassword, hashPassword } from "../../utils/password_utils";
import { generateToken } from "../../utils/auth";

export default Prisma.defineExtension({
    query: {
        user: {
            async $allOperations({operation, args, query}){
                if(operation == "upsert"){
                    args.create = await generateHashedPasswordFromUser(args.create)
                    args.update = await generateHashedPasswordFromUser(args.update)
                }
                else if(operation == "updateMany" || operation == "update" || operation == "create"){
                    args.data = await generateHashedPasswordFromUser(args.data)
                }
                else if(operation == "createMany"){
                    if(args.data instanceof Array){
                        const dataListPromise = args.data.map(async(data) => await generateHashedPasswordFromUser(data))
                        args.data = await Promise.all(dataListPromise)
                    }else{
                        args.data = await generateHashedPasswordFromUser(args.data)
                    }   
                }  
                return query(args)
            },
        }
    },
    result: {
        user: {
            comparePassword: {
                needs: { password: true },
                compute(user) {
                    return async (password: string): Promise<Boolean> => {
                        return comparePassword(password, user.password ?? "")
                    }
                },
            },
            generateToken: {
                needs: { id: true },
                compute(user) {
                    return (): string =>{
                        return generateToken({userId: user.id})
                    }
                },
            }
        },
    },
})



async function generateHashedPasswordFromUser(userArgs: any){
    if("password" in userArgs){        
        const hashedPassword = await hashPassword(userArgs["password"])
        userArgs["password"] = hashedPassword
    }
    return userArgs
}