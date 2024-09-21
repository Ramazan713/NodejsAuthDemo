import express, { Express } from "express";
import authRouter from "../router/auth"
import passport from "passport"
import session from "express-session";
import cookieParser from "cookie-parser";

export default (app: Express) => {
    app.use("/.well-known",express.static(`.well-known`))
    app.use(express.json())
    app.use(express.urlencoded({extended: true}))

    app.use(cookieParser());
    app.use(session({
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: true,
    }));
    app.use(passport.initialize());
    app.use(passport.session());


    app.use("/auth",authRouter)

    app.get("/", (req,res) => {
        res.send("Hello world")
    })
}