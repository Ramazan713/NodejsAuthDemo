import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/client"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import { 
    generateRegistrationOptions, 
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
 } from '@simplewebauthn/server';
import { validateSignUpUser, validateTOTPValidate, validateTOTPVerify } from "../validators.ts/auth";
import { getOrigins, getRPID, getRPName } from "../config/auth";


export const login = async (req: Request, res: Response) => {
    const user = req.user!
    if(user.isMfaEnabled){
        const methods = await prisma.mfaMethod.findMany({
            where: {userId: user.id}
        })
        return res.send({
            status: "MFA_REQUIRED",
            methods
        })
    }
    res.send({
        status: "SUCCESS",
        user,
        token: user.generateToken()
    })
}

export const signup = async (req: Request, res: Response) => {
    const {error, value: {email, password}} = validateSignUpUser(req.body)
    if(error) return res.status(400).send(error.message)

    const user = await prisma.user.findFirst({where: {email}})
    if(user) return res.status(400).send("User exists")

    const newUser = await prisma.user.create({
        data: {
            email,password
        }
    })
    const token = newUser.generateToken()

    res.send({
        user: newUser,
        token
    })
}

export const logOut = (req: Request, res: Response, next: NextFunction) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
}

export const passKeySignInOptions = async (req: Request, res: Response) => {
    const user = req.user
    if(!user) return res.status(400).send("invalid user")
    const passkeys = await prisma.passkey.findMany({where: {userId: user.id}})
    
    const options = await generateAuthenticationOptions({
        rpID: getRPID(),
        allowCredentials: passkeys.map((x) => ({
            id: x.credentialId
        }))
    })

    req.session.passkey = {
        signinOptions: {
            challenge: options.challenge
        }
    }

    req.session.save(() => {
        res.send(options)
    })
}

