import { NextFunction, Response, Request } from "express";
import passport from "passport";


const tokenAuth = function(req: Request, res: Response, next: NextFunction){
    passport.authenticate("bearer",{session: false})(req, res, next)
}

tokenAuth.withArgs = function(session: boolean = false){
    return (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate("bearer",{session: session})(req, res, next)
    }
}

export default tokenAuth