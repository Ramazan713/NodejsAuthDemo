import express from "express"
import passport from "passport"
import tokenAuth from "../middleware/tokenAuth"
import authenticateWithState from "../middleware/authenticateWithState"
import redirectWithState from "../middleware/redirectWithState"
import * as authController from "../controllers/authController"
import validateId from "../middleware/validateId"

const router = express.Router()


router.get("/", tokenAuth, (req,res) => {
    res.send(req.user ?? "Hello")
})

router.post('/login', passport.authenticate('local'), authController.login);
router.post('/signup', authController.signup);

router.get('/login/federated/google', authenticateWithState("google"));
router.get('/oauth2/redirect/google', redirectWithState("google"))

router.get('/login/federated/twitter', authenticateWithState("twitter"));  
router.get('/redirect/twitter', redirectWithState("twitter"));

router.post('/logout', authController.logOut);


router.get("/mfa/passkey/register_options", tokenAuth, authController.passKeyRegisterOptions)
router.post("/mfa/passkey/register", tokenAuth, authController.passKeyRegister)


router.get("/mfa/passkey/signin_options", authController.passKeySignInOptions)
router.post("/mfa/passkey/signin", authController.passKeySignIn)


router.get("/mfa/totp/generate", authController.mfaTOTPGenerate)
router.post("/mfa/totp/verify", authController.mfaTOTPVerify)
router.post("/mfa/totp/validate", tokenAuth, authController.mfaTOTPValidate)

router.get("/mfa/methods", tokenAuth,authController.mfaMethods)
router.delete("/mfa/methods/:id", validateId(), tokenAuth, authController.deleteMfaMethodById)

export {
    router as default
}