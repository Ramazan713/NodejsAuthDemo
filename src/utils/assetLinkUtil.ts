import * as path from 'path';
import { readJsonFileContent } from './fileUtil';

interface AssetLink {
    relation: string[];
    target: {
      namespace: string;
      package_name: string;
      sha256_cert_fingerprints: string[];
    };
}

export default async function readAssetLinkFile(){
    const filePath = path.join('.well-known', 'assetlinks.json');
    const jsonListResult = await readJsonFileContent(filePath)
    if(!jsonListResult || (jsonListResult as any[]).length == 0) return null
    const result = (jsonListResult as any[])[0] as AssetLink
    return result
}