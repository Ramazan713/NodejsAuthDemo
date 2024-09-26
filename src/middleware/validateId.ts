import { NextFunction, Response, Request } from "express";


export default function(paramName: string = "id"){
    return (req: Request, res: Response, next: NextFunction) => {
        const param = Number(req.params[paramName])
        
        if(Number.isInteger(param)){
            return next()
        }
        res.status(400).send(`invalid ${paramName} parameter`)
    }
}