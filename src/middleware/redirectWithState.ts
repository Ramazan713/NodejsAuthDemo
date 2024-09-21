import { NextFunction, Response, Request } from "express";
import ProviderState from "../dtos/providerState"
import passport from "passport";
import { User } from "../models/user";

export default function(provider: string){
    return async function(req: Request, res: Response, next: NextFunction) {
        return passport.authenticate(provider, (err?: string, user?: User) => {
            const stateQueryRaw = req.query.state             
            const stateQuery = stateQueryRaw && JSON.parse(decodeURIComponent(stateQueryRaw as string)) as ProviderState
            const state = stateQuery || req.session.state 

            if(!state){
                return res.status(400).send("something went wrong")
            }
            const redirectUri = state.redirectUri         
            if(state.source === "mobile"){
                const token = user?.generateToken()
                return res.redirect(`${state.redirectUri}?status=success&token=${token}`)
            }
            if(redirectUri){
                return res.redirect(redirectUri)
            }
            res.send(user)
        })(req, res, next)
    }
}