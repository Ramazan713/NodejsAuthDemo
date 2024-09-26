import express from "express";
import { config } from "dotenv";
import routesStartup from "./startup/routes"
import passportStartup from "./startup/passpport"
import "./startup/types"

config()

const app = express()

passportStartup()
routesStartup(app)

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`listening on port: http://localhost:${port}`)
})
