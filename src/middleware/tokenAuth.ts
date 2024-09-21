import { NextFunction, Response, Request } from "express";
import passport from "passport";


export default function(req: Request, res: Response, next: NextFunction){
    passport.authenticate("bearer",{session: false})(req, res, next)
}