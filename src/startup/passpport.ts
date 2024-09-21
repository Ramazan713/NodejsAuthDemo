import passport from "passport"
import LocalStrategy from "passport-local"
import GoogleStrategy from "passport-google-oauth2"
import { prisma } from "../db/client"
import BearerStrategy from "passport-http-bearer"
import TwitterStrategy from "passport-twitter"
import { decodeToken } from "../utils/auth"
import { BasicStrategy } from "passport-http"


export default () => {
    const basicStrategy = new BasicStrategy(
        async function(username, password, done) {
            const user = await prisma.user.findFirst({where: {email: username}})
            if(!user){
                return done(null, false)
            }
            if(!await user.comparePassword(password)){
                return done(null, false)
            }
            done(null, user);
        }
    )
    
    const bearerStrategy = new BearerStrategy.Strategy(
        async function(token, done) {
            try{
                const result = await decodeToken(token)
                const userId = result.userId
                const user = await prisma.user.findUnique({where: {id: userId}})
                done(null, user)
            }catch(e){
                done(null, false)
            }
        }
      )

    const localStrategy = new LocalStrategy.Strategy({
        usernameField: "email",
    },async function(email, password, done) {
        const user = await prisma.user.findFirst({where: {email}})
        if(user == null) return done(null, false)
    
        const isCorrectPassword = await user.comparePassword(password)
        if(!isCorrectPassword) return done(null, false)
        
        return done(null, user);
    })

    const googleStrategy = new GoogleStrategy.Strategy({
        clientID: process.env['GOOGLE_CLIENT_ID'] as string,
        clientSecret: process.env['GOOGLE_CLIENT_SECRET'] as string,
        callbackURL: '/auth/oauth2/redirect/google',
        scope: [ 'profile', 'email' ],
    }, async function(accessToken, refreshToken, profile, cb){
        const issuer = profile.provider
        const authProvider = await prisma.authProvider.findUnique({
            where: {
                providerId: profile.id,
                providerName: issuer,
            }
        })
        if(!authProvider){
            const user = await prisma.user.create({
                data: {
                    displayName: profile.displayName,
                    email: profile.email,
                    authProviders: {
                        create: {
                            providerName: issuer,
                            providerId: profile.id,
                            accessToken,
                            refreshToken
                        }
                    }
                }
            })
            cb(null, user)
            return
        }
        const user = await prisma.user.findUnique({where: {id: authProvider.userId}})
        cb(null, user ?? false)
    })

    

    const xStrategy = new TwitterStrategy.Strategy({
        consumerKey: process.env.TWITTER_CONSUMER_KEY as string,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET as string,
        callbackURL: "/auth/redirect/twitter"
    }, async function(accessToken, refreshToken, profile, cb){
        const issuer = profile.provider
        const authProvider = await prisma.authProvider.findUnique({
            where: {
                providerId: profile.id,
                providerName: issuer,
            }
        })
        if(!authProvider){
            const user = await prisma.user.create({
                data: {
                    displayName: profile.displayName,
                    email: profile.username,
                    authProviders: {
                        create: {
                            providerName: issuer,
                            providerId: profile.id,
                            accessToken,
                            refreshToken
                        }
                    }
                }
            })
            cb(null, user)
            return
        }
        const user = await prisma.user.findUnique({where: {id: authProvider.userId}})
        cb(null, user ?? false)
    })

    passport.use(basicStrategy)
    passport.use(bearerStrategy)
    passport.use(localStrategy)
    passport.use(googleStrategy)
    passport.use(xStrategy)

    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
  
    passport.deserializeUser(async function(id: number, done) {
        const user = await prisma.user.findUnique({where: {id}})
        done(null, user);
    });
}