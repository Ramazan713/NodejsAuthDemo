import session from "express-session";
import ProviderState from "../dtos/providerState";
import { User as PrismaUser } from "../models/user"


declare global {
    namespace Express{
        interface User extends PrismaUser{}
    }
}

declare module 'express-session' {
    interface SessionData {
        state?: ProviderState
    }
}