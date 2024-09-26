import Joi from "joi"



export function validateSignUpUser(content: any){
    const object = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).required()
    })
    return object.validate(content)
}


export function validateTOTPVerify(content: any){
    const object = Joi.object({
        code: Joi.string().length(6).required()
    })
    return object.validate(content)
}


export function validateTOTPValidate(content: any){
    const object = Joi.object({
        token: Joi.string().length(6).required(),
        token2: Joi.string().length(6).required(),
        secret: Joi.string().required()
    })
    return object.validate(content)
}