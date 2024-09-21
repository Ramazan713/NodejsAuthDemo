import { NextFunction, Response, Request } from "express";
import ProviderState, {Source} from "../dtos/providerState"
import passport from "passport";

export default function(provider: string){
    return async function(req: Request, res: Response, next: NextFunction) {
        let source: Source = req.query.source === "mobile" ? "mobile": "web"
        const stateJson: ProviderState = {
            source,
            redirectUri: req.query.redirectUri as (string | undefined)
        } 
        let state = encodeURIComponent(JSON.stringify(stateJson))
        req.session.state = stateJson
        
        passport.authenticate(provider, {state})(req, res, next)
    }
}