import readAssetLinkFile from "../utils/assetLinkUtil"
import { getApkHashKey } from "../utils/auth"

export const getRPID = (): string  => {
    return process.env.RP_ID as string
}

export const getRPName = (): string => {
    return process.env.RP_NAME as string
}

export const getOrigins = async (): Promise<string[]> => {
    const assetLinkContent = await readAssetLinkFile()
    if(!assetLinkContent) return []

    return assetLinkContent.target.sha256_cert_fingerprints.map((sha256) => {
        return getApkHashKey(sha256)
    })
}