export const passKeySignIn = async (req: Request, res: Response) => {
    const user = req.user
    if(!user) return res.status(400).send("invalid user")

    const passkey = await prisma.passkey.findFirst({
        where: {
            credentialId: req.body.id,
            userId: user.id
        }
    })
    if(!passkey) return res.status(400).send("could not find passkey")
    const currentOptions = req.session.passkey?.signinOptions!

    let verification;
    const origins = await getOrigins()
    try {
        verification = await verifyAuthenticationResponse({
            response: req.body,
            expectedChallenge: currentOptions.challenge,
            expectedOrigin: origins,
            expectedRPID: getRPID(),
            authenticator: {
                credentialID: passkey.credentialId,
                credentialPublicKey: passkey.publicKey,
                counter: passkey.counter,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error });
    }
    if(!verification.verified){
        return res.status(400).send("verification failed")
    }
    await prisma.passkey.update({
        data: {
            counter: verification.authenticationInfo.newCounter
        },
        where: { credentialId: passkey.credentialId }
    })
    res.send({
        token: user.generateToken(),
        user
    })
}

export const passKeyRegisterOptions = async (req: Request, res: Response) => {
    const user = req.user!
    const passkeys = await prisma.passkey.findMany({where: {userId: user.id}})
    const options = await generateRegistrationOptions({
        userName: user.email ?? user.displayName ?? "User",
        userDisplayName: user.displayName ?? user.email ?? "User",
        rpName: getRPName(),
        rpID: getRPID(),
        excludeCredentials: passkeys.map((x) => ({
            id: x.credentialId,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            // Optional
            authenticatorAttachment: 'platform',
        },
        attestationType: 'none',
    })
    req.session.passkey = {
        registerOptions: {
            challenge: options.challenge
        }
    }
    req.session.save(() => {
        res.send(options)
    })
}

export const passKeyRegister = async (req: Request, res: Response) => {
    const currentOptions = req.session.passkey?.registerOptions!
    let verification;
    const origins = await getOrigins()
    try {
        verification = await verifyRegistrationResponse({
            response: req.body,
            expectedChallenge: currentOptions.challenge,
            expectedOrigin: origins,
            expectedRPID: getRPID(),
        });
    } catch (error) {
        console.error(error);
        return res.status(400).send({ error: error });
    }
    const registrationInfo = verification.registrationInfo
    if(verification.verified && registrationInfo != null){
        await prisma.$transaction(async(txn) => {
            const mfa = await txn.mfaMethod.create({
                data: {
                    methodType: "passkey",
                    isActive: true,
                    userId: req.user!.id,
                    methodData: ""
                }
            })
            await txn.passkey.create({
                data: {
                    credentialId: registrationInfo.credentialID,
                    backedUp: registrationInfo.credentialBackedUp,
                    credentialDeviceType: registrationInfo.credentialDeviceType,
                    publicKey: Buffer.from(registrationInfo.credentialPublicKey),
                    transports: req.body.response.transports,
                    counter: 0,
                    userId: req.user!.id,
                    mfaMethodId: mfa.id
                }
            })

            await txn.user.update({
                data: {
                    isMfaEnabled: true
                },
                where: { id: req.user?.id }
            })
            
        })
        
    }
    res.send(verification.verified)
}

export const mfaTOTPGenerate = async (req: Request, res: Response) => {
    var secret = speakeasy.generateSecret();
    const otpauth_url = secret.otpauth_url
    if(!otpauth_url) return res.status(500).send("something whent wrong")
    
    const dataUrl = await QRCode.toDataURL(otpauth_url)

    res.send({
        base32: secret.base32,
        qrCodeUrl: dataUrl
    })
}

export const mfaTOTPVerify = async (req: Request, res: Response) => {
    const user = req.user

    const { error, value: {code} } = validateTOTPVerify(req.body)
    if(error) return res.status(400).send(error.message)

    if(!user) return res.status(401).send("UnAuthrozied")
    
    const totpMethod = await prisma.mfaMethod.findFirst({
        where: {
            userId: user.id,
            methodType: "totp"
        },
        select: { methodData: true }
    })

    if(!totpMethod) return res.status(400).send("invalid method type")

    const verified = speakeasy.totp.verify({
        secret: totpMethod.methodData,
        token: code,
        encoding: "base32"
    });
    if(!verified)  return res.status(400).send("invalid code")
    req.session?.destroy(() => {
        const token = user.generateToken()
        res.send({
            token,
            user
        })
    })
}

export const mfaTOTPValidate = async (req: Request, res: Response) => {
    const { error, value: {secret, token, token2 } } = validateTOTPValidate(req.body)
    if(error) return res.status(400).send(error.message)

    const result1 = speakeasy.totp.verifyDelta({
        secret,
        token,
        encoding: "base32",
        window: 1
    });

    if(result1?.delta != -1) return res.status(400).send("invalid token")

    const result2 = speakeasy.totp.verifyDelta({
        secret,
        token: token2,
        encoding: "base32",
        window: 0
    });
    if(result2?.delta != 0) return res.status(400).send("invalid token2")

    await prisma.$transaction(async (txn) => {
        await txn.mfaMethod.create({
            data: {
                methodType: "totp",
                methodData: secret,
                userId: req.user!.id,
                isActive: true
            }
        })
        await txn.user.update({
            data: {
                isMfaEnabled: true
            },
            where: {
                id: req.user?.id
            }
        })
    })

    res.send("verified")
}

export const mfaMethods = async (req: Request, res: Response) => {
    const methods = await prisma.mfaMethod.findMany({
        where: {
            userId: req.user?.id
        }
    })
    res.send(methods)
}

export const deleteMfaMethodById = async (req: Request, res: Response) => {
    const userId = req.user?.id
    const mfaId = Number.parseInt(req.params.id)
    const mfaMethod = await prisma.mfaMethod.findFirst({
        where: {
            id: mfaId,
            userId: userId
        }
    })
    if(!mfaMethod) return res.status(400).send("invalid request")
    await prisma.$transaction(async (txn) => {
        await txn.mfaMethod.delete({
            where: {id: mfaId}
        })
        const mfaLength = await txn.mfaMethod.count({
            where: {userId: userId},
        })
        if(mfaLength === 0){
            await txn.user.update({
                data: {
                    isMfaEnabled: false
                },
                where: {id: userId}
            })
        }

    })
    res.send(mfaMethod)
}


