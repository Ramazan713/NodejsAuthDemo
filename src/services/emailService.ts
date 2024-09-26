
import nodemailer from "nodemailer"


const emailService = nodemailer.createTransport({
    host: process.env.EMAIL_HOST_SERVICE as string,
    port: Number(process.env.EMAIL_PORT_SERVICE),
    secure: true,
    auth: {
      user: process.env.EMAIL_AUTH_USER_SERVICE,
      pass: process.env.EMAIL_AUTH_PASS_SERVICE,
    },
});


export default emailService