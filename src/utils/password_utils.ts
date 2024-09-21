import bcrypt from "bcrypt"


async function comparePassword(password: string, encrypted: string): Promise<Boolean>{
    return bcrypt.compare(password, encrypted)
}

async function hashPassword(password: string): Promise<string>{
    const salt = await bcrypt.genSalt()
    return bcrypt.hash(password, salt)
}


export{
    comparePassword,
    hashPassword
}