import express from "express"
import passport from "passport"
import { prisma } from "../db/client"
import tokenAuth from "../middleware/tokenAuth"
import Joi from "joi"
import authenticateWithState from "../middleware/authenticateWithState"
import redirectWithState from "../middleware/redirectWithState"

const router = express.Router()

router.get("/", tokenAuth, (req,res) => {
    res.send(req.user ?? "Hello")
})

router.post('/login', passport.authenticate('local'), function(req, res) {
    const user = req.user!
    res.send({
        user,
        token: user.generateToken()
    })
});

router.post('/signup', async function(req, res) {
    const {error, value: {email, password}} = validateAuthUser(req.body)
    if(error) return res.status(400).send(error.message)

    const user = await prisma.user.findFirst({where: {email}})
    if(user) return res.status(400).send("User exists")

    const newUser = await prisma.user.create({
        data: {
            email,
            password
        }
    })
    const token = newUser.generateToken()

    res.send({
        user: newUser,
        token
    })
});



router.get('/login/federated/google', authenticateWithState("google"));
router.get('/oauth2/redirect/google', redirectWithState("google"))

router.get('/login/federated/twitter', authenticateWithState("twitter"));  
router.get('/redirect/twitter', redirectWithState("twitter"));

router.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
});



function validateAuthUser(content: any){
    const object = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).required()
    })
    return object.validate(content)
}

export {
    router as default
}